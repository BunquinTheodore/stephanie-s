# Build contract: Stefanie's Bar & Restaurant

Vite 7 multi page app in plain JavaScript ES modules, with three.js 0.186 and sharp. There is no framework.

## Brand rules
- The UI is strictly black and white: ink `#0a0a0a`, white, and neutral grays only. The photos supply all the color.
- Use glass panels, restrained motion, a three.js cloche on the home page, and short looping video or animated WebP/GIF.
- Keep scrolling short. Home is at most about 3 to 4 viewports, and inner pages are 2 to 4 full viewport `.panel`s. Photos are full bleed backgrounds. Groups of photos are marquee rows that alternate direction.
- Copy rules:
  - Never put a dash or decorative rule before a label. Write `WHO WE ARE`, not `— WHO WE ARE` or `01 —`.
  - Do not use em or en dashes in UI copy.
  - Write time ranges as "8 AM to 10 PM".
  - Write prices with ₱.
- Fonts are Cormorant Garamond (display, with italic for emphasis) and Manrope (body). They are already loaded by the head partial.
- Accessibility: use landmarks, alt text and visible focus. Reduced motion disables the marquees, the 3D scene and the splash.

## Pages, nav and file ownership
| key | route | HTML | script | styles |
|---|---|---|---|---|
| home | `/` | `index.html` | `src/pages/home.js` | `src/styles/pages/home.css` |
| menu | `/menu/` | `menu/index.html` | `src/pages/menu.js` | `src/styles/pages/menu.css` |
| food | `/food/` | `food/index.html` | `src/pages/food.js` | `src/styles/pages/food.css` |
| drinks | `/drinks/` | `drinks/index.html` | `src/pages/drinks.js` | `src/styles/pages/drinks.css` |
| offers | `/offers/` | `offers/index.html` | `src/pages/offers.js` | `src/styles/pages/offers.css` |
| events | `/events/` | `events/index.html` | `src/pages/events.js` | `src/styles/pages/events.css` |
| gallery (The Place) | `/gallery/` | `gallery/index.html` | `src/pages/gallery.js` | `src/styles/pages/gallery.css` |
| visit | `/visit/` | `visit/index.html` | `src/pages/visit.js` | `src/styles/pages/visit.css` |

File ownership:
- **Foundation** owns:
  - `vite.config.js`
  - `partials/*`
  - `src/styles/{tokens,base,components}.css`
  - `src/lib/*`
  - `src/data/site.js`
  - `scripts/check.mjs` and `scripts/favicons.mjs`
  - the files in the `public/` root: favicons and `site.webmanifest`
  - this file and `README.md`
- **Assets** owns:
  - `scripts/optimize-images.mjs`
  - `public/{img,brand,media}`
  - `src/generated/images.json`
  - `src/data/{curation,menu,reviews}.js`
  - `docs/image-catalog.json`
- **Page agents** own their three files in the table above and nothing else.

## Page skeleton
```html
<!doctype html>
<html lang="en">
<head>
<!-- @include head title="Menu" description="One sentence for search results." preload="142" -->
</head>
<body>
<!-- @include nav -->
<main id="main">
  <section class="panel">
    <div class="panel__bg"><!-- @include img id="142" eager sizes="100vw" alt="" --></div>
    <div class="panel__inner">
      <p class="eyebrow">OUR MENU</p>
      <h1 class="h1" data-split>Made <em>fresh</em> daily</h1>
    </div>
  </section>
</main>
<!-- @include footer -->
<script type="module" src="/src/pages/menu.js"></script>
</body>
</html>
```
Home also puts `<!-- @include splash -->` first inside `<body>`, before nav.

Every page script starts like this:
```js
import { boot } from '../lib/boot.js';   // also loads tokens/base/components CSS
import '../styles/pages/menu.css';
// 1. render any JS-generated HTML into the DOM first
// 2. then call boot so reveal, marquees, lightbox, videos and the map facade wire it up
boot({ page: 'menu' });
```

## Include markers
The `stf-includes` plugin expands these in dev and in build, before Vite processes the HTML. Attribute values use double quotes.

| marker | attributes | output |
|---|---|---|
| `head` | `title` (omit on home), `description`, `preload` (LCP image id), `preload-sizes` (default `100vw`), `preload-media` (media query for that preload), `preload-mobile` (second image id preloaded below 768px, with `preload-mobile-sizes`), `og` (image id for og:image; default `/brand/og-card.jpg`), `schema="restaurant"` (JSON-LD, used on home and visit) or `schema="menu"` (schema.org Menu built from src/data/menu.js, used on /menu/) | charset, viewport, title `"<title> \| Stefanie's Bar & Restaurant"`, meta description, OG and Twitter tags, canonical, og:url and og:image (only when `SITE_URL` is set), favicons, manifest, self-hosted fonts from public/fonts (Manrope and Cormorant Garamond latin preloaded), AVIF preload, the inline `html.js`/`no-splash`/`motion-paused` script, JSON-LD |
| `nav` | none | skip link, the fixed glass header (logo, 7 category links, Reserve button to Messenger, burger) and the mobile drawer. `aria-current` is set from the file path. |
| `footer` | none | the full footer: address, hours, contact, services, ordering note, links, Pause motion button, social links |
| `splash` | none | the home splash overlay (inline CSS). It shows once per session and is skipped under reduced motion. |
| `img` | `id`, `sizes`, `eager` (flag, sets fetchpriority high), `class` (on `<picture>`), `img-class`, `alt`, `mobile` (art direction: image id served below 768px) | `<picture>` with AVIF and WebP srcset, width and height, and an LQIP background |
| `marquee` | `ids="3,4,5"`, `direction="left\|right"`, `speed` (seconds per loop), `height` (CSS), `class` (e.g. `marquee--mono`), `group` (lightbox group), `label` (region aria-label), `sizes`, `lightbox="false"` (decorative row: no region role, aria-hidden, class `marquee--decor`, never scrolls under reduced motion) | one marquee row (see below). Row heights in px or vh/svh feed the per tile sizes. |
| `bg` | `id`, `w` | CSS declarations for a `style=""` attribute, e.g. `<div style="<!-- @include bg id="20" -->">` |
| `video` | `name`, `class`, `width`, `height`, `label`, `poster` | a lazy muted loop `<video data-autoplay>` from `/media/<name>.webm/.mp4` with the `/media/<name>.jpg` poster |
| `map` | `image` (poster id), `class`, `title`, `eager` (flag: eager poster with fetchpriority high, for a first viewport facade), `sizes` | the click-to-load Google Maps facade |

Static includes are preferred over JS rendering. They give LQIP placeholders, there is no layout shift, the content is present without JS, and the bundle stays smaller.

The browser manifest is slimmed: JS-rendered pictures get a gray placeholder and no LQIP.

## JS API (`src/lib`)
```js
import { picture, bgImage, src, srcset, meta, hasImage, existing, manifest } from '../lib/img.js';
picture('142', { sizes: '(min-width:1024px) 50vw, 100vw', eager: false, cls: 'cover', imgCls: '', alt: 'Wings' }) // -> HTML string
bgImage('20', { w: 1800 })   // -> "background-image:...image-set(...)" for a style attribute
src('142', 1200, 'webp')     // -> "/img/142-1200.webp" (closest width)
existing(['3', '999'])       // -> ['3'] (drops unknown ids, dedupes)

import { marquee, initMarquees } from '../lib/marquee.js';
el.innerHTML = marquee(curation.food.photos, { direction: 'right', speed: 50, height: 'clamp(180px,28vh,280px)',
  cls: 'marquee--mono', group: 'food', label: 'Food photos', caption: (id, entry) => '' });
initMarquees(el)             // idempotent; boot() already calls it for the whole document

import { boot, openLightbox } from '../lib/boot.js';
openLightbox(['3', '4', '5'], 1)
// or declaratively: any <button data-lightbox="groupName" data-id="142"> opens its group

import { mountHero } from '../lib/three-hero.js';   // home only
mountHero(document.querySelector('.hero3d__canvas')) // Promise<{destroy,start,stop}|null>; never throws
// options: { delay: 5000 (ms after load if no input), immediate: false }

import { video } from '../lib/video.js';    // video('hero-loop', { cls, width, height, label, poster })
import { mapFacade } from '../lib/map.js';  // mapFacade({ imageId: '20', cls, title })
import { site } from '../data/site.js';     // business info (name, address, hours, phone, links, services, nav ...)
```

### How the hero 3D runs
Markup: `<div class="hero3d" aria-hidden="true"><canvas class="hero3d__canvas"></canvas></div>`.
- Before WebGL starts, the CSS draws a static cloche poster. `.is-live` fades the canvas in.
- three.js loads only on the first input, or 5 s after `load`, and then in idle time.
- It is skipped for reduced motion, saveData, `deviceMemory < 4`, two or fewer CPU cores, no WebGL, or `?3d=off`.
- The device pixel ratio is capped at 1.5, or 1.25 on touch devices. Frame rate is capped at 60, or 30 on touch.
- Rendering pauses when the canvas is offscreen, the tab is hidden, or motion is paused.
- If an FPS probe measures under 24 fps, the scene tears down and the poster stays.
- Everything is disposed on `pagehide`.
- `html[data-hero3d]` is one of `off`, `waiting`, `loading`, `live` or `static`.

## CSS classes (`components.css`)
Layout and text:
- `.wrap`, `.wrap--narrow`, `.stack` (`--stack-gap`), `.cluster`, `.grid-auto` (`--grid-min`)
- `.sr-only`
- `.display`, `.h1`, `.h2`, `.h3`, `.lead`, `.muted`, `.small`. Use `em` inside headings for italic.

Panels:
- `.panel` is a full viewport section that clears the header.
- Modifiers: `--auto` (content height), `--end` (aligns content to the bottom), `--light` (inverts to white with ink text and adapts buttons).
- `.panel__inner` is the container.
- `.panel__bg` is the full bleed layer. Put a `<picture>`, `<img>` or `<video>` inside it. It adds a gradient overlay, and you tune the darkness with `style="--overlay:.7"`.
  - Modifiers: `--mono` (grayscale) and `--kenburns` (slow zoom).

Glass:
- `.glass` (light frost), `.glass--dark`, `.glass--lg` (stronger blur). There is a solid fallback where backdrop-filter is unsupported.
- `.card` adds padding and a hover lift.

Controls:
- `.btn` is the solid white pill with a shine on hover. Modifiers: `.btn--ghost` (glass outline), `.btn--dark`, `.btn--sm`, `.btn--lg`.
- `.chip` is a glass pill and `.chip--solid` is solid. A `button.chip[aria-pressed=true]` renders as active.
- `.eyebrow` is a plain uppercase label with no leading dash. `.eyebrow--pill` puts it in a pill.

Text and badges: `.price`, `.link-sweep`, `.rating-badge` (with `<strong>100%</strong>` inside).

Marquee:
- Structure: `.marquee` > `.marquee__track` > `.marquee__set` (×2, the second is `aria-hidden` and `inert`) > `.marquee__item` > `.marquee__btn` > `.pic`. The optional caption is `.marquee__cap`.
- Modifiers: `.marquee--left` and `.marquee--right`, plus `.marquee--mono` (grayscale until hover).
- Stack rows inside `.marquee-stack` and alternate their directions.
- CSS variables: `--marquee-h`, `--marquee-gap`, `--marquee-dur`.

Text ticker:
```html
<div class="ticker [ticker--right]">
  <div class="ticker__track"><span>...</span><span aria-hidden="true">...</span></div>
</div>
```
Duplicate the content once. The speed is set with `--ticker-dur`.

Motion:
- `[data-reveal]` fades up. Variants are `data-reveal="fade"` and `"scale"`, and `style="--d:120"` adds a delay in ms. `.reveal` is a class alias.
- `[data-split]` reveals a heading word by word.
- `[data-count="100"] data-suffix="%"` counts up.
- Never put a reveal on the LCP image.

Other components:
- `.lightbox` is created on demand.
- `.hero3d` and `.hero3d__canvas` are the hero 3D host.
- `.map-facade` is the map facade.
- `.orbs` > `.orb` ×3 are ambient white glows.
- `.scroll-cue`, `.icon-btn`, `.divider`.

Tokens (`tokens.css`):
- Colors and surfaces: `--ink`, `--g-950` to `--g-100`, `--white`, `--text`, `--text-2`, `--text-3`, `--stroke`, `--stroke-strong`
- Glass: `--glass-fill`, `--blur-sm`, `--blur-lg`
- Type and space: `--fs-*`, `--space-1` to `--space-10`, `--gutter`, `--max`
- Shape and layout: `--r-*`, `--header-h`
- Motion: `--ease`, `--ease-out`

## Global behaviour from `boot({ page })`
- Marks the active nav item.
- Condenses the header after 24px of scroll.
- Runs the mobile drawer: Esc closes it, focus is managed, and scroll is locked while it is open.
- Runs the home splash: once per session, skippable with a key, click or wheel, and removed after at most about 2.6 s.
- Starts reveals and counters, marquees (play only while visible, pause on hover, touch and focus), the lightbox (dialog, arrow keys, swipe), lazy videos (play while visible) and the map facade.
- Wires `[data-motion-toggle]`. It sets `html.motion-paused`, which stops marquees, tickers, videos and the 3D scene.

## Checks
- `npm run build`, then `npm run check`.
- The check fails when:
  - an image id referenced in curation.js, page HTML or JS, or the partials is missing from images.json or `public/img`
  - a page is missing from dist
  - em or en dashes, or dash-prefixed labels, appear in copy
  - an internal link or asset in dist does not resolve
- Image URLs are `/img/<id>-<w>.avif|webp`, where w is in the manifest's `widths` list (subset of 320, 480, 800, 1200, 1800; 320 was added in fix round 2 for marquee tiles, never upscaled).
- Set `SITE_URL=https://domain` at build time to emit the canonical and og:url tags, absolute og:image and JSON-LD URLs, and `sitemap.xml`. `robots.txt` is always emitted.
