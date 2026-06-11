// Client-side Pagefind helper shared by the header dropdown and the /search page.
// Pagefind's JS bundle only exists in a built site (dist/pagefind/pagefind.js),
// so it's imported lazily at runtime and the dynamic import is hidden from Vite.
import { CATEGORIES } from './categories';

export interface Hit {
	url: string;
	title: string;
	excerpt: string;
	category?: string;
}
export interface Results {
	hits: Hit[];
	total: number;
}

let pagefindPromise: Promise<any> | null = null;

async function loadPagefind(base: string): Promise<any> {
	if (!pagefindPromise) {
		const url = `${base}pagefind/pagefind.js`;
		pagefindPromise = import(/* @vite-ignore */ url).then(async (pf: any) => {
			// Result URLs are indexed root-relative to dist; baseUrl re-prefixes the
			// GitHub Pages project path so links resolve on the deployed subpath.
			await pf.options({ baseUrl: base });
			return pf;
		});
	}
	return pagefindPromise;
}

/** Derive a human section label (e.g. "Classes") from a result URL. */
function categoryFromUrl(base: string, url: string): string | undefined {
	let path = url;
	if (base !== '/' && path.startsWith(base)) path = path.slice(base.length);
	path = path.replace(/^\//, '');
	const seg = path.split('/')[0];
	const cat = CATEGORIES.find(c => c.key === seg);
	if (cat) return cat.title;
	if (seg === 'about') return 'About';
	if (!seg) return 'Home';
	return undefined;
}

/**
 * Run a search. Pass `limit` for the dropdown shortlist; omit it on the full
 * results page. Returns the (possibly truncated) hits plus the total count.
 */
export async function runSearch(base: string, query: string, limit?: number): Promise<Results> {
	const q = query.trim();
	if (!q) return { hits: [], total: 0 };

	const pf = await loadPagefind(base);
	const res = await pf.search(q);
	const total = res.results.length;
	const chosen = typeof limit === 'number' ? res.results.slice(0, limit) : res.results;

	const hits: Hit[] = await Promise.all(
		chosen.map(async (r: any) => {
			const d = await r.data();
			// Collapse any accidental double slashes from baseUrl joining (but keep
			// the protocol's "://"), so links resolve on the deployed subpath.
			const url = String(d.url).replace(/([^:])\/{2,}/g, '$1/');
			return {
				url,
				title: d.meta?.title || url,
				excerpt: d.excerpt || '',
				category: categoryFromUrl(base, url)
			};
		})
	);
	return { hits, total };
}
