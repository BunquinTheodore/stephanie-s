import { boot, openLightbox, safely } from '../lib/boot.js';
import '../styles/pages/events.css';
import { packages, formatPeso } from '../data/menu.js';
import { site } from '../data/site.js';
import { esc } from '../lib/render-core.js';
const SWAP_MS = 180;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initPackages(root) {
  const cards = [...root.querySelectorAll('[data-pk]')];
  const tabs = [...root.querySelectorAll('[data-set]')];
  const detail = root.querySelector('[data-pk-detail]');
  if (!cards.length || !detail) return;

  const byKey = new Map(packages.map((p) => [p.key, p]));
  const el = (sel) => detail.querySelector(sel);
  const state = { key: cards[0].dataset.pk, set: 'A' };
  const status = root.querySelector('[data-pk-status]');
  let announce = false;

  // Prices always come from menu.js, the single source of truth.
  cards.forEach((card) => {
    const pkg = byKey.get(card.dataset.pk);
    const price = card.querySelector('[data-pk-price]');
    if (pkg && price) price.textContent = formatPeso(pkg.price);
  });

  function paint() {
    const pkg = byKey.get(state.key);
    if (!pkg) return;
    el('[data-pk-label]').textContent = `PACKAGE FOR ${pkg.pax} GUESTS`;
    el('[data-pk-total]').textContent = formatPeso(pkg.price);
    el('[data-pk-per]').textContent = `About ${formatPeso(Math.round(pkg.price / pkg.pax))} per guest, ${pkg.hours} hours exclusive`;
    const items = pkg.sets?.[state.set] || [];
    el('[data-pk-menu]').innerHTML = items.map((i) => `<li>${esc(i)}</li>`).join('');
    if (site.links?.messenger) el('[data-pk-book]').href = site.links.messenger;
    el('[data-pk-book]').setAttribute('aria-label', `Book the ${pkg.pax} guest package on Messenger`);
    el('#set-panel')?.setAttribute('aria-labelledby', `set-tab-${state.set}`);
    // Short summary for screen readers, only after the visitor changes something.
    if (status && announce) status.textContent = `Package for ${pkg.pax} guests, ${formatPeso(pkg.price)}, Set ${state.set}`;
    announce = true;
  }

  function render() {
    const body = detail.querySelector('.ev-detail__body');
    if (reducedMotion() || !body) return paint();
    body.classList.add('is-swapping');
    setTimeout(() => {
      paint();
      body.classList.remove('is-swapping');
    }, SWAP_MS);
  }

  function selectCard(card, focus = false) {
    if (state.key === card.dataset.pk) return;
    state.key = card.dataset.pk;
    cards.forEach((c) => {
      const on = c === card;
      c.setAttribute('aria-checked', String(on));
      c.tabIndex = on ? 0 : -1;
    });
    if (focus) card.focus();
    render();
  }

  function selectSet(tab, focus = false) {
    if (state.set === tab.dataset.set) return;
    state.set = tab.dataset.set;
    detail.dataset.set = state.set;
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tab.focus();
    render();
  }

  // Roving arrow key navigation for the radio group and the tablist.
  const arrows = (list, select) => (e) => {
    const i = list.indexOf(e.currentTarget);
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    select(list[(i + step + list.length) % list.length], true);
  };

  cards.forEach((c) => {
    c.addEventListener('click', () => selectCard(c));
    c.addEventListener('keydown', arrows(cards, selectCard));
  });
  tabs.forEach((t) => {
    t.addEventListener('click', () => selectSet(t));
    t.addEventListener('keydown', arrows(tabs, selectSet));
  });

  detail.querySelector('[data-pk-poster]')?.addEventListener('click', () => {
    const ids = packages.map((p) => p.imageId).filter(Boolean);
    const index = Math.max(0, ids.indexOf(byKey.get(state.key)?.imageId));
    openLightbox(ids, index);
  });

  detail.dataset.set = state.set;
  paint();
}

/** Subtle pointer tilt and glare on the package cards (fine pointers only). */
function initTilt(root) {
  if (reducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  root.querySelectorAll('.ev-card').forEach((card) => {
    let frame = 0;
    card.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--rx', `${((0.5 - y) * 8).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${((x - 0.5) * 10).toFixed(2)}deg`);
        card.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      ['--rx', '--ry', '--gx', '--gy'].forEach((p) => card.style.removeProperty(p));
    });
  });
}

safely('packages', () => initPackages(document));
safely('tilt', () => initTilt(document));
boot({ page: 'events' });
