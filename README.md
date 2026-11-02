# Stefanie's Bar & Restaurant

Website for Stefanie's Bar & Restaurant, located in Balagtas, Batangas City, behind Total Gasoline Station. It is open daily from 8 AM to 10 PM.

The site is built as a Vite multi page app in plain JavaScript. It uses a black and white glass design, sideways photo marquees and a looping hero video on the home page. It targets a Lighthouse score of 90+ on mobile.

## Commands
```bash
npm install
npm run optimize        # assets/source/*.png -> public/img (AVIF + WebP), src/generated/images.json, public/brand, public/media
node scripts/favicons.mjs   # favicons + manifest icons from public/brand/icon-512.png
npm run dev             # http://localhost:5173
npm run build           # dist/ (set SITE_URL=https://your-domain for canonical, og:url and sitemap.xml)
npm run check           # post build validation (images, pages, copy rules, links)
npm run preview
```

## Structure
- `index.html`, `<page>/index.html`: one HTML file per page, which gives clean URLs such as `/menu/`.
- `partials/`: head, nav, footer and splash. They are expanded through `<!-- @include ... -->` markers.
- `src/lib/`:
  - `boot.js`, `img.js`, `marquee.js`, `lightbox.js`, `reveal.js`, `video.js`, `map.js`, `nav.js`, `splash.js`
  - `render-core.js`: the shared HTML renderers, used by both the browser and the build.
- `src/styles/`: `tokens.css`, `base.css`, `components.css`, and `pages/<page>.css`.
- `src/data/`:
  - `site.js`: business info, the single source of truth.
  - `curation.js`, `menu.js`, `reviews.js`.
- `src/generated/images.json`: the image manifest written by `npm run optimize`.

See `CONTRACT.md` for the component API, the include syntax and the performance rules.

## Performance notes
- CSS is inlined into every page at build time, so no stylesheet blocks rendering.
- Fonts load without blocking rendering, using `display=swap` and metric-adjusted fallbacks.
- Images are served as AVIF and WebP with srcset, explicit sizes and LQIP placeholders. The LCP image is preloaded.
- The Google Map is a click-to-load facade. Videos use `preload="none"` and only play while visible.
