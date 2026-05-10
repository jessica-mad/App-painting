/* Utilidad de conexión con la REST API de WordPress (inkrush/v1) */

const cfg = window.InkRushConfig ?? {};
const BASE  = cfg.apiUrl  ?? "";    // ej: https://tu-web.com/wp-json/inkrush/v1
const NONCE = cfg.nonce   ?? "";

async function apiFetch(path, options = {}) {
  if (!BASE) return null;           // modo demo sin WP
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json", "X-WP-Nonce": NONCE },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/* ── Parámetros / variables ── */
export async function fetchParameters(filters = {}) {
  const qs = new URLSearchParams(filters).toString();
  return apiFetch(`/parameters${qs ? "?" + qs : ""}`);
}

/* ── Obras (artworks) ── */
export async function fetchArtworks({ page = 1, technique, rarity } = {}) {
  const qs = new URLSearchParams({ page, ...(technique && { technique }), ...(rarity && { rarity }) }).toString();
  return apiFetch(`/artworks?${qs}`);
}

export async function createArtwork(data) {
  return apiFetch("/artworks", {
    method:  "POST",
    body:    JSON.stringify(data),
  });
}

export async function addReaction(artworkId, type) {
  return apiFetch(`/artworks/${artworkId}/react`, {
    method: "POST",
    body:   JSON.stringify({ type }),
  });
}

/* ── Retos ── */
export async function completeChallenge() {
  return apiFetch("/challenge/complete", { method: "POST" });
}

/* ── Config de WP ── */
export const WP_USER_ID   = cfg.userId   ?? 0;
export const IS_LOGGED_IN = WP_USER_ID > 0;
export const WP_LOGIN_URL = cfg.loginUrl ?? "/wp-login.php";
export const WP_ROLLS     = cfg.rolls    ?? 3;
export const WP_SEASON    = cfg.activeSeason ?? "";
