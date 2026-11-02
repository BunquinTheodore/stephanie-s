// Social preview card (Open Graph / Messenger / Facebook): the home cover photo, darkened,
// with the white Stefanie's logo centered. 1200x630, the 1.91:1 size every major app expects.
// Usage: node scripts/og-card.mjs   (also called from optimize-images.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 1200;
const H = 630;
const COVER_ID = 116; // same dining room photo as the home hero
const LOGO_WIDTH = 600; // Messenger may crop toward square, so the logo stays well inside the center
export const OG_FILE = 'og-home.jpg';

const shade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="v" cx="50%" cy="50%" r="75%">
      <stop offset="0" stop-color="#0a0a0a" stop-opacity=".62"/>
      <stop offset="1" stop-color="#0a0a0a" stop-opacity=".86"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#v)"/>
</svg>`);

export async function buildOgCard(outDir = path.join(ROOT, 'public/brand')) {
  const cover = await sharp(path.join(ROOT, `assets/source/${COVER_ID}.png`))
    .rotate()
    .resize({ width: W, height: H, fit: 'cover', position: 'centre' })
    .modulate({ saturation: 0.9 })
    .toBuffer();
  const logo = await sharp(path.join(ROOT, 'public/brand/logo-white.png')).resize({ width: LOGO_WIDTH }).png().toBuffer();
  const out = path.join(outDir, OG_FILE);
  await sharp(cover)
    .composite([{ input: shade }, { input: logo, gravity: 'center' }])
    .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(out);
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = await buildOgCard();
  const m = await sharp(out).metadata();
  console.log(`og card ${path.relative(ROOT, out)} ${m.width}x${m.height} ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}
