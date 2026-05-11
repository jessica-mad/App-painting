import { useState, useEffect, useRef } from "react";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { useApp } from "../data/store";
import { getUserLevel, LEVELS, TECHNIQUES } from "../data/parameters";
import { updateProfile, WP_LOGOUT_URL, IS_LOGGED_IN, WP_USER_ID, fetchUserArtworks } from "../utils/api";
import { compressImage } from "../utils/imageUtils";
import { IUser, IBrush, IFlame, ILink, ICopy, IHeart, IInspire, ITimer, IDice, IStar, ICheck, ILock } from "../components/Icons";

function copyToClipboard(text, onDone) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(onDone).catch(() => legacyCopy(text, onDone));
  } else {
    legacyCopy(text, onDone);
  }
}
function legacyCopy(text, onDone) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;opacity:0;top:0;left:0";
  document.body.appendChild(el);
  el.focus(); el.select();
  try { document.execCommand("copy"); onDone?.(); } catch {}
  document.body.removeChild(el);
}

const TABS_OWNER  = ["Perfil", "Editar", "Logros", "Estadísticas"];
const TABS_GUEST  = ["Perfil", "Logros", "Estadísticas"];

export function ProfileScreen() {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const level = getUserLevel(profile.completedChallenges);
  const [tab, setTab] = useState("Perfil");

  /* edit state */
  const [editName,    setEditName]    = useState(profile.displayName);
  const [editBio,     setEditBio]     = useState(profile.bio ?? "");
  const [editEmail,   setEditEmail]   = useState(profile.email ?? "");
  const [editSocials, setEditSocials] = useState(profile.socials ?? { instagram: "", tiktok: "", pinterest: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarB64,   setAvatarB64]   = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [saveError,   setSaveError]   = useState(null);
  const [copied,      setCopied]      = useState(false);
  const avatarRef = useRef(null);

  /* artworks */
  const [artworks, setArtworks] = useState([]);
  const [loadingArt, setLoadingArt] = useState(false);

  const favTechs = TECHNIQUES.filter(t => state.favoriteTechniques.includes(t.id));
  const TABS = IS_LOGGED_IN ? TABS_OWNER : TABS_GUEST;

  /* share link — use WP-provided URL (username-based) or build from window */
  const shareLink = profile.shareLink ||
    `${window.location.origin}${window.location.pathname.replace(/\/$/, "")}?u=${profile.username}`;

  useEffect(() => {
    if (tab !== "Perfil") return;
    if (!IS_LOGGED_IN) return;
    setLoadingArt(true);
    fetchUserArtworks(WP_USER_ID)
      .then(data => setArtworks(data?.artworks ?? []))
      .catch(() => {})
      .finally(() => setLoadingArt(false));
  }, [tab]);

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await compressImage(file, { maxPx: 400, quality: 0.75 });
    setAvatarPreview(b64);
    setAvatarB64(b64);
    e.target.value = "";
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (IS_LOGGED_IN) {
        await updateProfile({
          displayName: editName,
          bio: editBio,
          email: editEmail,
          socials: editSocials,
          ...(avatarB64 ? { avatar: avatarB64 } : {}),
        });
      }
      dispatch({ type: "UPDATE_PROFILE", data: {
        displayName: editName,
        bio: editBio,
        email: editEmail,
        socials: editSocials,
        ...(avatarPreview ? { avatarUrl: avatarPreview } : {}),
      }});
      setAvatarB64(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err?.message || "No se pudieron guardar los cambios. Revisa tu conexión.");
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    if (IS_LOGGED_IN) {
      window.location.href = WP_LOGOUT_URL;
    } else {
      dispatch({ type: "LOGOUT" });
    }
  };

  const avatarSrc = avatarPreview || profile.avatarUrl || null;

  return (
    <Phone>
      <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile}/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Hero */}
        <div style={{ background: "var(--lilac)", borderBottom: "2px solid var(--ink)", padding: "12px 22px 14px", position: "relative", overflow: "hidden", flexShrink: 0 }} className="grain-soft">
          <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.1 }}/>
          <div style={{ display: "flex", gap: 14, position: "relative" }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 76, height: 76, borderRadius: 999, border: "3px solid var(--ink)", background: "var(--rose)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "4px 4px 0 var(--ink)", overflow: "hidden" }}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                  : <IUser s={40}/>
                }
              </div>
              {IS_LOGGED_IN && (
                <button
                  onClick={() => { setTab("Editar"); avatarRef.current?.click(); }}
                  style={{ position: "absolute", bottom: -4, right: -4, width: 28, height: 28, borderRadius: 999, background: "var(--acid)", border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <IBrush s={14}/>
                </button>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p className="serif" style={{ fontSize: 24, lineHeight: 1 }}>{profile.displayName}</p>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.55)", marginTop: 2 }}>@{profile.username}</p>
              {profile.bio && <p style={{ fontSize: 11, fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>{profile.bio}</p>}
              <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>
                  {level.name}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.6)" }}>
                  <IFlame s={12}/> {profile.streak} días
                </span>
              </div>
            </div>
          </div>

          {/* Share link */}
          <div className="stk-sm" style={{ marginTop: 12, background: "var(--paper-2)", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <ILink s={14}/>
            <span className="mono" style={{ fontSize: 10, fontWeight: 700, flex: 1, color: "rgba(20,17,15,.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {shareLink.replace(/^https?:\/\//, "")}
            </span>
            <button
              onClick={() => copyToClipboard(shareLink, () => { setCopied(true); setTimeout(() => setCopied(false), 1800); })}
              style={{ background: copied ? "var(--mint)" : "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", transition: "background .2s", flexShrink: 0 }}
            >
              {copied ? <ICheck s={11}/> : <ICopy s={11}/>} {copied ? "Copiado" : "Copiar"}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 14 }}>
            {[
              { l: "Retos",      v: profile.completedChallenges, onClick: null },
              { l: "Seguidores", v: profile.followers > 999 ? `${(profile.followers / 1000).toFixed(1)}K` : profile.followers, onClick: IS_LOGGED_IN ? () => dispatch({ type: "VIEW_FOLLOW_LIST", userId: state.user?.id ?? 0, listType: "followers" }) : null },
              { l: "Siguiendo",  v: profile.following, onClick: IS_LOGGED_IN ? () => dispatch({ type: "VIEW_FOLLOW_LIST", userId: state.user?.id ?? 0, listType: "following" }) : null },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", cursor: s.onClick ? "pointer" : "default" }} onClick={s.onClick ?? undefined}>
                <p className="serif" style={{ fontSize: 22, lineHeight: 1, textDecoration: s.onClick ? "underline" : "none" }}>{s.v}</p>
                <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)", marginTop: 2 }}>{s.l.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--ink)", flexShrink: 0 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "10px 0", border: "none",
              borderRight: i < TABS.length - 1 ? "2px solid var(--ink)" : "none",
              background: tab === t ? "var(--acid)" : "var(--paper-2)",
              fontWeight: 800, fontSize: 10, fontFamily: "JetBrains Mono",
              textTransform: "uppercase", letterSpacing: "0.03em", cursor: "pointer",
            }}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 22px 90px" }}>

          {tab === "Perfil" && (
            <div>
              {favTechs.length > 0 && (
                <>
                  <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>Mis técnicas</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                    {favTechs.map(t => (
                      <span key={t.id} style={{ display: "inline-flex", gap: 5, alignItems: "center", padding: "5px 10px", borderRadius: 999, border: "2px solid var(--ink)", background: t.color || "var(--sky)", fontSize: 11, fontWeight: 700 }}>
                        <IBrush s={13}/> {t.label}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 10 }}>Mis obras</p>
              {loadingArt && (
                <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.4)", animation: "pulse 1.5s ease-in-out infinite" }}>// CARGANDO...</p>
              )}
              {!loadingArt && artworks.length === 0 && (
                <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.45)" }}>
                  // TUS PUBLICACIONES APARECERÁN AQUÍ
                </p>
              )}
              {artworks.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, margin: "0 -22px" }}>
                  {artworks.map((aw, i) => {
                    const img = aw.images?.[0] || aw.image;
                    return (
                      <div key={aw.id ?? i} style={{ aspectRatio: "3/4", background: "var(--lilac)", overflow: "hidden", position: "relative" }}>
                        {img
                          ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `var(--${["rose","lilac","sky","mint","butter","acid"][i%6]})` }}>
                              <p className="serif" style={{ fontSize: 9, padding: "6px", textAlign: "center", lineHeight: 1.2 }}>{aw.prompt}</p>
                            </div>
                        }
                        {aw.hidden && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(20,17,15,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <p className="mono" style={{ fontSize: 8, color: "white", fontWeight: 800 }}>OCULTA</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "Editar" && (
            <div>
              <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 16 }}>Editar perfil</p>

              {/* Avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: 999, border: "3px solid var(--ink)", background: "var(--rose)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {avatarSrc
                    ? <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                    : <IUser s={32}/>
                  }
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 6 }}>Foto de perfil</p>
                  <button
                    onClick={() => avatarRef.current?.click()}
                    className="stk-sm"
                    style={{ height: 36, padding: "0 14px", border: "2px solid var(--ink)", borderRadius: 10, background: "var(--paper-2)", fontWeight: 800, fontSize: 11, cursor: "pointer" }}
                  >
                    Cambiar foto
                  </button>
                </div>
              </div>

              <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>Nombre artístico</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                style={{ width: "100%", border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 14, outline: "none", background: "var(--paper-2)", marginBottom: 14 }}/>

              <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>Biografía</label>
              <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Cuéntanos sobre ti..."
                style={{ width: "100%", height: 80, border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, resize: "none", outline: "none", background: "var(--paper-2)", marginBottom: 14 }}/>

              <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>Email</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                style={{ width: "100%", border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 13, outline: "none", background: "var(--paper-2)", marginBottom: 16 }}/>

              <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>Redes sociales</p>
              {[
                { key: "instagram", label: "Instagram", placeholder: "@usuario" },
                { key: "tiktok",    label: "TikTok",    placeholder: "@usuario" },
                { key: "pinterest", label: "Pinterest", placeholder: "usuario" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <label style={{ fontWeight: 700, fontSize: 11, display: "block", marginBottom: 4, color: "rgba(20,17,15,.6)" }}>{label}</label>
                  <input type="text" value={editSocials[key] ?? ""} onChange={e => setEditSocials(s => ({ ...s, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: "100%", border: "2px solid var(--ink)", borderRadius: 10, padding: "8px 12px", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, outline: "none", background: "var(--paper-2)" }}/>
                </div>
              ))}

              {saveError && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--rose)", border: "2px solid var(--ink)", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4 }}>
                  ⚠ {saveError}
                </div>
              )}
              <button onClick={handleSaveProfile} disabled={saving} className="stk"
                style={{ width: "100%", height: 50, background: saved ? "var(--mint)" : "var(--acid)", border: "2px solid var(--ink)", borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1, marginTop: 10, marginBottom: 24 }}>
                {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar cambios"}
              </button>

              <div style={{ borderTop: "2px solid var(--ink)", paddingTop: 20 }}>
                <button onClick={handleLogout} className="stk-sm"
                  style={{ width: "100%", height: 48, background: "var(--rose)", border: "2px solid var(--ink)", borderRadius: 14, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}

          {tab === "Logros" && (
            <div>
              <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 12 }}>Tu camino de artista</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {LEVELS.map(lv => {
                  const unlocked = level.id >= lv.id;
                  const current  = level.id === lv.id;
                  return (
                    <div key={lv.id} className={current ? "stk" : "stk-sm"} style={{
                      background: unlocked ? (lv.color || "var(--mint)") : "var(--paper)",
                      padding: 12, opacity: unlocked ? 1 : 0.5, display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IBrush s={20}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 800, fontSize: 13 }}>{lv.name}</p>
                        <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>{lv.minChallenges}+ RETOS</p>
                      </div>
                      {unlocked
                        ? <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>{current ? "Actual" : <ICheck s={12} stroke="var(--acid)"/>}</span>
                        : <ILock s={16} stroke="rgba(20,17,15,.4)"/>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "Estadísticas" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
                {[
                  { Ico: IHeart,   l: "Likes",       v: profile.totalLikes,    c: "var(--rose)" },
                  { Ico: IInspire, l: "Inspiras",     v: profile.totalInspires, c: "var(--lilac)" },
                  { Ico: IFlame,   l: "Lo intentaré", v: profile.totalTries,    c: "var(--butter)" },
                ].map((s, i) => (
                  <div key={i} className="stk-sm" style={{ background: "var(--paper-2)", padding: 10, textAlign: "center" }}>
                    <div style={{ width: 30, height: 30, margin: "0 auto", borderRadius: 8, background: s.c, border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <s.Ico s={16}/>
                    </div>
                    <div className="serif" style={{ fontSize: 20, lineHeight: 1, marginTop: 6 }}>{s.v}</div>
                    <div className="mono" style={{ fontSize: 8, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 2 }}>{s.l.toUpperCase()}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { Ico: ITimer, l: "Pomodoros",  v: profile.pomodorosCompleted, c: "var(--sky)" },
                  { Ico: IDice,  l: "Retos",       v: profile.completedChallenges, c: "var(--mint)" },
                ].map((s, i) => (
                  <div key={i} className="stk-sm" style={{ background: s.c, padding: 14 }}>
                    <s.Ico s={22}/>
                    <div className="serif" style={{ fontSize: 28, lineHeight: 1, marginTop: 8 }}>{s.v}</div>
                    <div className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.6)", marginTop: 4 }}>{s.l.toUpperCase()}</div>
                  </div>
                ))}
              </div>
              <div className="stk" style={{ background: "var(--acid)", padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <IStar s={18}/>
                  <p style={{ fontWeight: 800, fontSize: 13 }}>Impacto en la comunidad</p>
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(20,17,15,.65)", marginTop: 6 }}>
                  Has inspirado a {profile.totalInspires} artistas. ¡Sigue así!
                </p>
              </div>
            </div>
          )}
        </div>

        <BottomNav current="profile"/>
      </div>
    </Phone>
  );
}
