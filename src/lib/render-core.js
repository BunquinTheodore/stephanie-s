// Pure HTML renderers shared by the browser (img.js, marquee.js) and the
// vite include plugin (build time). No DOM, no imports: pass the manifest in.

export const IMG_BASE = '/img/';
const DEFAULT_SIZES = '100vw';

export const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const imgUrl = (id, w, fmt = 'webp') => `${IMG_BASE}${id}-${w}.${fmt}`;

/** Width from the manifest list closest to (and not below) the target, else the largest. */
export function pickWidth(entry, target = 1200) {
  const widths = [...(entry?.widths || [])].sort((a, b) => a - b);
  if (!widths.length) return 0;
  return widths.find((w) => w >= target) || widths[widths.length - 1];
}

export const srcsetFor = (id, entry, fmt) =>
  (entry?.widths || []).map((w) => `${imgUrl(id, w, fmt)} ${w}w`).join(', ');

function placeholder(id, cls, alt) {
  const a11y = alt ? `role="img" aria-label="${esc(alt)}"` : 'aria-hidden="true"';
  return `<span class="img-missing ${esc(cls)}" ${a11y} data-missing-id="${esc(id)}"></span>`;
}

/**
 * <picture> with AVIF + WebP sources, explicit width/height and LQIP.
 * opts: sizes, eager, cls (picture), imgCls (img), alt, fit ('cover'), priority (fetchpriority high),
 *       mobileId (art direction: a second image served below 768px, e.g. a portrait crop for phones)
 */
export function renderPicture(manifest, id, opts = {}) {
  const key = String(id);
  const entry = manifest?.[key];
  const { sizes = DEFAULT_SIZES, eager = false, cls = '', imgCls = '', priority = eager } = opts;
  const alt = opts.alt ?? entry?.alt ?? '';
  if (!entry || !entry.widths?.length) return placeholder(key, cls, alt);

  const fallbackW = pickWidth(entry, 800);
  const lqip = entry.lqip ? ` style="background-image:url(${entry.lqip})"` : '';
  const loading = eager ? 'eager' : 'lazy';
  const fetch = priority ? ' fetchpriority="high"' : '';
  const ratioH = Math.round((entry.h / entry.w) * fallbackW);
  const mKey = opts.mobileId ? String(opts.mobileId) : '';
  const mEntry = mKey && manifest?.[mKey]?.widths?.length ? manifest[mKey] : null;
  const mobileSources = mEntry
    ? `<source media="(max-width: 767px)" type="image/avif" srcset="${srcsetFor(mKey, mEntry, 'avif')}" sizes="${esc(sizes)}">` +
      `<source media="(max-width: 767px)" type="image/webp" srcset="${srcsetFor(mKey, mEntry, 'webp')}" sizes="${esc(sizes)}">`
    : '';

  return (
    `<picture class="pic ${esc(cls)}">` +
    mobileSources +
    `<source type="image/avif" srcset="${srcsetFor(key, entry, 'avif')}" sizes="${esc(sizes)}">` +
    `<source type="image/webp" srcset="${srcsetFor(key, entry, 'webp')}" sizes="${esc(sizes)}">` +
    `<img class="lqip ${esc(imgCls)}" src="${imgUrl(key, fallbackW, 'webp')}" width="${fallbackW}" height="${ratioH}"` +
    ` alt="${esc(alt)}" loading="${loading}" decoding="${eager ? 'sync' : 'async'}"${fetch}${lqip}>` +
    `</picture>`
  );
}

/** CSS declarations (for a style attribute) painting the image as a background via image-set(). */
export function renderBg(manifest, id, { w = 1800 } = {}) {
  const key = String(id);
  const entry = manifest?.[key];
  if (!entry) return '';
  const width = pickWidth(entry, w);
  const webp = imgUrl(key, width, 'webp');
  const avif = imgUrl(key, width, 'avif');
  const lqip = entry.lqip ? `, url(${entry.lqip})` : '';
  return (
    `background-image:url(${webp})${lqip};` +
    `background-image:image-set(url(${avif}) type('image/avif'), url(${webp}) type('image/webp'))${lqip};` +
    `background-size:cover;background-position:center;`
  );
}

/** Preload tag for an LCP image (AVIF). */
export function renderPreload(manifest, id, sizes = '100vw', media = '') {
  const key = String(id);
  const entry = manifest?.[key];
  if (!entry) return '';
  const mediaAttr = media ? ` media="${esc(media)}"` : '';
  return `<link rel="preload" as="image" type="image/avif" imagesrcset="${srcsetFor(key, entry, 'avif')}" imagesizes="${esc(sizes)}"${mediaAttr} fetchpriority="high">`;
}

const BASE_ROW_PX = { desktop: 300, mobile: 200 };

// Typical viewport heights used to turn vh/svh/dvh row heights into px for sizes.
const VIEWPORT_H = { desktop: 900, mobile: 844 };

/**
 * Row heights in px for sizes: clamp(120px, 17vh, 220px) gives { desktop: 220, mobile: 120 },
 * 44svh gives { desktop: 396, mobile: 371 }. Unparseable values (var()) use BASE_ROW_PX.
 */
function rowPx(height) {
  const src = String(height || '');
  const px = [...src.matchAll(/(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
  const vh = [...src.matchAll(/(\d+(?:\.\d+)?)[sdl]?vh/g)].map((m) => Number(m[1]));
  if (px.length) return { desktop: Math.max(...px), mobile: Math.min(...px) };
  if (!vh.length) return BASE_ROW_PX;
  return {
    desktop: Math.round((Math.max(...vh) * VIEWPORT_H.desktop) / 100),
    mobile: Math.round((Math.min(...vh) * VIEWPORT_H.mobile) / 100),
  };
}

/**
 * One sideways marquee row. Content is rendered twice (second copy aria-hidden + inert)
 * and the track translates by -50%, so the loop is seamless.
 * opts: direction 'left'|'right', speed (seconds per loop), height (css), cls, group (lightbox group),
 *       caption(id, entry) => string, sizes, label (aria-label of the region), lightbox (default true)
 */
export function renderMarquee(manifest, ids, opts = {}) {
  const list = [...new Set((ids || []).map(String))].filter((id) => manifest?.[id]);
  if (!list.length) return '';
  const {
    direction = 'left',
    speed = Math.max(30, list.length * 6),
    height = '',
    cls = '',
    group = '',
    caption,
    label = 'Photo gallery',
    lightbox = true,
  } = opts;
  const groupName = group || `m${list.join('-').slice(0, 24)}`;
  const style = [`--marquee-dur:${Number(speed)}s`, height ? `--marquee-h:${height}` : ''].filter(Boolean).join(';');

  const row = rowPx(height);
  const item = (id) => {
    const e = manifest[id];
    const ratio = e.w / e.h;
    // Tiles are height driven, so the rendered width is row height times the aspect ratio.
    const sizes =
      opts.sizes ||
      `(min-width: 1024px) ${Math.round(row.desktop * ratio)}px, ${Math.round(row.mobile * ratio)}px`;
    const pic = renderPicture(manifest, id, { sizes, cls: 'marquee__pic' });
    const cap = caption ? caption(id, e) : '';
    const capHtml = cap ? `<span class="marquee__cap">${cap}</span>` : '';
    // WCAG 2.5.3: a visible caption must be part of the accessible name.
    const capText = String(cap || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').replace(/&amp;/g, '&').replace(/&(quot|#34);/g, '"').replace(/&(#39|apos);/g, "'").trim();
    const name = capText ? `${capText}. Open photo` : `Open photo: ${e.alt || 'photo'}`;
    const inner = lightbox
      ? `<button type="button" class="marquee__btn" data-lightbox="${esc(groupName)}" data-id="${esc(id)}" aria-label="${esc(name)}">${pic}${capHtml}</button>`
      : `${pic}${capHtml}`;
    return `<li class="marquee__item" style="--ratio:${ratio.toFixed(4)}">${inner}</li>`;
  };
  const set = list.map(item).join('');
  const dir = direction === 'right' ? 'right' : 'left';
  // Decorative rows (no lightbox) have nothing to operate, so they are not landmarks and never scroll.
  const a11y = lightbox ? ` role="region" aria-label="${esc(label)}"` : ' aria-hidden="true"';
  const decor = lightbox ? '' : ' marquee--decor';
  return (
    `<div class="marquee marquee--${dir}${decor} ${esc(cls)}" style="${style}" data-marquee${a11y}>` +
    `<div class="marquee__track">` +
    `<ul class="marquee__set">${set}</ul>` +
    `<ul class="marquee__set marquee__set--clone" aria-hidden="true" inert>${set}</ul>` +
    `</div></div>`
  );
}

const LARGE_VIDEO_PX = 960;
const LARGE_VIDEO_MIN_VIEWPORT = 900;

/** Muted loop video from /media/<name>.webm|.mp4 with /media/<name>.jpg poster (lazy, see video.js). */
export function renderVideo(name, { cls = '', width = 1280, height = 720, label = '', poster = '' } = {}) {
  const base = `/media/${esc(name)}`;
  const aria = label ? ` aria-label="${esc(label)}"` : ' aria-hidden="true"';
  // Large (hero size) loops only play on wide screens; phones keep the poster (see video.js).
  const minW = Number(width) >= LARGE_VIDEO_PX ? ` data-min-width="${LARGE_VIDEO_MIN_VIEWPORT}"` : '';
  return (
    `<video class="${esc(cls)}" data-autoplay muted playsinline loop preload="none" width="${Number(width)}" height="${Number(height)}"${minW}` +
    // data-poster: video.js sets the real poster when the video nears the viewport, so an
    // offscreen poster never competes with the LCP resources.
    ` data-poster="${poster ? esc(poster) : `${base}.jpg`}"${aria}>` +
    `<source src="${base}.webm" type="video/webm"><source src="${base}.mp4" type="video/mp4"></video>`
  );
}

/** Click-to-load map facade (see map.js). */
export function renderMapFacade(manifest, site, { imageId = '', cls = '', title = '', eager = false, sizes = '' } = {}) {
  const label = title || `Map to ${site.name}`;
  // eager: when the facade sits in the first viewport it can be the LCP element, so load it
  // eagerly with fetchpriority high.
  const poster = imageId
    ? renderPicture(manifest, imageId, {
        sizes: sizes || '(min-width: 1024px) 50vw, 100vw',
        cls: 'map-facade__pic',
        alt: '',
        eager,
        priority: eager,
      })
    : '';
  return (
    `<div class="map-facade ${esc(cls)}" data-map-facade data-src="${esc(site.links.mapEmbed)}" data-title="${esc(label)}">` +
    `${poster}<div class="map-facade__ui">` +
    `<button type="button" class="btn" data-map-load>Load interactive map</button>` +
    `<a class="btn btn--ghost" href="${esc(site.links.directions)}" target="_blank" rel="noopener">Get directions</a>` +
    `<p class="map-facade__note"><span>Loads Google Maps, which may set cookies.</span></p></div></div>`
  );
}
