# LinearThrone.com marketing site

Static Vite + React site for **LinearThrone Technologies** (`linearthrone.com`).

## Pages

| Route | Page |
|-------|------|
| `/` | Landing |
| `/unitview` | UnitView product (features, benefits, media) |
| `/llmod` | LLMOD vision teaser |
| `/house-victoria` | House Victoria teaser |
| `/contact` | Contact + About (`kurt.wood@linearthrone.com`) |

## Develop

```bash
cd website
npm install
npm run dev
```

## Build / deploy

```bash
npm run build
```

Publish `dist/` to any static host (Cloudflare Pages, Netlify, GitHub Pages, S3). For SPA routing on static hosts, add a rewrite of all paths to `index.html`.

Brief: `../docs/linearthrone/SITE-BRIEF.md`  
DEV task: `../docs/agents/tasks/TASK-20260713-001-PM01-to-DEV01.md`
