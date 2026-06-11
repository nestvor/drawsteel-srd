// Base-path-aware URL + slug helpers.
// Astro injects the configured `base` ('/drawsteel-srd/') as import.meta.env.BASE_URL.
// Every internal link must go through href() so it resolves correctly on the
// GitHub Pages project subpath.

const BASE = import.meta.env.BASE_URL;

/** Build an absolute (base-prefixed) site path, e.g. href('/classes/fury'). */
export function href(p = '/'): string {
	const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
	const path = p.startsWith('/') ? p : `/${p}`;
	return `${base}${path}`.replace(/([^:])\/{2,}/g, '$1/');
}

/** URL-safe slug from an id or name. */
export function slugify(s: string): string {
	return (s || '')
		.toString()
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
