# LinearThrone.com — Cloudflare / Netlify / static host

## Build

```bash
cd website
npm ci
npm run build
```

Publish the `website/dist` directory.

## SPA routing

Because the site uses client-side routes (`/unitview`, `/contact`, …), configure the host to serve `index.html` for unknown paths.

### Cloudflare Pages

Build command: `npm run build`  
Build output: `dist`  
Root directory: `website`  
Add `_redirects` or Pages function — included `public/_redirects` for Netlify-style hosts.

### Netlify

`website/public/_redirects` is copied into `dist`:

```
/*    /index.html   200
```
