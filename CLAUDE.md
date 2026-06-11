# CLAUDE.md

Guidance for working in this repo. Keep it current when the architecture changes.

## What this is

A static, searchable **rules reference (SRD)** for the **Draw Steel** TTRPG, built from the
[forgesteel](https://github.com/andyaiken/forgesteel) dataset and deployed to GitHub Pages at
`https://nestvor.github.io/drawsteel-srd/`. Unofficial fan project under the Draw Steel Creator License.

## The core mental model: a two-stage pipeline

```
vendor/forgesteel (git submodule, TypeScript data via FactoryLogic)
        │   npm run extract   (scripts/extract.ts — the ONLY place that touches forgesteel)
        ▼
src/data/json/*.json   (committed plain data, 21 category files)
        │   npm run build     (astro build && pagefind --site dist)
        ▼
dist/   →  GitHub Pages
```

`scripts/extract.ts` imports forgesteel modules, normalises everything to plain JSON, and bakes
display-ready ability strings (`_fmt` blocks via forgesteel's own `AbilityLogic`) so the Astro
renderer stays "dumb". **The site only ever reads the committed JSON** — the deploy build never
touches forgesteel's dependency graph. When changing how something renders, you almost always edit
the Astro components, not the data.

## Commands

- `npm run dev` — local dev server (search is a no-op until a build exists)
- `npm run build` — `astro build` + Pagefind search index → `dist/`
- `npm run preview` — serve the built `dist/` at `/drawsteel-srd/` (search works here)
- `npm run extract` — regenerate `src/data/json/*.json` from the forgesteel submodule
- `npm run refresh` — bump the submodule to latest, then re-extract

**Node**: requires Node 20.17+/22 (`.nvmrc` pins 22). `npm run extract` needs the forgesteel
submodule checked out (`git submodule update --init vendor/forgesteel`). If `node`/`npm` aren't on
PATH, they may be managed by a version manager (fnm/nvm) — resolve the install dir and prepend it.

## Layout

| Path | Purpose |
| --- | --- |
| `scripts/extract.ts` | forgesteel → JSON (path aliases via `tsconfig.extract.json`, `@/` → forgesteel src) |
| `src/lib/categories.ts` | **The registry.** Every category's key, page `style`, sidebar `group`, blurb. Drives sidebar, home grid, and routing. Start here. |
| `src/lib/data.ts` | Eager Vite glob-import of the JSON; `all`/`allSorted`/`bySlug`/`staticPaths` |
| `src/lib/url.ts` | `href()` (base-path aware — **all internal links must go through it**), `slugify()` |
| `src/lib/markdown.ts` | markdown-it render; `html:true` + table-delimiter normalisation (see Gotchas) |
| `src/lib/search.ts` | Client-side Pagefind helper (shared by the dropdown and `/search`) |
| `src/components/` | `Feature` (recursive), `Ability`, `StatBlock`, `Crafting`, `EntryDetail`, `Search`, `Sidebar` |
| `src/pages/` | home, about, **search**, generic `[category]/` index+detail, dedicated `classes/` & `monsters/` |
| `src/layouts/BaseLayout.astro` | shell: top-bar (brand + search + theme), sidebar, footer, theme/drawer scripts, font imports |
| `src/styles/global.css` | the whole design system (tokens + every component class) |

Path alias in the site: `~/` → `src/`.

## How rendering works

- **`categories.ts` is the source of truth.** `style: 'single'` = one long page with anchors;
  `style: 'list'` = index + per-entry detail pages. Adding a category = add a registry entry + JSON.
- **`EntryDetail.astro`** renders generic `[category]/[slug]` pages with per-category special cases
  (items, imbuements, terrain, negotiations, montages, projects, careers, domains, cultures).
- **`Feature.astro`** recursively renders forgesteel's feature trees. It branches on the feature
  `type` string (e.g. `Ability`, `Bonus`, `Damage Modifier`, `Choice`, `Multiple Features`,
  `Summon`, `Summon Choice`, `Heroic Resource`). For structured features it synthesises a one-line
  mechanic summary and treats the `description` as flavour (italic/dim). `Summon`/`Summon Choice`
  carry `monster` stat blocks rendered via `StatBlock` (note: Feature ↔ StatBlock import each
  other; this cycle is fine in Astro).
- **`StatBlock.astro`** renders monsters (also used for summoner minions / beastheart companions).

## Search

Pagefind-powered, custom UI (not the default PagefindUI):
- `Search.astro` lives in the top bar: a live dropdown shortlist (top 6) + "see all results".
- `src/pages/search.astro` is the full results page (`/search?q=`), grouped by section.
- `src/lib/search.ts` loads `pagefind/pagefind.js` lazily and sets `baseUrl` to the deploy base.
  Pagefind stores URLs root-relative to `dist` (`/classes/fury/`), so they MUST be re-prefixed with
  `/drawsteel-srd` or links 404 on the GitHub Pages subpath.

## Design system

"Heroic Codex": **Cinzel** (display, Roman caps) + **Spectral** (body serif), self-hosted via
`@fontsource/*` (no external requests); system sans for functional chrome. Light = warm parchment +
oxblood; dark = steel + blood. All colors/fonts are CSS variables in `global.css` (`--font-display`,
`--font-body`, `--font-ui`, theme tokens per `[data-theme]`). Subtle SVG paper-grain on `body::before`.

## Gotchas

- **Base path**: the site is served from `/drawsteel-srd/`. Every internal link goes through
  `href()`; Pagefind result URLs need the base re-prefixed (see Search).
- **forgesteel markdown** embeds literal `<code>…</code>` (hence `html:true`) and uses non-standard
  `=` table delimiters (`|:===|`) which markdown-it doesn't accept — `markdown.ts` normalises them
  to `-`. forgesteel renders with showdown `{ simpleLineBreaks:true, tables:true }`; we mirror that.
- **Empty `featuresByLevel`**: consumable items ship empty per-level arrays — filter them out so
  they don't render as leveled items.
- **Data is committed**: most fixes are component/CSS changes, not re-extraction. Only run
  `extract`/`refresh` to pull new forgesteel data (and commit `src/data/json` + the submodule bump).

## Deploy

Push to `main` → `.github/workflows/deploy.yml` builds and publishes to GitHub Pages. Site `base`
lives in `astro.config.mjs`; change it (and the README URL) if hosting elsewhere.
