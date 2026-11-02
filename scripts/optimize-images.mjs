// Image pipeline for Stefanie's Bar & Restaurant.
// Reads assets/source/<id>.png + docs/image-catalog.json, writes:
//   public/img/<id>-<w>.avif and .webp  (w in 480/800/1200/1800, never upscaled)
//   src/generated/images.json           ({ "<id>": { w, h, widths, lqip, alt, cat, poster } })
// Incremental: an output that already exists and is newer than its source is skipped.
// Usage: npm run optimize   (add --force to re-encode everything)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets', 'source');
const CATALOG = path.join(ROOT, 'docs', 'image-catalog.json');
const OUT = path.join(ROOT, 'public', 'img');
const JSON_OUT = path.join(ROOT, 'src', 'generated', 'images.json');

// 320w serves marquee tiles (120 to 300 CSS px) without wasting bytes on phones.
const WIDTHS = [320, 480, 800, 1200, 1800];
const AVIF = { quality: 50, effort: 4 };
const WEBP = { quality: 72, effort: 5 };
const LQIP_WIDTH = 24;
const SKIP_CATEGORIES = new Set(['info-screenshot']);
const SKIP_IDS = new Set([154]); // Facebook details screenshot: data only, never shown
const FORCE = process.argv.includes('--force');
const CONCURRENCY = Math.max(2, Math.min(4, os.cpus().length - 1));

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

function isFresh(out, srcMtime) {
  if (FORCE || !fs.existsSync(out)) return false;
  return fs.statSync(out).mtimeMs >= srcMtime;
}

function widthsFor(origW) {
  const list = WIDTHS.filter((w) => w <= origW);
  return list.length ? list : [WIDTHS[0]]; // tiny sources still get one slot (resize keeps native size)
}

async function lqip(file) {
  const buf = await sharp(file)
    .resize({ width: LQIP_WIDTH })
    .blur(1.2)
    .webp({ quality: 40, effort: 6 })
    .toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

async function encodeOne(entry) {
  const file = path.join(SRC, `${entry.id}.png`);
  if (!fs.existsSync(file)) throw new Error(`missing source ${file}`);
  const srcMtime = fs.statSync(file).mtimeMs;
  const meta = await sharp(file).metadata();
  const widths = widthsFor(meta.width);
  let written = 0;
  for (const w of widths) {
    for (const [ext, opts] of [['avif', AVIF], ['webp', WEBP]]) {
      const out = path.join(OUT, `${entry.id}-${w}.${ext}`);
      if (isFresh(out, srcMtime)) continue;
      const pipe = sharp(file).rotate().resize({ width: w, withoutEnlargement: true });
      await (ext === 'avif' ? pipe.avif(opts) : pipe.webp(opts)).toFile(out);
      written++;
    }
  }
  return {
    id: String(entry.id),
    record: {
      w: meta.width,
      h: meta.height,
      widths,
      lqip: await lqip(file),
      alt: entry.alt,
      cat: entry.category,
      poster: Boolean(entry.isPoster),
    },
    written,
  };
}

// ---------- brand: logo + mark as clean transparent PNGs ----------
const BRAND = path.join(ROOT, 'public', 'brand');
const LOGO_SRC = 125; // cleanest master logo: black script on flat off-white
const MARK_SRC = 2; // white waitress-with-cloche silhouette on black
const LOGO_WIDTH = 1200;

// Turns luminance into a smooth alpha ramp (keeps anti-aliased edges), returns RGBA raw buffer.
async function inkToAlpha(file, { scale, inkIsDark, lo, hi, rgb }) {
  const meta = await sharp(file).metadata();
  const { data, info } = await sharp(file)
    .flatten({ background: inkIsDark ? '#f4f4f4' : '#000000' })
    .resize({ width: Math.round(meta.width * scale), kernel: 'lanczos3' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = info.width * info.height;
  const out = Buffer.alloc(px * 4);
  for (let i = 0; i < px; i++) {
    const v = data[i];
    const t = inkIsDark ? (hi - v) / (hi - lo) : (v - lo) / (hi - lo);
    const a = Math.max(0, Math.min(1, t));
    out[i * 4] = rgb;
    out[i * 4 + 1] = rgb;
    out[i * 4 + 2] = rgb;
    out[i * 4 + 3] = Math.round(a * a * (3 - 2 * a) * 255); // smoothstep
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } });
}

async function trimmedPng(img, padding, width) {
  const buf = await img.png().toBuffer();
  const trimmed = await sharp(buf).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 }).toBuffer();
  const pipe = sharp(trimmed).extend({ top: padding, bottom: padding, left: padding, right: padding, background: { r: 0, g: 0, b: 0, alpha: 0 } });
  const padded = await pipe.png().toBuffer();
  return width ? sharp(padded).resize({ width, kernel: 'lanczos3' }) : sharp(padded);
}

async function buildBrand() {
  fs.mkdirSync(BRAND, { recursive: true });
  const logoFile = path.join(SRC, `${LOGO_SRC}.png`);
  const markFile = path.join(SRC, `${MARK_SRC}.png`);
  const made = [];

  for (const [name, rgb] of [['logo-black', 10], ['logo-white', 255]]) {
    const img = await inkToAlpha(logoFile, { scale: 2, inkIsDark: true, lo: 70, hi: 225, rgb });
    const out = path.join(BRAND, `${name}.png`);
    await (await trimmedPng(img, 8, LOGO_WIDTH)).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(out);
    made.push(out);
    // Light nav/footer size (480x291): lossless-alpha WebP keeps edges crisp at a fraction of the PNG.
    // 240w serves the 99px nav logo at 2x; 360w the 120px phone footer at 3x; 480w the footer and splash.
    for (const w of [240, 360, 480]) {
      const small = path.join(BRAND, `${name}-${w}.webp`);
      await sharp(out).resize({ width: w, kernel: 'lanczos3' }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(small);
      made.push(small);
    }
  }

  const markWhite = await trimmedPng(await inkToAlpha(markFile, { scale: 3, inkIsDark: false, lo: 40, hi: 210, rgb: 255 }), 4);
  const markWhiteBuf = await markWhite.png().toBuffer();
  const markOut = path.join(BRAND, 'mark-white.png');
  await sharp(markWhiteBuf).resize({ height: 600, kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(markOut);
  made.push(markOut);
  const markBlack = path.join(BRAND, 'mark-black.png');
  await sharp(markWhiteBuf).resize({ height: 600, kernel: 'lanczos3' }).negate({ alpha: false }).png({ compressionLevel: 9 }).toFile(markBlack);
  made.push(markBlack);

  // App icon: white mark centered on an ink square (favicon / manifest source).
  const iconSize = 512;
  const markForIcon = await sharp(markWhiteBuf).resize({ height: Math.round(iconSize * 0.74), kernel: 'lanczos3' }).png().toBuffer();
  const iconOut = path.join(BRAND, 'icon-512.png');
  await sharp({ create: { width: iconSize, height: iconSize, channels: 4, background: '#0a0a0a' } })
    .composite([{ input: markForIcon, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(iconOut);
  made.push(iconOut);

  // Social card: white logo on ink, 1200x630.
  const ogLogo = await sharp(path.join(BRAND, 'logo-white.png')).resize({ width: 760 }).png().toBuffer();
  const ogOut = path.join(BRAND, 'og-card.jpg');
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#0a0a0a' } })
    .composite([{ input: ogLogo, gravity: 'center' }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(ogOut);
  made.push(ogOut);

  for (const f of made) {
    const m = await sharp(f).metadata();
    console.log(`brand ${path.basename(f)} ${m.width}x${m.height} ${kb(fs.statSync(f).size)}`);
  }
}

async function pool(items, worker, size) {
  const results = [];
  let i = 0;
  const run = async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: size }, run));
  return results;
}

async function main() {
  const { images } = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  const todo = images.filter((e) => !e.duplicateOf && !SKIP_IDS.has(e.id) && !SKIP_CATEGORIES.has(e.category));
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
  sharp.concurrency(2);

  const t0 = Date.now();
  let done = 0;
  const results = await pool(todo, async (e) => {
    const r = await encodeOne(e);
    done++;
    if (r.written) console.log(`[${done}/${todo.length}] ${e.id} wrote ${r.written} file(s) widths=${r.record.widths.join(',')}`);
    return r;
  }, CONCURRENCY);

  const manifest = {};
  for (const r of results.sort((a, b) => Number(a.id) - Number(b.id))) manifest[r.id] = r.record;
  fs.writeFileSync(JSON_OUT, `${JSON.stringify(manifest, null, 1)}\n`);

  let total = 0, avif = 0, webp = 0;
  for (const f of fs.readdirSync(OUT)) {
    const s = fs.statSync(path.join(OUT, f)).size;
    total += s;
    if (f.endsWith('.avif')) avif += s; else if (f.endsWith('.webp')) webp += s;
  }
  console.log(`\n${Object.keys(manifest).length} images in manifest, ${fs.readdirSync(OUT).length} files in public/img`);
  console.log(`total ${mb(total)} (avif ${mb(avif)}, webp ${mb(webp)}), manifest ${kb(fs.statSync(JSON_OUT).size)}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

const brandOnly = process.argv.includes('--brand');
(brandOnly ? buildBrand() : main().then(buildBrand)).catch((err) => {
  console.error(err);
  process.exit(1);
});
