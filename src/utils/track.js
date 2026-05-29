/**
 * InkRush Event Tracker
 * Queues events and flushes them to the REST API in batches.
 */
import { REST_BASE, IS_LOGGED_IN, WP_USER_ID } from './api.js';

/* ── Session ID ── */
const SESSION_KEY = 'inkrush_session_id';
function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/* ── Device detection ── */
const SESSION_ID = getSessionId();
const DEVICE = window.innerWidth < 768 ? 'mobile' : 'desktop';

/* ── Queue ── */
let queue = [];
let flushTimer = null;
const FLUSH_INTERVAL = 30000; // 30 seconds
const MAX_QUEUE = 20;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL);
}

async function flush(useBeacon = false) {
  if (!IS_LOGGED_IN || !WP_USER_ID) return;
  if (queue.length === 0) return;
  if (!REST_BASE) return;

  const batch = queue.splice(0, 50);
  const payload = {
    session_id: SESSION_ID,
    device: DEVICE,
    events: batch,
  };

  const url = REST_BASE + '/track';

  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
    return;
  }

  try {
    const nonce = window.InkRushConfig?.nonce ?? '';
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': nonce,
      },
      credentials: 'include',
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // silently ignore network errors — analytics are non-critical
  }
}

/* ── Visibility change flush (beacon) ── */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    flush(true);
  }
});

/* ── Public API ── */

/**
 * Track an event.
 * @param {string} event
 * @param {Object} props
 */
export function track(event, props = {}) {
  if (!IS_LOGGED_IN || !WP_USER_ID) return;

  queue.push({
    event: String(event).slice(0, 200),
    props,
    ts: Math.floor(Date.now() / 1000),
  });

  if (queue.length >= MAX_QUEUE) {
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    flush();
    return;
  }

  scheduleFlush();
}

/**
 * Track a screen view event.
 * @param {string} screen
 */
export function trackScreenView(screen) {
  track('screen_view', { screen });
}
