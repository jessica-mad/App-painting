/* Utilidad de conexión con la REST API de WordPress (inkrush/v1) */

const cfg = window.InkRushConfig ?? {};
const BASE  = cfg.apiUrl  ?? "";
const NONCE = cfg.nonce   ?? "";

async function apiFetch(path, options = {}) {
  if (!BASE) return null;
  const isFormData = options.body instanceof FormData;
  const res = await fetch(BASE + path, {
    headers: isFormData
      ? { "X-WP-Nonce": NONCE }
      : { "Content-Type": "application/json", "X-WP-Nonce": NONCE },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `API error ${res.status}` }));
    throw Object.assign(new Error(err.message || `API error ${res.status}`), { code: err.code, status: res.status });
  }
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
  const { images, ...rest } = data;
  return apiFetch("/artworks", {
    method: "POST",
    body:   JSON.stringify({ ...rest, images: images ?? [] }),
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

/* ── Registro e identidad ── */
export async function registerUser({ email, password, displayName }) {
  return apiFetch("/register", {
    method: "POST",
    body:   JSON.stringify({ email, password, displayName }),
  });
}

export async function loginUser({ email, password }) {
  return apiFetch("/auth/login", {
    method: "POST",
    body:   JSON.stringify({ email, password }),
  });
}

export async function updateProfile(data) {
  return apiFetch("/users/me", {
    method: "POST",
    body:   JSON.stringify(data),
  });
}

/* ── Intentos diarios ── */
export async function useRoll() {
  if (!IS_LOGGED_IN) return null;
  return apiFetch("/rolls/use", { method: "POST" }).catch(() => null);
}

export async function resetRollsAdmin(userId) {
  return apiFetch("/rolls/reset", {
    method: "POST",
    body:   JSON.stringify({ userId }),
  });
}

export async function fetchUserArtworks(userId, page = 1) {
  return apiFetch(`/artworks?author=${userId}&page=${page}`);
}

export async function fetchUserProfile(userId) {
  return apiFetch(`/users/${userId}`);
}

export async function followUser(userId) {
  return apiFetch(`/users/${userId}/follow`, { method: "POST" });
}

export async function fetchUserFollowing(userId) {
  return apiFetch(`/users/${userId}/following`);
}

export async function fetchUserFollowers(userId) {
  return apiFetch(`/users/${userId}/followers`);
}

export async function deleteArtwork(id) {
  return apiFetch(`/artworks/${id}`, { method: "DELETE" });
}

export async function hideArtwork(id) {
  return apiFetch(`/artworks/${id}/hide`, { method: "POST" });
}

export async function reportArtwork(id, reason = "") {
  return apiFetch(`/artworks/${id}/report`, {
    method: "POST",
    body:   JSON.stringify({ reason }),
  });
}

export async function fetchReports() {
  return apiFetch("/reports");
}

export async function republishArtwork(id) {
  return apiFetch(`/artworks/${id}/republish`, { method: "POST" });
}

/* ── Música: URLs por track ── */
export async function fetchMusicSrcs() {
  return apiFetch("/music-srcs");
}

export async function saveMusicSrcs(srcs) {
  return apiFetch("/music-srcs", {
    method: "POST",
    body:   JSON.stringify(srcs),
  });
}

/* ── IA: keyword rain ── */
export async function generateAIKeywords(variables) {
  return apiFetch('/ai/keywords', {
    method: 'POST',
    body: JSON.stringify({ variables }),
  });
}

/* ── Config de WP ── */
export const WP_USER_ID      = cfg.userId      ?? 0;
export const IS_LOGGED_IN    = WP_USER_ID > 0;
export const WP_LOGIN_URL    = cfg.loginUrl    ?? "/wp-login.php";
export const WP_LOGOUT_URL   = cfg.logoutUrl   ?? "/wp-login.php?action=logout";
export const WP_ROLLS        = cfg.rolls       ?? 3;
export const WP_ROLLS_USED   = cfg.rollsUsedToday ?? 0;
export const WP_SEASON       = cfg.activeSeason ?? "";
export const IS_ADMIN        = cfg.isAdmin     ?? false;
