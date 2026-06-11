/*
 * build-monster-basics.mjs
 * ------------------------
 * Deterministic pipeline that rebuilds src/data/json/monster-basics.json from a
 * local plain-text extract (monster_basics.txt, gitignored). For each section it:
 *   1. splits the extract at the section headings (sequential, in file order),
 *   2. cleans PDF-extraction noise (page furniture, ¥ bullets, hyphenation),
 *   3. reformats data blocks (EV grid, modifier tables, stat block, icon legend),
 *   4. inserts the original SVG diagrams (Using Minions),
 *   5. re-flows hard-wrapped prose into paragraphs + sub-headings.
 *
 * Re-run after re-extracting the chapter:
 *   node scripts/build-monster-basics.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'monster_basics.txt');
const OUT = path.join(ROOT, 'src/data/json/monster-basics.json');

const HEADINGS = [
	{ id: 'introduction', name: 'Introduction', heading: 'Basics' },
	{ id: 'reading-a-stat-block', name: 'Reading a Stat Block', heading: 'Languages' },
	{ id: 'villain-actions', name: 'Villain Actions', heading: 'Villain Actions' },
	{ id: 'creature-organization', name: 'Creature Organization', heading: 'Creature Organization' },
	{ id: 'creature-roles', name: 'Creature Roles', heading: 'Creature Roles' },
	{ id: 'special-creature-rules', name: 'Special Creature Rules', heading: 'Creatures Who Defend' },
	{ id: 'harmless-creatures', name: 'Harmless Creatures', heading: 'Harmless Creatures' },
	{ id: 'malice', name: 'Malice', heading: 'Malice' },
	{ id: 'using-minions', name: 'Using Minions', heading: 'Using Minions' },
	{ id: 'stat-block-icons', name: 'Stat Block Icons', heading: 'Stat Block Icons' },
	{ id: 'captains', name: 'Captains', heading: 'Attached Squad Captain' },
	{ id: 'building-encounters', name: 'Building Encounters', heading: 'Step-by-Step Encounter Building' },
	{ id: 'quick-encounter-building', name: 'Quick Encounter Building', heading: 'Quick Encounter Building' },
	{ id: 'roles-and-organization', name: 'Roles & Organization in Play', heading: 'Using Creature Roles and Organization' },
	{ id: 'choosing-a-map', name: 'Choosing a Map', heading: 'Choosing a Map' },
	{ id: 'encounter-objectives', name: 'Encounter Objectives', heading: 'Encounter Objectives' },
	{ id: 'running-encounters', name: 'Running Encounters', heading: 'Running Encounters' },
	{ id: 'reskinning-monsters', name: 'Reskinning Monsters', heading: 'Reskinning Monsters' },
	{ id: 'adjusting-monster-levels', name: 'Adjusting Monster Levels', heading: 'Adjusting Monster Levels' }
];

const clean = raw => raw
	.replace(/\r/g, '')
	.replace(/^Monster Basics\s*$/gm, '')
	.replace(/^Draw Steel\s*\d+\s*$/gm, '')
	.replace(/^[ \t]*¥[ \t]*/gm, '- ')
	.replace(/([A-Za-z])-\n([a-z])/g, '$1$2')
	.replace(/^\s*\d+\s*$/gm, '')
	.replace(/\n{3,}/g, '\n\n')
	.trim();

// ---- data-block reformatting (operates on a section's raw, cleaned text) ----
function spliceLines(content, startTest, endTest, replacement) {
	const lines = content.split('\n');
	const a = lines.findIndex(startTest);
	if (a < 0) return content;
	const b = lines.findIndex((l, i) => i >= a && endTest(l));
	if (b < 0) return content;
	lines.splice(a, b - a + 1, replacement);
	return lines.join('\n');
}
const eq = t => l => l.trim() === t;
const rx = r => l => r.test(l.trim());

function reformatTables(id, content) {
	if (id === 'building-encounters') {
		content = spliceLines(content, eq('Number of Heroes*'), rx(/^10th\s+24\s+48/), [
			'| Hero level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |',
			'| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
			'| 1st | 6 | 12 | 18 | 24 | 30 | 36 | 42 | 48 |',
			'| 2nd | 8 | 16 | 24 | 32 | 40 | 48 | 56 | 64 |',
			'| 3rd | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 |',
			'| 4th | 12 | 24 | 36 | 48 | 60 | 72 | 84 | 96 |',
			'| 5th | 14 | 28 | 42 | 56 | 70 | 84 | 98 | 112 |',
			'| 6th | 16 | 32 | 48 | 64 | 80 | 96 | 112 | 128 |',
			'| 7th | 18 | 36 | 54 | 72 | 90 | 108 | 126 | 144 |',
			'| 8th | 20 | 40 | 60 | 80 | 100 | 120 | 140 | 160 |',
			'| 9th | 22 | 44 | 66 | 88 | 110 | 132 | 154 | 176 |',
			'| 10th | 24 | 48 | 72 | 96 | 120 | 144 | 168 | 192 |',
			'',
			'*Columns are the number of heroes; add one hero for every 2 average Victories.*'
		].join('\n'));
	}
	if (id === 'adjusting-monster-levels') {
		content = spliceLines(content, rx(/^Role\/Organization Role Modifier/), eq('Solo +30 +2'), [
			'| Role | Role modifier | Damage modifier |', '| --- | --- | --- |',
			'| Ambusher | +20 | +1 |', '| Artillery | +10 | +1 |', '| Brute | +30 | +1 |',
			'| Controller | +10 | +0 |', '| Defender | +30 | +0 |', '| Harrier | +20 | +0 |',
			'| Hexer | +10 | +0 |', '| Mount | +20 | +0 |', '| Support | +20 | +0 |',
			'| Elite* | +0 | +1 |', '| Leader | +30 | +1 |', '| Solo | +30 | +2 |'
		].join('\n'));
		content = spliceLines(content, eq('Organization Organization Modifier'), eq('Solo × 6'), [
			'| Organization | Modifier |', '| --- | --- |',
			'| Minion (Stamina only) | × 0.125 |', '| Minion | × 0.5 |', '| Horde | × 0.5 |',
			'| Platoon | × 1 |', '| Leader | × 2 |', '| Elite | × 2 |',
			'| Solo (Stamina only) | × 5 |', '| Solo | × 6 |'
		].join('\n'));
		content = spliceLines(content, eq('Tier 1 = 0.6'), eq('Tier 3 = 1.4'), [
			'| Power-roll tier | Modifier |', '| --- | --- |',
			'| Tier 1 | 0.6 |', '| Tier 2 | 1.1 |', '| Tier 3 | 1.4 |'
		].join('\n'));
	}
	if (id === 'harmless-creatures') {
		content = spliceLines(content, eq('Immunity: — Weakness: —'), eq('Size Speed Stamina Stability Free Strike'), [
			'<div class="statblock">',
			'<div class="sb-head"><span class="sb-name">Noncombatant</span><span class="sb-sub">Humanoid or Animal</span></div>',
			'<div class="sb-stats"><span><strong>Size</strong> 1S–2</span><span><strong>Speed</strong> 5</span><span><strong>Stamina</strong> 8</span><span><strong>Stability</strong> 0</span><span><strong>Free Strike</strong> 1</span></div>',
			'<div class="sb-stats"><span><strong>Immunity</strong> —</span><span><strong>Weakness</strong> —</span><span><strong>Movement</strong> —</span></div>',
			'<div class="sb-chars"><span><strong>Mig</strong> +0</span><span><strong>Agi</strong> +0</span><span><strong>Rea</strong> +0</span><span><strong>Inu</strong> +0</span><span><strong>Pre</strong> +0</span></div>',
			'</div>'
		].join('\n'));
	}
	if (id === 'stat-block-icons') {
		const lines = content.split('\n');
		const start = lines.findIndex(l => /^[a-z!]\s+[A-Z]/.test(l.trim()));
		if (start >= 0) {
			const items = [];
			for (let i = start; i < lines.length; i++) {
				const t = lines[i].trim();
				if (!t) continue;
				const m = t.match(/^([A-Za-z!])\s+(.*)$/);
				if (m && m[1].length === 1) items.push(m[2]);
				else if (items.length) items[items.length - 1] += ' ' + t;
			}
			lines.splice(start, lines.length - start, items.map(x => '- ' + x).join('\n'));
			content = lines.join('\n');
		}
	}
	return content;
}

// ---- original SVG diagrams (Using Minions) ----------------------------------
function diagrams(content) {
	const fig = svg => `<figure class='mb-diagram'>${svg}</figure>`;
	let toks = '';
	for (let i = 0; i < 8; i++) { const cx = 56 + i * 64; toks += `<circle cx='${cx}' cy='70' r='18' class='mb-tok'/><text x='${cx}' y='75' text-anchor='middle' font-size='13' font-weight='700' class='mb-tnum'>5</text>`; }
	let ticks = '';
	for (let k = 0; k <= 8; k++) { const x = 40 + k * 70; if (k > 0 && k < 8) ticks += `<line x1='${x}' y1='118' x2='${x}' y2='148' class='mb-seg'/>`; ticks += `<text x='${x}' y='166' text-anchor='middle' font-size='11' class='mb-dim'>${k * 5}</text>`; }
	const svg1 = `<svg viewBox='0 0 640 200' role='img' aria-label='Eight minions with five Stamina each form a single forty-point squad pool'><text x='320' y='26' text-anchor='middle' font-size='15' font-weight='700' class='mb-label'>8 minions × 5 Stamina = one 40-point pool</text>${toks}<rect x='40' y='118' width='560' height='30' rx='4' class='mb-pool'/>${ticks}<text x='320' y='190' text-anchor='middle' font-size='12' class='mb-dim'>Every 5 damage removes one minion (40 → 35 → … → 0)</text></svg>`;
	let atoks = '';
	[90, 210, 330, 500].forEach((cx, i) => { atoks += `<circle cx='${cx}' cy='112' r='24' class='${i < 3 ? 'mb-tok' : 'mb-tok-safe'}'/><text x='${cx}' y='117' text-anchor='middle' font-size='13' font-weight='700' class='mb-tnum'>5</text>`; });
	const svg2 = `<svg viewBox='0 0 640 210' role='img' aria-label='An area ability catches three of four minions; the pool loses fifteen Stamina, not eighteen'><text x='320' y='26' text-anchor='middle' font-size='15' font-weight='700' class='mb-label'>Area damage — 6 to each target in the area</text><ellipse cx='210' cy='112' rx='184' ry='66' class='mb-burst'/>${atoks}<text x='500' y='154' text-anchor='middle' font-size='11' class='mb-dim'>safe</text><text x='320' y='198' text-anchor='middle' font-size='12' class='mb-dim'>3 caught → pool loses 15 (capped at 3 × 5), not 18 — the 4th is untouched</text></svg>`;
	const ah = `<defs><marker id='mb-ah' viewBox='0 0 10 10' refX='8' refY='5' markerWidth='7' markerHeight='7' orient='auto-start-reverse'><path d='M0,0 L10,5 L0,10 z' class='mb-accent'/></marker></defs>`;
	let mins = '';
	[64, 115, 166].forEach(cy => { mins += `<circle cx='84' cy='${cy}' r='18' class='mb-tok'/><text x='84' y='${cy + 5}' text-anchor='middle' font-size='12' font-weight='700' class='mb-tnum'>M</text>`; });
	const foes = `<circle cx='498' cy='86' r='28' class='mb-foe'/><text x='498' y='90' text-anchor='middle' font-size='12' font-weight='700' class='mb-tnum'>S</text><text x='498' y='128' text-anchor='middle' font-size='11' class='mb-dim'>Shadow</text><circle cx='498' cy='172' r='28' class='mb-foe'/><text x='498' y='176' text-anchor='middle' font-size='12' font-weight='700' class='mb-tnum'>C</text><text x='498' y='214' text-anchor='middle' font-size='11' class='mb-dim'>Conduit</text>`;
	const arrows = `<path d='M104,66 L466,82' class='mb-arrow'/><text x='285' y='62' text-anchor='middle' font-size='13' font-weight='700' class='mb-accent'>4</text><path d='M104,118 L468,165' class='mb-arrow'/><text x='270' y='139' text-anchor='middle' font-size='13' font-weight='700' class='mb-accent'>4</text><path d='M104,162 L470,178' class='mb-arrow'/><text x='290' y='185' text-anchor='middle' font-size='13' font-weight='700' class='mb-accent'>+2</text>`;
	const svg3 = `<svg viewBox='0 0 640 230' role='img' aria-label='Three minions act together: one strikes the shadow for 4, two strike the conduit for 4 plus 2'>${ah}<text x='320' y='24' text-anchor='middle' font-size='14' font-weight='700' class='mb-label'>Squad action — an extra minion on the same target adds its free strike</text>${mins}${foes}${arrows}</svg>`;
	return content
		.replace('Squad Size', `${fig(svg1)}\n\nSquad Size`)
		.replace('Area Damage', `${fig(svg2)}\n\nArea Damage`)
		.replace('Squad Action', `${fig(svg3)}\n\nSquad Action`);
}

// ---- re-flow hard-wrapped prose --------------------------------------------
const SMALL = /^(a|an|the|of|to|and|or|in|on|for|with|by|as|at|per|vs|&)$/i;
function isHeading(t) {
	if (t.length < 2 || t.length > 48) return false;
	if (!/^[A-Z0-9"“]/.test(t)) return false;
	if (/[.,;:]$/.test(t)) return false; // allow ! ? ) and no terminal punctuation
	const words = t.split(/\s+/);
	if (words.length > 8) return false;
	const content = words.filter(w => !SMALL.test(w));
	if (!content.length) return false;
	const capped = content.filter(w => /^[A-Z0-9"“(]/.test(w)).length;
	return capped / content.length >= 0.6;
}
const endsParagraph = t => /[.!?]["')\]”’]?$/.test(t) && t.length < 62;
const stripIcon = t => t.replace(/^[bdemprstvx] (?=[A-Z])/, '');

function reflow(content) {
	const lines = content.split('\n');
	const blocks = [];
	let para = [];
	const flush = () => { if (para.length) { blocks.push(para.join(' ')); para = []; } };
	for (let i = 0; i < lines.length; i++) {
		const t = stripIcon(lines[i].trim());
		if (t === '') { flush(); continue; }
		if (/^\|/.test(t)) { flush(); const tbl = []; while (i < lines.length && /^\s*\|/.test(lines[i])) tbl.push(lines[i].trim()), i++; i--; blocks.push(tbl.join('\n')); continue; }
		if (/^</.test(t)) { flush(); const html = []; while (i < lines.length && lines[i].trim() !== '' && /^</.test(lines[i].trim())) html.push(lines[i].trim()), i++; i--; blocks.push(html.join('\n')); continue; }
		if (/^#{1,6}\s/.test(t)) { flush(); blocks.push(t); continue; }
		if (/^- /.test(t)) { flush(); const items = []; while (i < lines.length) { const lt = lines[i].trim(); if (lt === '') break; if (/^- /.test(lt)) items.push(lt); else if (items.length && !isHeading(lt) && !/^[|<]/.test(lt)) items[items.length - 1] += ' ' + lt; else break; i++; } i--; blocks.push(items.join('\n')); continue; }
		if (isHeading(t)) { flush(); blocks.push('### ' + t); continue; }
		para.push(t);
		if (endsParagraph(t)) flush();
	}
	flush();
	return blocks.join('\n\n');
}

// ---- run --------------------------------------------------------------------
if (!fs.existsSync(SRC)) { console.error(`Missing ${SRC}`); process.exit(1); }
const lines = fs.readFileSync(SRC, 'utf8').replace(/\r/g, '').split('\n');
const norm = s => s.trim().toLowerCase();
const found = [];
let cursor = 0;
for (const h of HEADINGS) {
	const idx = lines.findIndex((l, i) => i >= cursor && norm(l) === norm(h.heading));
	if (idx === -1) { console.warn(`heading not found: "${h.heading}"`); continue; }
	found.push({ ...h, line: idx });
	cursor = idx + 1;
}

const out = found.map((h, i) => {
	const end = i + 1 < found.length ? found[i + 1].line : lines.length;
	let content = clean(lines.slice(h.line + 1, end).join('\n'));
	content = reformatTables(h.id, content);
	if (h.id === 'using-minions') content = diagrams(content);
	content = reflow(content);
	return { id: h.id, name: h.name, content };
});

fs.writeFileSync(OUT, JSON.stringify(out, null, '\t') + '\n');
console.log(`Wrote ${out.length} sections`);
for (const s of out) console.log(`  ${s.name.padEnd(28)} ${(s.content.match(/^### /gm) || []).length} headings, ${s.content.length} chars`);
