// @ts-check
import { defineConfig } from 'astro/config';

// Project page on GitHub Pages: https://nestvor.github.io/drawsteel-srd/
// `site` + `base` must match the repo name; all internal links go through
// src/lib/url.ts so they respect the base path.
export default defineConfig({
	site: 'https://nestvor.github.io',
	base: '/drawsteel-srd/',
	trailingSlash: 'ignore',
	build: {
		format: 'directory'
	}
});
