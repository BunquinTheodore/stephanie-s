// Glass header: condenses on scroll, accessible mobile drawer, active link.
const CONDENSE_AT = 24;

export function markActive(page) {
  document.querySelectorAll('[data-nav-key]').forEach((a) => {
    if (a.dataset.navKey === page) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

/**
 * Condense once the page has scrolled CONDENSE_AT px. A 1px sentinel at the top of the body is
 * watched by an IntersectionObserver, so no scroll handler ever reads layout (no forced reflow).
 */
function initCondense(header) {
  if (!('IntersectionObserver' in window)) return;
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = `position:absolute;top:${CONDENSE_AT}px;left:0;width:1px;height:1px;pointer-events:none;visibility:hidden`;
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => header.classList.toggle('is-condensed', !entry.isIntersecting)).observe(sentinel);
}

function initDrawer(header) {
  const toggle = header.querySelector('[data-nav-toggle]');
  const drawer = document.getElementById(toggle?.getAttribute('aria-controls') || '');
  if (!toggle || !drawer) return;
  const root = document.documentElement;

  const setOpen = (open, { focusToggle = false } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.classList.toggle('is-open', open);
    root.classList.toggle('nav-open', open);
    // Keep focus inside the header and drawer while it covers the page (WCAG 2.4.3).
    [document.getElementById('main'), document.querySelector('.site-footer')].forEach((el) => {
      if (el) el.inert = open;
    });
    if (open) {
      drawer.removeAttribute('inert');
      drawer.querySelector('a')?.focus({ preventScroll: true });
    } else {
      drawer.setAttribute('inert', '');
      if (focusToggle) toggle.focus();
    }
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) setOpen(false, { focusToggle: true });
  });
  const wide = window.matchMedia('(min-width: 1080px)');
  wide.addEventListener?.('change', (m) => m.matches && setOpen(false));
}

const COMPACT_DELTA = 8;

/**
 * Phone tab bar: park the white pill under the current page, then let the bar shrink while the
 * reader scrolls down and restore it on scroll up. scrollY is read before any class write so the
 * handler never forces a reflow.
 */
function initTabbar(page) {
  const bar = document.querySelector('[data-tabbar]');
  if (!bar) return;
  const links = [...bar.querySelectorAll('[data-nav-key]')];
  const index = links.findIndex((a) => a.dataset.navKey === page);
  if (index >= 0) {
    bar.style.setProperty('--tab', String(index));
    bar.classList.add('has-current');
  }
  links.forEach((a, i) => {
    a.addEventListener('click', () => {
      bar.style.setProperty('--tab', String(i));
      bar.classList.add('has-current');
    });
  });

  let lastY = window.scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    if (Math.abs(y - lastY) < COMPACT_DELTA) return;
    bar.classList.toggle('is-compact', y > lastY && y > 120);
    lastY = y;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
}

export function initNav(page) {
  markActive(page);
  initTabbar(page);
  const header = document.querySelector('[data-header]');
  if (!header) return;
  initCondense(header);
  initDrawer(header);
}
