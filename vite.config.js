import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { site } from './src/data/site.js';
import { menu } from './src/data/menu.js';
import {
  esc,
  renderPicture,
  renderBg,
  renderPreload,
  renderMarquee,
  renderVideo,
  renderMapFacade,
  imgUrl,
  pickWidth,
} from './src/lib/render-core.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PARTIALS = path.join(ROOT, 'partials');
const MANIFEST = path.join(ROOT, 'src/generated/images.json');
const PUBLIC = path.join(ROOT, 'public');

export const PAGES = {
  home: 'index.html',
  menu: 'menu/index.html',
  food: 'food/index.html',
  drinks: 'drinks/index.html',
  offers: 'offers/index.html',
  events: 'events/index.html',
  gallery: 'gallery/index.html',
  visit: 'visit/index.html',
};


const siteUrl = () => (process.env.SITE_URL || site.url || '').replace(/\/+$/, '');

// The image manifest is owned by the assets pipeline. Create an empty one only if it is missing.
if (!fs.existsSync(MANIFEST)) {
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, '{}\n');
}

const readManifest = () => {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  } catch {
    return {};
  }
};

const lookup = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

function parseAttrs(src = '') {
  const attrs = {};
  const re = /([\w-]+)(?:\s*=\s*"([^"]*)")?/g;
  let m;
  while ((m = re.exec(src))) attrs[m[1]] = m[2] === undefined ? true : m[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  return attrs;
}

/** {{{raw}}} then {{escaped}} token replacement. Unknown keys warn and render empty. */
function fill(template, ctx, file) {
  const missing = new Set();
  const get = (key) => {
    const v = lookup(ctx, key);
    if (v == null) missing.add(key);
    return v == null ? '' : String(v);
  };
  const out = template.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, k) => get(k)).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => esc(get(k)));
  if (missing.size) console.warn(`[includes] ${file}: unknown tokens ${[...missing].join(', ')}`);
  return out;
}

// Logo dimensions, cached by mtime.
const logoCache = new Map();
async function logoInfo(name) {
  const file = path.join(PUBLIC, 'brand', name);
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    return null;
  }
  const hit = logoCache.get(file);
  if (hit && hit.mtime === stat.mtimeMs) return hit.info;
  try {
    const { width, height } = await sharp(file).metadata();
    const info = { src: `/brand/${name}`, width, height };
    logoCache.set(file, { mtime: stat.mtimeMs, info });
    return info;
  } catch {
    return null;
  }
}

function logoTag(info, cls, displayHeight, { eager = true, small = [], sizes = '' } = {}) {
  if (!info) {
    return `<span class="${cls} nav__wordmark">${esc(site.shortName)}</span>`;
  }
  const h = displayHeight;
  const w = Math.round((info.width / info.height) * h);
  // Small variants first so a 99px nav logo never pulls the 480w file on 1x and 2x screens.
  const variants = [...(Array.isArray(small) ? small : [small]).filter((v) => v && v.src !== info.src), info];
  const srcset =
    variants.length > 1
      ? ` srcset="${variants.map((v) => `${v.src} ${v.width}w`).join(', ')}" sizes="${esc(sizes || `${w}px`)}"`
      : '';
  return `<img class="${cls}" src="${info.src}"${srcset} width="${w}" height="${h}" alt="${esc(site.name)}" decoding="async"${eager ? '' : ' loading="lazy"'}>`;
}

function restaurantJsonLd(manifest, heroId) {
  const base = siteUrl();
  const abs = (p) => (base ? `${base}${p}` : p);
  const e = heroId && manifest[heroId];
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: site.name,
    description: site.description,
    ...(base ? { url: `${base}/` } : {}),
    // schema.org needs absolute URLs: emit image and menu only when the origin is known.
    ...(e && base ? { image: abs(imgUrl(heroId, pickWidth(e, 1200), 'webp')) } : {}),
    ...(base ? { menu: `${base}/menu/` } : {}),
    servesCuisine: ['Filipino', 'Comfort food'],
    telephone: site.phone.e164,
    email: site.email,
    priceRange: site.priceRange,
    acceptsReservations: true,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.street}, ${site.address.line}`,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    hasMap: site.links.maps,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: site.hours.opens,
        closes: site.hours.closes,
      },
    ],
    sameAs: [site.links.facebook],
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

/** schema.org Menu from src/data/menu.js, so crawlers and link previews get every item and price without JS. */
function menuJsonLd() {
  const base = siteUrl();
  const offer = (price, name) =>
    typeof price === 'number' ? { '@type': 'Offer', price, priceCurrency: 'PHP', ...(name ? { name } : {}) } : null;
  const offersFor = (item) => {
    const list = [
      offer(item.price),
      offer(item.hot, 'Hot'),
      offer(item.iced, 'Iced'),
      ...Object.entries(item.sizes || {}).map(([size, price]) => offer(price, size)),
    ].filter(Boolean);
    if (!list.length) return {};
    return { offers: list.length === 1 ? list[0] : list };
  };
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `${site.name} menu`,
    inLanguage: 'en',
    ...(base ? { url: `${base}/menu/` } : {}),
    hasMenuSection: menu.map((section) => ({
      '@type': 'MenuSection',
      name: section.title,
      ...(section.note ? { description: section.note } : {}),
      hasMenuItem: section.items.map((item) => ({
        '@type': 'MenuItem',
        name: item.name,
        ...(item.desc ? { description: item.desc } : {}),
        ...offersFor(item),
      })),
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function pageKeyFrom(urlPath = '/index.html') {
  const clean = urlPath.replace(/\\/g, '/').replace(/^\//, '');
  return Object.entries(PAGES).find(([, file]) => file === clean)?.[0] || 'home';
}

function pageMeta(attrs, page, manifest) {
  const base = siteUrl();
  const route = site.nav.find((n) => n.key === page)?.href || '/';
  const title = attrs.title || '';
  const fullTitle = title ? `${title} | ${site.name}` : `${site.name} | Balagtas, Batangas City`;
  const ogId = attrs.og || attrs.preload || '';
  const ogEntry = ogId && manifest[ogId];
  const ogPath = fs.existsSync(path.join(PUBLIC, 'brand/og-card.jpg')) && !attrs.og
    ? '/brand/og-card.jpg'
    : ogEntry
      ? imgUrl(ogId, pickWidth(ogEntry, 1200), 'webp')
      : '';
  // Open Graph requires absolute URLs; a relative og:image never resolves, so omit it without an origin.
  const ogAbs = ogPath && base ? `${base}${ogPath}` : '';
  return {
    key: page,
    route,
    fullTitle,
    description: attrs.description || site.description,
    canonicalTag: base ? `<link rel="canonical" href="${esc(base + route)}">` : '',
    ogUrlTag: base ? `<meta property="og:url" content="${esc(base + route)}">` : '',
    ogImageTag: ogAbs ? `<meta property="og:image" content="${esc(ogAbs)}">` : '',
    // summary_large_image needs an image; without an origin there is none, so fall back to summary.
    twitterCard: ogAbs ? 'summary_large_image' : 'summary',
    // preload-media / preload-mobile: art directed heroes preload one image per breakpoint.
    preloadTag: [
      attrs.preload ? renderPreload(manifest, attrs.preload, attrs['preload-sizes'] || '100vw', attrs['preload-media'] || '') : '',
      attrs['preload-mobile']
        ? renderPreload(manifest, attrs['preload-mobile'], attrs['preload-mobile-sizes'] || '100vw', '(max-width: 767px)')
        : '',
    ].join(''),
    jsonld:
      attrs.schema === 'restaurant'
        ? restaurantJsonLd(manifest, attrs.preload || attrs.og)
        : attrs.schema === 'menu'
          ? menuJsonLd()
          : '',
  };
}

/** Monochrome stroke icons for the phone tab bar (24px grid, currentColor). */
const TAB_ICONS = {
  home: '<path d="M3.5 10.5 12 3.8l8.5 6.7"/><path d="M5.8 9v10.7h12.4V9"/><path d="M10 19.7v-5.2h4v5.2"/>',
  menu: '<path d="M5.5 3.8h10l3 3v13.4h-13z"/><path d="M9 9.5h6M9 13h6M9 16.5h4"/>',
  food: '<path d="M7 3.5v6.2a2 2 0 0 0 2 2v8.8M11 3.5v6.2a2 2 0 0 1-2 2M9 3.5v5"/><path d="M16.5 20.5V3.6c-2 .9-3 3.5-3 6.4 0 2 1 3 3 3"/>',
  drinks: '<path d="M5 4.5h14l-7 8z"/><path d="M12 12.5v7M8.5 19.5h7"/><path d="M15.5 4.5 17.8 2"/>',
  offers: '<path d="M3.8 12.6 11.4 5h7.8v7.8l-7.6 7.6a1.4 1.4 0 0 1-2 0l-5.8-5.8a1.4 1.4 0 0 1 0-2z"/><circle cx="15.3" cy="8.9" r="1.3"/>',
  events: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><path d="m12 12.3.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>',
  gallery: '<path d="M4 7.5h3.2L9 5h6l1.8 2.5H20v11.5H4z"/><circle cx="12" cy="13" r="3.4"/>',
  visit: '<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>',
};

async function buildContext(page, manifest) {
  const white = (await logoInfo('logo-white-480.webp')) || (await logoInfo('logo-white.png'));
  const whiteSmall = [await logoInfo('logo-white-240.webp'), await logoInfo('logo-white-360.webp')];
  const navLinks = site.nav
    .filter((n) => n.key !== 'home')
    .map((n) => {
      const cur = n.key === page ? ' aria-current="page"' : '';
      return `<li><a href="${n.href}" data-nav-key="${n.key}"${cur}>${esc(n.label)}</a></li>`;
    })
    .join('');
  const drawer = site.nav
    .map((n, i) => {
      const cur = n.key === page ? ' aria-current="page"' : '';
      const num = String(i + 1).padStart(2, '0');
      return `<li><a href="${n.href}" data-nav-key="${n.key}" style="--i:${i}"${cur}><small aria-hidden="true">${num}</small>${esc(n.label)}</a></li>`;
    })
    .join('');
  const tabbar = site.nav
    .map((n) => {
      const cur = n.key === page ? ' aria-current="page"' : '';
      const short = n.key === 'gallery' ? 'Place' : n.label;
      return `<li><a href="${n.href}" data-nav-key="${n.key}"${cur} aria-label="${esc(n.label)}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">${TAB_ICONS[n.key] || ''}</svg><span aria-hidden="true">${esc(short)}</span></a></li>`;
    })
    .join('');
  const tag = "See you at Stefanie's";
  const letters = [...tag]
    .map((ch, i) => (ch === ' ' ? ' ' : `<span style="--i:${i}">${esc(ch)}</span>`))
    .join('');
  // No priority hint: the splash logo must never compete with the preloaded LCP hero image.
  const splashLogo = white
    ? `<img src="${white.src}" width="${white.width}" height="${white.height}" alt="" decoding="async">`
    : `<span class="splash__word">${esc(site.shortName)}</span><span class="splash__sub">BAR &amp; RESTAURANT</span>`;
  return {
    site,
    nav: { links: navLinks, drawer, tabbar },
    brand: {
      navLogo: logoTag(white, 'nav__logo', 60, { small: whiteSmall }),
      footerLogo: white
        ? logoTag(white, 'footer__logo', 96, { eager: false, small: whiteSmall, sizes: '(max-width: 639px) 120px, 280px' })
        : `<span class="nav__wordmark" style="font-size:2.6rem">${esc(site.name)}</span>`,
      splashLogo,
    },
    splash: { letters },
    footer: {
      services: site.services.map((s) => `<li class="chip">${esc(s)}</li>`).join(''),
      links: site.nav.map((n) => `<li><a class="link-sweep" href="${n.href}">${esc(n.label)}</a></li>`).join(''),
    },
    manifest,
  };
}

const INCLUDE_RE = /<!--\s*@include\s+([\w-]+)([\s\S]*?)-->/g;

/**
 * Expands <!-- @include name attr="..." --> markers. See CONTRACT.md for the list.
 * Runs before Vite's own HTML processing, in dev and build.
 */
function includes() {
  return {
    name: 'stf-includes',
    transformIndexHtml: {
      order: 'pre',
      async handler(html, ctx) {
        const page = pageKeyFrom(ctx.path);
        const manifest = readManifest();
        const context = await buildContext(page, manifest);
        const headAttrs = parseAttrs((html.match(/<!--\s*@include\s+head([\s\S]*?)-->/) || [])[1]);
        context.page = pageMeta(headAttrs, page, manifest);
        const partial = (name) => {
          const file = path.join(PARTIALS, `${name}.html`);
          return fill(fs.readFileSync(file, 'utf8'), context, `${name}.html`);
        };
        const warnMissing = (id) => {
          if (id && !manifest[id]) console.warn(`[includes] ${ctx.path}: image id "${id}" not in images.json`);
        };

        // Page HTML may use {{site.*}} tokens (escaped) so business details come from site.js.
        const siteTokens = (out) =>
          out.replace(/\{\{\s*(site\.[\w.]+)\s*\}\}/g, (m, key) => {
            const v = lookup(context, key);
            if (v == null) {
              console.warn(`[includes] ${ctx.path}: unknown token ${key}`);
              return '';
            }
            return esc(String(v));
          });

        return siteTokens(html).replace(INCLUDE_RE, (_, name, rawAttrs) => {
          const a = parseAttrs(rawAttrs);
          switch (name) {
            case 'head':
            case 'nav':
            case 'footer':
            case 'splash':
              return partial(name);
            case 'img':
              warnMissing(a.id);
              return renderPicture(manifest, a.id, {
                sizes: a.sizes || '100vw',
                eager: Boolean(a.eager),
                priority: Boolean(a.eager || a.priority),
                cls: a.class || '',
                imgCls: a['img-class'] || '',
                alt: a.alt,
                mobileId: a.mobile || '',
              });
            case 'bg':
              warnMissing(a.id);
              return renderBg(manifest, a.id, { w: Number(a.w) || 1800 });
            case 'marquee': {
              const ids = String(a.ids || '').split(/[\s,]+/).filter(Boolean);
              ids.forEach(warnMissing);
              return renderMarquee(manifest, ids, {
                direction: a.direction,
                speed: a.speed ? Number(a.speed) : undefined,
                height: a.height,
                cls: a.class,
                group: a.group,
                label: a.label,
                sizes: a.sizes,
                lightbox: a.lightbox !== 'false',
              });
            }
            case 'video':
              return renderVideo(a.name, {
                cls: a.class,
                width: a.width,
                height: a.height,
                label: a.label,
                poster: a.poster,
              });
            case 'map':
              return renderMapFacade(manifest, site, {
                imageId: a.image,
                cls: a.class,
                title: a.title,
                eager: Boolean(a.eager),
                sizes: a.sizes || '',
              });
            default:
              console.warn(`[includes] unknown include "${name}" in ${ctx.path}`);
              return '';
          }
        });
      },
    },
    handleHotUpdate({ file, server }) {
      const f = file.replace(/\\/g, '/');
      if (f.includes('/partials/') || f.endsWith('/src/generated/images.json')) {
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

/**
 * Slims the manifest that ships to the browser: drops LQIP data URIs and unused keys
 * (about 60% of its size). Build time includes keep the full LQIP placeholders.
 */
function slimClientManifest() {
  return {
    name: 'stf-slim-manifest',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replace(/\\/g, '/').endsWith('src/generated/images.json')) return null;
      try {
        const full = JSON.parse(code);
        const slim = Object.fromEntries(
          Object.entries(full).map(([k, e]) => [k, { w: e.w, h: e.h, widths: e.widths, alt: e.alt }]),
        );
        return { code: JSON.stringify(slim), map: null };
      } catch {
        return null;
      }
    },
  };
}

/** Inlines built CSS into every page so no stylesheet blocks first paint (multi page port of Tech Run). */
function inlineCss() {
  return {
    name: 'stf-inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const used = new Set();
      for (const [name, asset] of Object.entries(bundle)) {
        if (!name.endsWith('.html') || asset.type !== 'asset') continue;
        asset.source = String(asset.source).replace(
          /<link\s+rel="stylesheet"[^>]*?href="\/?([^"]+\.css)"[^>]*>/g,
          (match, href) => {
            const css = bundle[href];
            if (!css) return match;
            used.add(href);
            return `<style>${css.source}</style>`;
          },
        );
      }
      used.forEach((href) => delete bundle[href]);
    },
  };
}

/** robots.txt always; sitemap.xml when SITE_URL (or site.url) is known. */
function seoFiles() {
  return {
    name: 'stf-seo-files',
    apply: 'build',
    generateBundle() {
      const base = siteUrl();
      const robots = ['User-agent: *', 'Allow: /', base ? `Sitemap: ${base}/sitemap.xml` : ''].filter(Boolean).join('\n');
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots}\n` });
      if (!base) {
        const msg =
          'No production origin: sitemap.xml, canonical, og:url, og:image and JSON-LD url/image are omitted. ' +
          'Set SITE_URL (or site.url in src/data/site.js) before deploying.';
        if (process.env.REQUIRE_SITE_URL) this.error(msg);
        this.warn(msg);
        return;
      }
      const urls = site.nav
        .map((n) => `  <url><loc>${base}${n.href}</loc><changefreq>weekly</changefreq></url>`)
        .join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  appType: 'mpa',
  plugins: [slimClientManifest(), includes(), inlineCss(), seoFiles()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    assetsInlineLimit: 0,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: Object.fromEntries(Object.entries(PAGES).map(([k, f]) => [k, path.join(ROOT, f)])),
    },
  },
  server: { host: true },
});
