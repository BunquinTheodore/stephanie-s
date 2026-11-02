// Post build checks. Run after `npm run build`: `npm run check`.
//  1. every image id referenced in src (curation, pages, includes) exists in images.json and on disk
//  2. every page HTML exists in dist
//  3. no em dash / en dash characters, and no dash prefixed labels, in copy (HTML + JS sources, dist HTML)
//  4. every internal link and asset URL in dist HTML resolves to a file
// Exits 1 with a report when anything fails.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const MANIFEST = path.join(ROOT, 'src/generated/images.json');
const PAGES = [
  'index.html',
  'menu/index.html',
  'food/index.html',
  'drinks/index.html',
  'offers/index.html',
  'events/index.html',
  'gallery/index.html',
  'visit/index.html',
];

const problems = { images: [], pages: [], dashes: [], links: [] };
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');

function walk(dir, filter, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'generated', 'source'].includes(entry.name)) continue;
      walk(full, filter, out);
    } else if (filter(full)) out.push(full);
  }
  return out;
}

// ---------- 1. image ids ----------
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
const refs = new Map(); // id -> Set(sources)
const addRef = (id, where) => {
  const key = String(id);
  if (!refs.has(key)) refs.set(key, new Set());
  refs.get(key).add(where);
};

function collectIds(value, where) {
  if (typeof value === 'string' && /^\d{1,4}$/.test(value)) addRef(value, where);
  else if (typeof value === 'number' && Number.isInteger(value) && value > 0 && value < 10000 && where.includes('#ids'))
    addRef(value, where);
  else if (Array.isArray(value)) value.forEach((v) => collectIds(v, where));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectIds(v, where));
}

const curationFile = path.join(ROOT, 'src/data/curation.js');
if (fs.existsSync(curationFile)) {
  try {
    const mod = await import(pathToFileURL(curationFile).href);
    collectIds(mod.curation ?? mod.default ?? {}, 'src/data/curation.js');
  } catch (e) {
    problems.images.push(`src/data/curation.js failed to import: ${e.message}`);
  }
}

const ID_PATTERNS = [
  /\b(?:picture|bgImage|src|srcset|meta|hasImage)\(\s*['"`](\d{1,4})['"`]/g,
  /@include\s+(?:img|bg)\b[^>]*?\bid="(\d{1,4})"/g,
  /\b(?:preload|og|image)="(\d{1,4})"/g,
  /\bdata-id="(\d{1,4})"/g,
  /\bimageId:\s*['"`](\d{1,4})['"`]/g,
];
// Ids kept as plain literals in page scripts: `const DRINKS_STILL_ID = '144'`, `{ 'main-course': '53' }`.
const JS_ID_PATTERNS = [
  /\b[A-Z][A-Z0-9_]*_ID\s*=\s*['"`](\d{1,4})['"`]/g,
  /['"][\w-]+['"]\s*:\s*['"`](\d{1,4})['"`]/g,
];
const sourceFiles = [
  ...PAGES.map((p) => path.join(ROOT, p)).filter((f) => fs.existsSync(f)),
  ...walk(path.join(ROOT, 'src/pages'), (f) => f.endsWith('.js')),
  ...walk(path.join(ROOT, 'partials'), (f) => f.endsWith('.html')),
];
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const re of ID_PATTERNS) for (const m of text.matchAll(re)) addRef(m[1], rel(file));
  if (file.endsWith('.js')) for (const re of JS_ID_PATTERNS) for (const m of text.matchAll(re)) addRef(m[1], rel(file));
  for (const m of text.matchAll(/@include\s+marquee\b[^>]*?\bids="([^"]+)"/g))
    m[1].split(/[\s,]+/).filter(Boolean).forEach((id) => addRef(id, rel(file)));
}

for (const [id, where] of refs) {
  const entry = manifest[id];
  const from = [...where].join(', ');
  if (!entry) {
    problems.images.push(`id "${id}" missing from images.json (referenced in ${from})`);
    continue;
  }
  for (const w of entry.widths || []) {
    for (const fmt of ['avif', 'webp']) {
      const f = path.join(PUBLIC, 'img', `${id}-${w}.${fmt}`);
      if (!fs.existsSync(f)) problems.images.push(`id "${id}": file public/img/${id}-${w}.${fmt} missing`);
    }
  }
  if (!entry.w || !entry.h) problems.images.push(`id "${id}": manifest entry has no w/h`);
}

// ---------- 2. pages ----------
for (const p of PAGES) if (!fs.existsSync(path.join(DIST, p))) problems.pages.push(`dist/${p} missing (run npm run build)`);

// ---------- 3. dashes ----------
const DASH_CHARS = /[–—]/;
const LEADING_DASH_HTML = />\s*(?:[-–—]{1,3})\s+[\p{L}\d]/u;
const LEADING_DASH_JS = /(['"`])\s*[-–—]{1,3}\s+\p{L}/u;
const copyFiles = [
  ...PAGES.map((p) => path.join(ROOT, p)).filter((f) => fs.existsSync(f)),
  ...walk(path.join(ROOT, 'partials'), (f) => f.endsWith('.html')),
  ...walk(path.join(ROOT, 'src'), (f) => f.endsWith('.js')),
  ...PAGES.map((p) => path.join(DIST, p)).filter((f) => fs.existsSync(f)),
];
for (const file of copyFiles) {
  const isJs = file.endsWith('.js');
  fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, i) => {
      const trimmed = line.trim();
      if (isJs && (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*'))) return;
      const withoutComments = isJs ? line.replace(/\s\/\/\s.*$/, '') : line.replace(/<!--[\s\S]*?-->/g, '');
      const where = `${rel(file)}:${i + 1}`;
      if (DASH_CHARS.test(withoutComments)) problems.dashes.push(`${where} em/en dash: ${trimmed.slice(0, 120)}`);
      const leading = isJs ? LEADING_DASH_JS : LEADING_DASH_HTML;
      if (leading.test(withoutComments)) problems.dashes.push(`${where} dash prefixed label: ${trimmed.slice(0, 120)}`);
    });
}

// ---------- 4. internal links ----------
function resolves(url) {
  let clean;
  try {
    clean = decodeURI(url.split(/[?#]/)[0]);
  } catch {
    return false; // malformed percent escape: report it as a broken link instead of crashing
  }
  if (!clean || clean === '/') return fs.existsSync(path.join(DIST, 'index.html'));
  const target = path.join(DIST, clean);
  if (clean.endsWith('/')) return fs.existsSync(path.join(target, 'index.html'));
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return true;
  return fs.existsSync(path.join(target, 'index.html'));
}
for (const p of PAGES) {
  const file = path.join(DIST, p);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const urls = new Set();
  for (const m of html.matchAll(/\s(?:href|src|poster)="([^"]+)"/g)) urls.add(m[1]);
  for (const m of html.matchAll(/\s(?:srcset|imagesrcset)="([^"]+)"/g))
    m[1].split(',').forEach((part) => urls.add(part.trim().split(/\s+/)[0]));
  for (const u of urls) {
    if (!u.startsWith('/') || u.startsWith('//')) continue;
    if (!resolves(u)) problems.links.push(`dist/${p}: ${u}`);
  }
}

// ---------- report ----------
const labels = {
  images: 'Image references',
  pages: 'Built pages',
  dashes: 'Copy rules (dashes)',
  links: 'Internal links and assets',
};
let failed = 0;
for (const [key, list] of Object.entries(problems)) {
  const unique = [...new Set(list)];
  if (!unique.length) {
    console.log(`PASS  ${labels[key]}`);
    continue;
  }
  failed += unique.length;
  console.log(`FAIL  ${labels[key]} (${unique.length})`);
  unique.slice(0, 60).forEach((l) => console.log(`      ${l}`));
  if (unique.length > 60) console.log(`      ...and ${unique.length - 60} more`);
}
console.log(`\nChecked ${refs.size} image ids, ${PAGES.length} pages, ${copyFiles.length} copy files.`);
if (failed) {
  console.log(`${failed} problem(s) found.`);
  process.exit(1);
}
console.log('All checks passed.');
