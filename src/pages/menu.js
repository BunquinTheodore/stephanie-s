// Menu page: category tabs that swap the board in place, live search across every section,
// a background photo that crossfades per category, and lightbox links to the original boards.
import { boot, openLightbox } from '../lib/boot.js';
import { picture, existing } from '../lib/img.js';
import { esc } from '../lib/render-core.js';
import { menu, formatPeso } from '../data/menu.js';
import { curation } from '../data/curation.js';
import { site } from '../data/site.js';
import '../styles/pages/menu.css';

const BAR_KEYS = new Set(['coffee', 'milk', 'specials', 'soda', 'yakult', 'cocktails', 'beer']);

// Clean photos (never text posters) that sit behind the board for each category.
/** Decoded location hash, or '' when it is malformed (for example /menu/#%). */
const safeHash = () => {
  try {
    return decodeURIComponent(location.hash.slice(1));
  } catch {
    return '';
  }
};

const BG_BY_KEY = {
  'main-course': '53',
  platters: '77',
  'rice-meals': '66',
  pasta: '10',
  'pansit-bilao': '73',
  appetizers: '65',
  snacks: '59',
  soup: '142',
  healthy: '60',
  veggie: '116',
  desserts: '51',
  coffee: '54',
  milk: '43',
  specials: '29',
  soda: '42',
  yakult: '41',
  cocktails: '39',
  beer: '69',
  'unli-wings': '130',
};
const SEARCH_BG = '50';
const SIZE_NAMES = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra large' };
const COLUMN_NAMES = { hot: 'Hot', iced: 'Iced' };
const STAGGER_MAX = 12;
const HEADER_ROOM = 96; // fixed site header plus breathing room above the sticky tabs

const kitchen = menu.filter((s) => !BAR_KEYS.has(s.key));
const bar = menu.filter((s) => BAR_KEYS.has(s.key));
const ordered = [...kitchen, ...bar];
const byKey = new Map(ordered.map((s) => [s.key, s]));

const fold = (v) =>
  String(v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const money = (v) => (typeof v === 'number' ? formatPeso(v) : esc(v));

/** Wrap the first case-insensitive match of the query in <mark>, on escaped text. */
function highlight(text, query) {
  const safe = esc(text);
  if (!query) return safe;
  const i = safe.toLowerCase().indexOf(esc(query).toLowerCase());
  if (i < 0) return safe;
  const end = i + esc(query).length;
  return `${safe.slice(0, i)}<mark class="menu-hit">${safe.slice(i, end)}</mark>${safe.slice(end)}`;
}

const newChip = (item) => (item.isNew ? ' <span class="chip chip--solid menu-new">New to menu</span>' : '');

const descOf = (item) => (item.desc && item.desc !== 'New to the menu.' ? item.desc : '');

/* ---------- Rendering ---------- */

function renderListItem(item, i, query) {
  const hasPrice = item.price != null && item.price !== '';
  const desc = descOf(item);
  return (
    `<li class="mi" style="--i:${Math.min(i, STAGGER_MAX)}">` +
    `<div class="mi__row"><span class="mi__name">${highlight(item.name, query)}${newChip(item)}</span>` +
    (hasPrice ? `<span class="mi__dots" aria-hidden="true"></span><span class="price mi__price">${money(item.price)}</span>` : '') +
    `</div>` +
    (desc ? `<p class="mi__desc">${highlight(desc, query)}</p>` : '') +
    `</li>`
  );
}

function cell(value) {
  return value == null
    ? `<td class="mt__na"><span aria-hidden="true">·</span><span class="sr-only">Not available</span></td>`
    : `<td class="price">${money(value)}</td>`;
}

/** Hot/iced or S/M/L/XL sections render as a real table with column headers. */
function renderTable(section, items, query) {
  const cols = section.columns || section.sizes;
  const isSizes = !section.columns;
  const names = isSizes ? SIZE_NAMES : COLUMN_NAMES;
  const head = cols
    .map((c) => `<th scope="col"><abbr title="${esc(names[c] || c)}">${esc(isSizes ? c : names[c] || c)}</abbr></th>`)
    .join('');
  const rows = items
    .map((item, i) => {
      const values = isSizes ? cols.map((c) => item.sizes?.[c]) : cols.map((c) => item[c]);
      const single = values.every((v) => v == null) && item.price != null;
      const cells = single ? `<td class="price" colspan="${cols.length}">${money(item.price)}</td>` : values.map(cell).join('');
      return (
        `<tr class="mt__row" style="--i:${Math.min(i, STAGGER_MAX)}">` +
        `<th scope="row"><span class="mi__name">${highlight(item.name, query)}${newChip(item)}</span></th>${cells}</tr>`
      );
    })
    .join('');
  return (
    `<table class="mt mt--${cols.length}"><caption class="sr-only">${esc(section.title)} prices</caption>` +
    `<thead><tr><th scope="col"><span class="sr-only">Item</span></th>${head}</tr></thead><tbody>${rows}</tbody></table>`
  );
}

function renderItems(section, items, query) {
  if (section.columns || section.sizes) return renderTable(section, items, query);
  const cls = items.some(descOf) ? 'menu-list' : 'menu-list menu-list--compact';
  return `<ul class="${cls}">${items.map((it, i) => renderListItem(it, i, query)).join('')}</ul>`;
}

function boardsButton(key, title) {
  const ids = existing(curation.menu?.posters?.[key] || []);
  if (!ids.length) return '';
  const label = ids.length > 1 ? `View ${ids.length} boards` : 'View the board';
  return (
    `<button type="button" class="menu-boardbtn" data-boards="${esc(key)}" aria-label="${esc(label)} for ${esc(title)}">` +
    `<span class="menu-boardbtn__thumb">${picture(ids[0], { sizes: '56px', cls: 'cover', alt: '' })}</span>` +
    `<span class="menu-boardbtn__label">${esc(label)}</span></button>`
  );
}

const hasUnpriced = (items) => items.some((it) => it.price == null && !it.hot && !it.iced && !it.sizes);

function renderSection(section) {
  const group = BAR_KEYS.has(section.key) ? 'BAR' : 'KITCHEN';
  const n = section.items.length;
  const ask = hasUnpriced(section.items) ? '<p class="menu-sec__ask small">Ask our staff for today\'s price on items without one.</p>' : '';
  return (
    `<article class="menu-sec menu-enter" aria-labelledby="sec-${esc(section.key)}">` +
    `<header class="menu-sec__head"><div class="menu-sec__titles">` +
    `<p class="menu-sec__meta"><span class="eyebrow">${group}</span><span class="chip menu-sec__count">${n} ${n === 1 ? 'item' : 'items'}</span></p>` +
    `<h2 class="h2 menu-sec__title" id="sec-${esc(section.key)}">${esc(section.title)}</h2>` +
    (section.note ? `<p class="menu-sec__note muted">${esc(section.note)}</p>` : '') +
    `</div>${boardsButton(section.key, section.title)}</header>` +
    `<div class="menu-sec__body">${renderItems(section, section.items, '')}</div>${ask}</article>`
  );
}

function search(query) {
  const q = fold(query);
  if (!q) return [];
  const words = q.split(' ');
  const hit = (text) => {
    const t = fold(text);
    return words.every((w) => t.includes(w));
  };
  return ordered
    .map((section) => {
      const items = hit(section.title) ? section.items : section.items.filter((it) => hit(`${it.name} ${it.desc || ''}`));
      return { section, items };
    })
    .filter((r) => r.items.length);
}

function renderResults(query, results) {
  const total = results.reduce((n, r) => n + r.items.length, 0);
  if (!total) {
    return (
      `<div class="menu-empty menu-enter"><h2 class="h3" id="res-title">Nothing matches "${esc(query)}".</h2>` +
      `<p class="muted">Try another word, or <a class="link-sweep" href="${esc(site.links.messenger)}" target="_blank" rel="noopener">ask us on Messenger</a>.</p></div>`
    );
  }
  const groups = results
    .map(
      ({ section, items }) =>
        `<section class="menu-result" aria-labelledby="res-${esc(section.key)}">` +
        `<h3 class="menu-result__title" id="res-${esc(section.key)}"><button type="button" class="menu-result__jump" data-jump="${esc(section.key)}">${esc(section.title)}</button></h3>` +
        renderItems(section, items, query.trim()) +
        `</section>`,
    )
    .join('');
  return (
    `<article class="menu-sec menu-enter" aria-labelledby="res-title"><header class="menu-sec__head"><div class="menu-sec__titles">` +
    `<p class="menu-sec__meta"><span class="eyebrow">SEARCH</span><span class="chip menu-sec__count">${total} ${total === 1 ? 'match' : 'matches'}</span></p>` +
    `<h2 class="h2 menu-sec__title" id="res-title">Results for <em>${esc(query.trim())}</em></h2></div></header>` +
    `<div class="menu-sec__body menu-results">${groups}</div></article>`
  );
}

function renderTabs(scroller) {
  const tab = (s) =>
    `<button type="button" role="tab" class="chip menu-tab" id="tab-${esc(s.key)}" data-key="${esc(s.key)}" aria-controls="menu-panel" aria-selected="false" tabindex="-1">${esc(s.title)}</button>`;
  scroller.innerHTML =
    `<span class="menu-tabs__group" aria-hidden="true">KITCHEN</span>${kitchen.map(tab).join('')}` +
    `<span class="menu-tabs__group" aria-hidden="true">BAR</span>${bar.map(tab).join('')}`;
  return [...scroller.querySelectorAll('[role="tab"]')];
}

/* ---------- Background crossfade ---------- */

function createBackdrop(container) {
  const layers = new Map();
  const initial = container.querySelector('.menu-bg__layer');
  if (initial) layers.set('53', initial);
  let token = 0;

  const ensure = (id) => {
    if (!id || layers.has(id)) return layers.get(id);
    const tmp = document.createElement('div');
    tmp.innerHTML = picture(id, { sizes: '100vw', eager: true, priority: false, cls: 'menu-bg__layer', alt: '' });
    const el = tmp.firstElementChild;
    if (!el) return null;
    container.append(el);
    layers.set(id, el);
    return el;
  };

  const ready = (el) => {
    const img = el?.querySelector('img');
    if (!img || img.complete) return Promise.resolve();
    return new Promise((res) => {
      img.addEventListener('load', res, { once: true });
      img.addEventListener('error', res, { once: true });
    });
  };

  const show = async (id) => {
    const el = ensure(id);
    if (!el) return;
    const mine = ++token;
    await ready(el);
    if (mine !== token) return;
    layers.forEach((layer) => layer.classList.toggle('is-active', layer === el));
  };

  return { show, prefetch: ensure };
}

/* ---------- Controller ---------- */

function initMenu() {
  const scroller = document.querySelector('[data-menu-tabs]');
  const panel = document.querySelector('[data-menu-panel]');
  const bgEl = document.querySelector('[data-menu-bg]');
  const form = document.querySelector('[data-menu-search]');
  const input = form?.querySelector('input');
  const clear = form?.querySelector('[data-menu-clear]');
  const status = document.querySelector('[data-menu-status]');
  if (!scroller || !panel) return;

  const tabs = renderTabs(scroller);
  const backdrop = bgEl ? createBackdrop(bgEl) : { show() {}, prefetch() {} };
  const fromHash = safeHash();
  let active = byKey.has(fromHash) ? fromHash : ordered[0].key;
  let lastQuery = '';

  // Measured in the next frame so it never forces layout right after the panel re-render.
  const centerTab = (tab) =>
    requestAnimationFrame(() => {
      const left = tab.offsetLeft - (scroller.clientWidth - tab.offsetWidth) / 2;
      scroller.scrollTo({ left: Math.max(0, left), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });

  const markTabs = (key) => {
    tabs.forEach((t) => {
      const on = t.dataset.key === key;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on || (!key && t === tabs[0]) ? 0 : -1;
    });
    // Category view is a named tabpanel; search results become a region named by their heading.
    panel.setAttribute('role', key ? 'tabpanel' : 'region');
    panel.setAttribute('aria-labelledby', key ? `tab-${key}` : 'res-title');
  };

  const keepInView = () => {
    const nav = scroller.closest('.menu-tabs');
    const offset = (nav ? nav.offsetHeight : 0) + HEADER_ROOM;
    const top = panel.getBoundingClientRect().top;
    if (top >= offset) return;
    window.scrollTo({ top: Math.max(0, window.scrollY + top - offset), behavior: 'auto' });
  };

  const select = (key, { focus = false, scroll = true, hash = true } = {}) => {
    const section = byKey.get(key);
    if (!section) return;
    active = key;
    if (input && input.value) {
      input.value = '';
      lastQuery = '';
      if (clear) clear.hidden = true;
    }
    markTabs(key);
    panel.innerHTML = renderSection(section);
    backdrop.show(BG_BY_KEY[key]);
    const tab = tabs.find((t) => t.dataset.key === key);
    if (tab) {
      centerTab(tab);
      if (focus) tab.focus();
    }
    if (scroll) keepInView();
    if (!hash) return;
    try {
      history.replaceState(null, '', `#${key}`);
    } catch {
      /* file:// or sandboxed: the hash just will not update */
    }
  };

  const runSearch = (raw) => {
    const query = raw.trim();
    if (clear) clear.hidden = !raw;
    if (query === lastQuery) return;
    lastQuery = query;
    if (!query) {
      select(active, { scroll: false });
      if (status) status.textContent = '';
      return;
    }
    const results = search(query);
    const total = results.reduce((n, r) => n + r.items.length, 0);
    markTabs(null);
    panel.innerHTML = renderResults(query, results);
    backdrop.show(results.length ? BG_BY_KEY[results[0].section.key] || SEARCH_BG : SEARCH_BG);
    if (status) status.textContent = total ? `${total} ${total === 1 ? 'match' : 'matches'} for ${query}` : `No matches for ${query}`;
  };

  scroller.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) select(tab.dataset.key);
  });
  scroller.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const moves = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = tabs[(moves[e.key] + tabs.length) % tabs.length];
    select(next.dataset.key, { focus: true, scroll: false });
  });
  const warm = (e) => {
    const tab = e.target.closest?.('[role="tab"]');
    if (tab) backdrop.prefetch(BG_BY_KEY[tab.dataset.key]);
  };
  scroller.addEventListener('pointerover', warm, { passive: true });
  scroller.addEventListener('focusin', warm);

  panel.addEventListener('click', (e) => {
    const boards = e.target.closest('[data-boards]');
    if (boards) {
      openLightbox(curation.menu?.posters?.[boards.dataset.boards] || [], 0);
      return;
    }
    const jump = e.target.closest('[data-jump]');
    if (jump) select(jump.dataset.jump, { focus: true });
  });

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      runSearch(input.value);
    });
    input.addEventListener('input', () => runSearch(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && input.value) {
        e.preventDefault();
        input.value = '';
        runSearch('');
      }
    });
    clear?.addEventListener('click', () => {
      input.value = '';
      runSearch('');
      input.focus();
    });
  }

  window.addEventListener('hashchange', () => {
    const key = safeHash();
    if (byKey.has(key) && key !== active) select(key);
  });

  select(active, { scroll: false, hash: false });
  document.documentElement.classList.add('menu-ready');
}

try {
  initMenu();
} catch (error) {
  console.error('[menu] init failed', error);
}
boot({ page: 'menu' });
