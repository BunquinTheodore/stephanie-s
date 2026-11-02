import { boot } from '../lib/boot.js';
import { site } from '../data/site.js';
import '../styles/pages/visit.css';

const TIME_ZONE = 'Asia/Manila';
const TICK_MS = 30_000;
const SOON_MINUTES = 60;
// The status is a polite live region: round the countdown so it is announced at most every 15 min.
const COUNTDOWN_STEP = 15;
const roundUp = (mins) => Math.max(COUNTDOWN_STEP, Math.ceil(mins / COUNTDOWN_STEP) * COUNTDOWN_STEP);

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
};

/** "22:00" -> "10 PM", "08:30" -> "8:30 AM" */
const formatClock = (minutes) => {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const h12 = h24 % 12 || 12;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
};

const formatGap = (mins) => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};

/** Current minutes past midnight in Manila, independent of the visitor's zone. */
function manilaNow() {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? NaN);
    const minutes = (get('hour') % 24) * 60 + get('minute');
    if (Number.isFinite(minutes)) return minutes;
  } catch {
    /* Intl time zones unsupported: fall through to a fixed UTC+8 offset. */
  }
  const d = new Date();
  return (d.getUTCHours() * 60 + d.getUTCMinutes() + 8 * 60) % 1440;
}

/** Pure status computation, kept separate from the DOM. */
export function openState(now, opens, closes) {
  const isOpen = now >= opens && now < closes;
  if (isOpen) {
    const left = closes - now;
    return {
      open: true,
      text: left <= SOON_MINUTES ? `Open now, closing in about ${formatGap(roundUp(left))}` : `Open now until ${formatClock(closes)}`,
    };
  }
  const until = now < opens ? opens - now : 1440 - now + opens;
  return {
    open: false,
    text: until <= SOON_MINUTES
      ? `Closed, opening in about ${formatGap(roundUp(until))}`
      : `Closed now, opens ${now < opens ? 'today' : 'tomorrow'} at ${formatClock(opens)}`,
  };
}

function initOpenStatus() {
  const host = document.querySelector('[data-open-status]');
  if (!host) return;
  const textEl = host.querySelector('[data-open-text]');
  const clockEl = document.querySelector('[data-manila-time]');
  const opens = toMinutes(host.dataset.opens || site.hours.opens);
  const closes = toMinutes(host.dataset.closes || site.hours.closes);
  let last = '';

  const update = () => {
    const now = manilaNow();
    const state = openState(now, opens, closes);
    host.classList.toggle('is-open', state.open);
    host.classList.toggle('is-closed', !state.open);
    if (state.text !== last && textEl) {
      textEl.textContent = state.text;
      last = state.text;
    }
    if (clockEl) clockEl.textContent = `It is ${formatClock(now)} in Batangas now`;
  };

  update();
  let timer = setInterval(update, TICK_MS);
  document.addEventListener('visibilitychange', () => {
    clearInterval(timer);
    if (document.visibilityState === 'visible') {
      update();
      timer = setInterval(update, TICK_MS);
    }
  });
}

initOpenStatus();
boot({ page: 'visit' });
