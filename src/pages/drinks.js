import { boot } from '../lib/boot.js';
import { menu, formatPeso } from '../data/menu.js';
import { esc } from '../lib/render-core.js';
import '../styles/pages/drinks.css';

// Drink series shown in the cafe tabs, in display order.
const SERIES = [
  { key: 'coffee', tab: 'Coffee' },
  { key: 'milk', tab: 'Milk' },
  { key: 'specials', tab: 'Specials' },
  { key: 'soda', tab: 'Soda' },
  { key: 'yakult', tab: 'Yakult' },
];

const sectionByKey = new Map(menu.map((s) => [s.key, s]));

const peso = (n) => (typeof n === 'number' ? formatPeso(n) : esc(n));

/** Lowest numeric price in a section across price, hot and iced. */
function lowestPrice(section) {
  const values = section.items.flatMap((i) => [i.price, i.hot, i.iced]).filter((v) => typeof v === 'number');
  return values.length ? Math.min(...values) : null;
}

function priceCells(item, hasColumns) {
  if (!hasColumns) {
    return item.price != null ? `<span class="price">${peso(item.price)}</span>` : '';
  }
  if (item.price != null) {
    return `<span class="price dk-row__wide">${peso(item.price)}</span>`;
  }
  const cell = (v, label) =>
    v != null
      ? `<span class="price"><span class="sr-only">${label} </span>${peso(v)}</span>`
      : `<span class="dk-row__na"><span class="sr-only">${label} not available</span></span>`;
  return cell(item.hot, 'Hot') + cell(item.iced, 'Iced');
}

function renderSeries(section) {
  const hasColumns = Array.isArray(section.columns) && section.columns.length > 0;
  const head = hasColumns
    ? `<li class="dk-row dk-row--head" aria-hidden="true"><span></span><span>Hot</span><span>Iced</span></li>`
    : '';
  const rows = section.items
    .map((item) => {
      const tag = item.isNew ? ' <span class="chip chip--solid dk-new">New</span>' : '';
      return `<li class="dk-row${hasColumns ? ' dk-row--cols' : ''}"><span class="dk-row__name">${esc(item.name)}${tag}</span>${priceCells(item, hasColumns)}</li>`;
    })
    .join('');
  const note = section.note ? `<p class="small muted dk-series__note">${esc(section.note)}</p>` : '';
  return `<h3 class="h3 dk-series__title">${esc(section.title)}</h3>${note}<ul class="dk-series__list">${head}${rows}</ul>`;
}

function renderTabs(tabsEl, panelsEl) {
  const available = SERIES.filter((s) => sectionByKey.has(s.key));
  if (!available.length) return;

  tabsEl.innerHTML = available
    .map(
      (s, i) =>
        `<button type="button" class="chip dk-tab" role="tab" id="dk-tab-${s.key}" aria-controls="dk-panel-${s.key}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(s.tab)}</button>`,
    )
    .join('');
  panelsEl.innerHTML = available
    .map(
      (s, i) =>
        `<div class="dk-series" role="tabpanel" id="dk-panel-${s.key}" aria-labelledby="dk-tab-${s.key}" tabindex="0"${i === 0 ? '' : ' hidden'}>${renderSeries(sectionByKey.get(s.key))}</div>`,
    )
    .join('');

  const tabs = [...tabsEl.querySelectorAll('[role="tab"]')];
  const panels = [...panelsEl.querySelectorAll('[role="tabpanel"]')];

  const select = (index, focus = false) => {
    tabs.forEach((t, i) => {
      const on = i === index;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) tabs[index].focus();
  };

  tabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) select(tabs.indexOf(tab));
  });
  tabsEl.addEventListener('keydown', (e) => {
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    const moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = null;
    if (e.key in moves) next = (current + moves[e.key] + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    select(next, true);
  });
}

/** Keep the static hero price highlights in sync with menu.js. */
function syncHeroPrices(root = document) {
  root.querySelectorAll('[data-from]').forEach((el) => {
    const section = sectionByKey.get(el.dataset.from);
    const low = section ? lowestPrice(section) : null;
    if (low !== null) el.textContent = `from ${formatPeso(low)}`;
  });
}

const tabsEl = document.querySelector('[data-dk-tabs]');
const panelsEl = document.querySelector('[data-dk-panels]');
if (tabsEl && panelsEl) renderTabs(tabsEl, panelsEl);
syncHeroPrices();

boot({ page: 'drinks' });
