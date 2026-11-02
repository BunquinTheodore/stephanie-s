// Scroll reveal ([data-reveal]), word split headings ([data-split]) and counters ([data-count]).
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SETTLE_FALLBACK_MS = 1200;
const COUNT_MS = 1400;

/** Wrap each word of every text node in a span, keeping inline markup such as <em> intact. */
function splitWords(el) {
  if (el.dataset.splitDone) return;
  // Screen readers get the plain text from a visually hidden copy (aria-label on headings is
  // read unevenly); the animated words sit in one aria-hidden wrapper.
  const plain = el.textContent.trim().replace(/\s+/g, ' ');
  let index = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
        return;
      }
      if (child.nodeType !== Node.TEXT_NODE || !child.nodeValue.trim()) return;
      const frag = document.createDocumentFragment();
      child.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.append(document.createTextNode(' '));
          return;
        }
        const span = document.createElement('span');
        span.className = 'split-word';
        span.style.setProperty('--i', String(index++));
        span.textContent = part;
        frag.append(span);
      });
      child.replaceWith(frag);
    });
  };
  walk(el);
  const visual = document.createElement('span');
  visual.className = 'split-words';
  visual.setAttribute('aria-hidden', 'true');
  visual.append(...el.childNodes);
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = plain;
  el.append(sr, visual);
  el.dataset.splitDone = '1';
}

function settle(el) {
  const done = () => el.classList.add('is-settled');
  el.addEventListener('transitionend', done, { once: true });
  setTimeout(done, SETTLE_FALLBACK_MS);
}

function runCount(el) {
  const raw = el.dataset.count;
  const target = parseFloat(raw);
  if (Number.isNaN(target)) return;
  const decimals = (raw.split('.')[1] || '').length;
  const suffix = el.dataset.suffix || '';
  const format = (v) => `${v.toFixed(decimals)}${suffix}`;
  if (reduced()) {
    el.textContent = format(target);
    return;
  }
  const t0 = performance.now();
  let last = '';
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / COUNT_MS);
    const next = format(target * (1 - Math.pow(1 - p, 3)));
    if (next !== last) el.textContent = last = next;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function initReveal(root = document) {
  const motion = !reduced() && 'IntersectionObserver' in window;
  root.querySelectorAll('[data-split]').forEach(splitWords);
  const targets = root.querySelectorAll('[data-reveal],[data-split],[data-count]');
  if (!motion) {
    targets.forEach((el) => {
      el.classList.add('is-in', 'is-settled');
      if (el.hasAttribute('data-count')) runCount(el);
    });
    return;
  }
  document.documentElement.classList.add('js-reveal');
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        io.unobserve(el);
        el.classList.add('is-in');
        settle(el);
        if (el.hasAttribute('data-count')) runCount(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  targets.forEach((el) => io.observe(el));
}
