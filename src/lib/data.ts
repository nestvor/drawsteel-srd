// Loads the committed JSON produced by `npm run extract` and exposes typed-ish
// accessors. JSON is bundled at build time via Vite glob import (eager), so no
// filesystem access is needed and the site stays fully static.
import { slugify } from './url';

const modules = import.meta.glob<{ default: any[] }>('../data/json/*.json', { eager: true });

const tables: Record<string, any[]> = {};
for (const [path, mod] of Object.entries(modules)) {
	const name = path.split('/').pop()!.replace(/\.json$/, '');
	tables[name] = (mod as any).default as any[];
}

export interface Entry {
	id: string;
	name: string;
	description?: string;
	content?: string;
	_source?: string;
	_sourceType?: string;
	[k: string]: any;
}

/** All entries for a category file (e.g. 'classes', 'rules'). */
export function all(category: string): Entry[] {
	return (tables[category] ?? []) as Entry[];
}

/** Entries sorted alphabetically by name. */
export function allSorted(category: string): Entry[] {
	return [...all(category)].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/** The url slug for an entry (prefers a stable slug of the name, falls back to id). */
export function entrySlug(e: Entry): string {
	return slugify(e.name || e.id);
}

/** Find one entry in a category by its slug. */
export function bySlug(category: string, slug: string): Entry | undefined {
	return all(category).find(e => entrySlug(e) === slug);
}

/** [{ params: { slug } , props: { entry } }] for getStaticPaths. */
export function staticPaths(category: string) {
	return all(category).map(entry => ({ params: { slug: entrySlug(entry) }, props: { entry } }));
}
