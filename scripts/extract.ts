/*
 * Draw Steel SRD — data extraction
 * --------------------------------
 * Imports the forgesteel dataset (TypeScript built via FactoryLogic) and writes
 * plain JSON into src/data/json/. This is the ONE place that touches forgesteel's
 * source + dependency graph; the Astro site only ever reads the committed JSON.
 *
 * Run with Node 20+/24:  npm run extract   (uses tsconfig.extract.json path aliases)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SourcebookData } from '@/data/sourcebook-data';
import { RulesData } from '@/data/rules-data';
import { ConditionData } from '@/data/condition-data';
import { AbilityData } from '@/data/ability-data';
import { AbilityLogic } from '@/logic/ability-logic';
import type { Sourcebook } from '@/models/sourcebook';
import type { Ability } from '@/models/ability';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../src/data/json');

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const slugify = (s: string): string =>
	s
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

const prettify = (camel: string): string =>
	camel
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, c => c.toUpperCase())
		.trim();

/** Does this object structurally match the Ability interface? */
const isAbility = (o: unknown): o is Ability =>
	!!o &&
	typeof o === 'object' &&
	Array.isArray((o as Ability).sections) &&
	Array.isArray((o as Ability).distance) &&
	typeof (o as Ability).type === 'object' &&
	(o as Ability).type !== null &&
	'usage' in (o as Ability).type;

/**
 * Walk an arbitrary value; for every embedded Ability, attach a `_fmt` block of
 * display-ready strings computed with forgesteel's own (hero-independent) logic,
 * so the Astro renderer stays dumb. Cycle-safe.
 */
const enrich = (value: unknown, seen = new WeakSet<object>()): void => {
	if (!value || typeof value !== 'object') return;
	if (seen.has(value as object)) return;
	seen.add(value as object);

	if (isAbility(value)) {
		const a = value as Ability & { _fmt?: unknown };
		try {
			a._fmt = {
				keywords: AbilityLogic.getKeywords(a),
				distance: a.distance.map(d => AbilityLogic.getDistance(d, a)).filter(Boolean)
			};
		} catch {
			a._fmt = { keywords: a.keywords ?? [], distance: [] };
		}
	}

	if (Array.isArray(value)) {
		for (const item of value) enrich(item, seen);
	} else {
		for (const key of Object.keys(value as Record<string, unknown>)) {
			enrich((value as Record<string, unknown>)[key], seen);
		}
	}
};

/** Deep clone via JSON to strip functions/undefined and guarantee serialisability. */
const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const written: { file: string; count: number }[] = [];

const write = (name: string, data: unknown[]): void => {
	const file = path.join(OUT_DIR, `${name}.json`);
	fs.writeFileSync(file, JSON.stringify(data, null, '\t') + '\n');
	written.push({ file: `${name}.json`, count: data.length });
};

// ---------------------------------------------------------------------------
// gather sourcebooks
// ---------------------------------------------------------------------------

const sourcebooks = Object.values(SourcebookData) as Sourcebook[];

type SourceMeta = { _source: string; _sourceType: string };

/**
 * Collect one content array (keyed by `field`) across every sourcebook, tagging
 * each entry with its source. De-duplicates by id (first source wins).
 */
const collect = <K extends keyof Sourcebook>(field: K) => {
	const byId = new Map<string, unknown>();
	const anon: unknown[] = [];
	for (const sb of sourcebooks) {
		const arr = sb[field];
		if (!Array.isArray(arr)) continue;
		for (const raw of arr) {
			const meta: SourceMeta = { _source: sb.name, _sourceType: String(sb.type) };
			const entry = { ...(raw as Record<string, unknown>), ...meta };
			const id = (raw as { id?: string }).id;
			if (id) {
				if (!byId.has(id)) byId.set(id, entry);
			} else {
				anon.push(entry);
			}
		}
	}
	return [...byId.values(), ...anon];
};

const emitSourcebookCategory = <K extends keyof Sourcebook>(name: string, field: K) => {
	const items = collect(field);
	enrich(items);
	write(name, plain(items));
};

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

fs.mkdirSync(OUT_DIR, { recursive: true });

// Sourcebook-derived categories
emitSourcebookCategory('ancestries', 'ancestries');
emitSourcebookCategory('cultures', 'cultures');
emitSourcebookCategory('careers', 'careers');
emitSourcebookCategory('classes', 'classes');
emitSourcebookCategory('complications', 'complications');
emitSourcebookCategory('domains', 'domains');
emitSourcebookCategory('kits', 'kits');
emitSourcebookCategory('perks', 'perks');
emitSourcebookCategory('titles', 'titles');
emitSourcebookCategory('items', 'items');
emitSourcebookCategory('imbuements', 'imbuements');
emitSourcebookCategory('monsters', 'monsterGroups');
emitSourcebookCategory('terrain', 'terrain');
emitSourcebookCategory('montages', 'montages');
emitSourcebookCategory('negotiations', 'negotiations');
emitSourcebookCategory('projects', 'projects');
emitSourcebookCategory('skills', 'skills');
emitSourcebookCategory('languages', 'languages');

// Standalone: rules glossary
{
	const rules = Object.values(RulesData as unknown as Record<string, { label: string; content: string }>)
		.filter(r => r && typeof r === 'object' && 'label' in r)
		.map(r => ({ id: slugify(r.label), name: r.label, content: r.content }));
	write('rules', rules);
}

// Standalone: conditions (static string fields)
{
	const conditions = Object.entries(ConditionData as unknown as Record<string, string>)
		.filter(([, v]) => typeof v === 'string')
		.map(([key, content]) => ({ id: slugify(key), name: prettify(key), content }));
	write('conditions', conditions);
}

// Standalone: standard abilities (free strikes, etc.)
{
	const abilities = (Object.values(AbilityData) as Ability[]).filter(a => a && typeof a === 'object' && a.id);
	enrich(abilities);
	write('abilities', plain(abilities));
}

// ---------------------------------------------------------------------------
// summary
// ---------------------------------------------------------------------------
console.log(`\nExtracted to ${path.relative(process.cwd(), OUT_DIR)}:`);
for (const w of written.sort((a, b) => a.file.localeCompare(b.file))) {
	console.log(`  ${w.file.padEnd(20)} ${w.count}`);
}
console.log(`\n${sourcebooks.length} sourcebooks: ${sourcebooks.map(s => s.name).join(', ')}`);
