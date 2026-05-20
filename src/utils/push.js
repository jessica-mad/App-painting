import { REST_BASE } from "./api";

const VAPID_KEY = window.InkRushConfig?.vapidPublicKey ?? "";
const SW_URL    = window.InkRushConfig?.pushSwUrl ?? "/push-sw.js";

/* ── iOS detection ────────────────────────────────────────── */

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
         window.navigator.standalone === true;
}

export function iosNeedsGuide() {
  return isIOS() && !isStandalone();
}

/* ── Permission & support ─────────────────────────────────── */

export function isPushSupported() {
  return "serviceWorker" in navigator &&
         "PushManager" in window &&
         "Notification" in window;
}

export function isPushBlocked() {
  return "Notification" in window && Notification.permission === "denied";
}

/* ── urlBase64ToUint8Array (VAPID helper) ─────────────────── */

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

/* ── Register SW ──────────────────────────────────────────── */

async function getRegistration() {
  try {
    // Check for an existing registration covering root scope
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (existing) return existing;
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    // Wait until the SW is activated before returning
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.error("[Musai push] SW registration failed:", e);
    return null;
  }
}

/* ── Subscribe ────────────────────────────────────────────── */

export async function subscribePush() {
  if (!isPushSupported() || !VAPID_KEY) throw new Error("Push no soportado");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permiso denegado");

  const reg = await getRegistration();
  if (!reg) throw new Error("Service Worker no disponible");

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
  });

  const json = sub.toJSON();
  await fetch(`${REST_BASE}push/subscribe`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "X-WP-Nonce": window.InkRushConfig?.nonce ?? "" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh:   json.keys.p256dh,
      auth:     json.keys.auth,
    }),
  });

  return sub;
}

/* ── Unsubscribe ──────────────────────────────────────────── */

export async function unsubscribePush() {
  const reg = await navigator.serviceWorker.getRegistration("/");
  if (!reg) return;

  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  const json = sub.toJSON();
  await fetch(`${REST_BASE}push/unsubscribe`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "X-WP-Nonce": window.InkRushConfig?.nonce ?? "" },
    body: JSON.stringify({ endpoint: json.endpoint }),
  });

  await sub.unsubscribe();
}

/* ── Check subscription status ───────────────────────────── */

export async function getPushStatus() {
  try {
    const res  = await fetch(`${REST_BASE}push/status`, {
      headers: { "X-WP-Nonce": window.InkRushConfig?.nonce ?? "" },
    });
    return await res.json();
  } catch {
    return { subscribed: false, musaiHour: "" };
  }
}

/* ── Save Musai hour ──────────────────────────────────────── */

export async function saveMusaiHour(hour) {
  await fetch(`${REST_BASE}push/musai-hour`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "X-WP-Nonce": window.InkRushConfig?.nonce ?? "" },
    body: JSON.stringify({ hour }),
  });
}
