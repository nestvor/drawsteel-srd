# Draw Steel SRD

A fast, searchable, mobile-friendly **rules reference (SRD)** for the
[Draw Steel](https://mcdmproductions.com/) tabletop RPG, generated from the excellent
[forgesteel](https://github.com/andyaiken/forgesteel) character-builder dataset and published as a
static site on GitHub Pages.

> **Unofficial fan project.** Draw Steel game content is © MCDM Productions, used under the Draw Steel
> Creator License. Not affiliated with or endorsed by MCDM. See the in-site **About & Credits** page.

## How it works

```
forgesteel (git submodule, TypeScript data)
        │   npm run extract   ← Node 20+/24, runs once locally / in CI
        ▼
src/data/json/*.json   (committed, plain data)
        │   npm run build     ← Astro + Pagefind, fast & dependency-light
        ▼
dist/   →  GitHub Pages
```

The forgesteel rules data is authored as TypeScript built through factory functions. A single
extraction script (`scripts/extract.ts`) imports those modules, normalises every category to plain
objects (baking display-ready ability strings via forgesteel's own logic), and writes JSON. The Astro
site only ever reads that committed JSON, so the deploy build is fast and decoupled from forgesteel's
dependency tree.

## Requirements

- **Node 20.17+ or 22+** (forgesteel's tooling and Astro 5 require it). The repo's `.nvmrc` pins `22`.

## Develop

```bash
npm install
npm run dev        # local dev server (search activates after a build)
npm run build      # astro build + pagefind search index → dist/
npm run preview    # serve the production build locally (search works here)
```

## Refreshing the data

When forgesteel updates its rules data:

```bash
npm run refresh    # bumps the submodule to latest + re-extracts JSON
git add src/data/json vendor/forgesteel && git commit -m "chore: refresh data"
```

Or trigger the **Refresh data from forgesteel** GitHub Action (`workflow_dispatch`), which does the
same and pushes the result (which then auto-deploys).

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it to
GitHub Pages.

**One-time setup:** in the repo, go to **Settings → Pages → Build and deployment → Source: GitHub
Actions**. The site is configured for the project path `https://nestvor.github.io/drawsteel-srd/`
(`site` + `base` in `astro.config.mjs`); change those if you host it elsewhere.

## Project layout

| Path | Purpose |
| --- | --- |
| `vendor/forgesteel/` | Data source (git submodule, pinned commit) |
| `scripts/extract.ts` | forgesteel data → `src/data/json/*.json` |
| `src/lib/` | data loader, markdown, base-path URLs, category registry |
| `src/components/` | `Feature` (recursive), `Ability`, `StatBlock`, layout, sidebar |
| `src/pages/` | home, about, generic `[category]` index/detail, dedicated `classes`/`monsters` |

## Credits

- **Draw Steel** © MCDM Productions.
- Rules data from [forgesteel](https://github.com/andyaiken/forgesteel) by Andy Aiken (GPL-3.0).
