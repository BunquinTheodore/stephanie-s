// Generates favicons + web manifest icons from public/brand/icon-512.png
// (falls back to public/brand/mark-white.png on black). Run: node scripts/favicons.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PUB = path.resolve('public');
const ICON = path.join(PUB, 'brand/icon-512.png');
const MARK = path.join(PUB, 'brand/mark-white.png');
const INK = { r: 10, g: 10, b: 10, alpha: 1 };

async function source() {
  if (fs.existsSync(ICON)) return sharp(ICON).flatten({ background: INK }).png().toBuffer();
  if (fs.existsSync(MARK)) {
    const mark = await sharp(MARK).resize({ height: 400, fit: 'inside' }).toBuffer();
    return sharp({ create: { width: 512, height: 512, channels: 4, background: INK } })
      .composite([{ input: mark, gravity: 'center' }])
      .png()
      .toBuffer();
  }
  return null;
}

async function main() {
  const src = await source();
  if (!src) {
    console.warn('[favicons] no brand icon found; keeping favicon.svg only');
    return;
  }
  const out = [
    ['favicon-32.png', 32],
    ['apple-touch-icon.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
  ];
  for (const [name, size] of out) {
    await sharp(src).resize(size, size).png({ compressionLevel: 9, palette: true }).toFile(path.join(PUB, name));
  }
  // Maskable: icon padded to the 80% safe zone.
  const inner = await sharp(src).resize(410, 410).toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: INK } })
    .composite([{ input: inner, gravity: 'center' }])
    .png({ palette: true })
    .toFile(path.join(PUB, 'icon-maskable-512.png'));
  // SVG favicon wrapping a small PNG, so the mark looks right at any size.
  const png64 = (await sharp(src).resize(64, 64).png({ palette: true }).toBuffer()).toString('base64');
  fs.writeFileSync(
    path.join(PUB, 'favicon.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0a0a0a"/><image href="data:image/png;base64,${png64}" width="64" height="64"/></svg>\n`,
  );
  console.log('[favicons] wrote', out.map(([n]) => n).join(', '), 'icon-maskable-512.png, favicon.svg');
}

main().catch((e) => {
  console.error('[favicons] failed:', e.message);
  process.exit(1);
});
