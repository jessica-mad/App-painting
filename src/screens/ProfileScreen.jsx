import { useState, useEffect, useRef } from "react";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { useApp } from "../data/store";
import { useT } from "../i18n";
import { PushSettings } from "../components/PushSettings";
import { getUserLevel, getLevelName, LEVELS, TECHNIQUES } from "../data/parameters";
import { updateProfile, checkUsername, WP_LOGOUT_URL, IS_LOGGED_IN, WP_USER_ID, fetchUserArtworks } from "../utils/api";
import { compressImage } from "../utils/imageUtils";
import { IUser, IBrush, IFlame, ILink, ICopy, IHeart, IInspire, ITimer, IDice, IStar, ICheck, ILock, IBell } from "../components/Icons";
import { ArtworkModal } from "../components/ArtworkModal";

async function copyToClipboard(text, onDone) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error("no clipboard api");
    }
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none";
      document.body.appendChild(el);
      el.focus(); el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    } catch {}
  }
  onDone?.();
}

/* Tab IDs are stable keys, display comes from t() */
const TAB_SKETCHBOOK  = "sketchbook";
const TAB_EDIT        = "edit";
const TAB_ACHIEVEMENTS = "achievements";
const TAB_STATS       = "stats";

const TABS_OWNER = [TAB_SKETCHBOOK, TAB_EDIT, TAB_ACHIEVEMENTS, TAB_STATS];
const TABS_GUEST = [TAB_SKETCHBOOK, TAB_ACHIEVEMENTS, TAB_STATS];

export function ProfileScreen() {
  const { state, dispatch } = useApp();
  const t = useT();
  const { profile } = state;
  const level = getUserLevel(profile.completedChallenges, state.levels);

  /* Map legacy Spanish initial tab values to new keys */
  const mapLegacyTab = (raw) => {
    if (!raw) return TAB_SKETCHBOOK;
    if (raw === "Mi Sketchbook" || raw === TAB_SKETCHBOOK) return TAB_SKETCHBOOK;
    if (raw === "Editar"        || raw === TAB_EDIT)        return TAB_EDIT;
    if (raw === "Logros"        || raw === TAB_ACHIEVEMENTS) return TAB_ACHIEVEMENTS;
    if (raw === "Estadísticas"  || raw === TAB_STATS)       return TAB_STATS;
    return TAB_SKETCHBOOK;
  };

  const [tab, setTab] = useState(() => mapLegacyTab(state.profileInitialTab));

  const [editName,    setEditName]    = useState(profile.displayName);
  const [editBio,     setEditBio]     = useState(profile.bio ?? "");
  const [editEmail,   setEditEmail]   = useState(profile.email ?? "");
  const [editSocials, setEditSocials] = useState(profile.socials ?? { instagram: "", tiktok: "", pinterest: "" });
  const [editHandle,  setEditHandle]  = useState(profile.handle ?? "");
  const [handleStatus, setHandleStatus] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarB64,   setAvatarB64]   = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [saveError,   setSaveError]   = useState(null);
  const [copied,      setCopied]      = useState(false);
  const avatarRef   = useRef(null);
  const handleTimer = useRef(null);

  useEffect(() => {
    if (state.profileInitialTab) dispatch({ type: "CLEAR_PROFILE_TAB" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [artworks, setArtworks] = useState([]);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [loadingArt, setLoadingArt] = useState(false);

  const favTechs = TECHNIQUES.filter(t => state.favoriteTechniques.includes(t.id));
  const TABS = IS_LOGGED_IN ? TABS_OWNER : TABS_GUEST;

  useEffect(() => {
    if (tab !== TAB_SKETCHBOOK) return;
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

  const onHandleChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setEditHandle(clean);
    setHandleStatus(null);
    if (handleTimer.current) clearTimeout(handleTimer.current);
    if (clean.length < 3) { setHandleStatus(clean.length ? "invalid" : null); return; }
    setHandleStatus("checking");
    handleTimer.current = setTimeout(async () => {
      try {
        const res = await checkUsername(clean);
        setHandleStatus(res?.available ? "available" : "taken");
      } catch { setHandleStatus(null); }
    }, 500);
  };

  const handleSaveProfile = async () => {
    if (handleStatus === "taken" || handleStatus === "invalid") return;
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
          ...(editHandle && editHandle !== profile.handle ? { handle: editHandle } : {}),
        });
      }
      dispatch({ type: "UPDATE_PROFILE", data: {
        displayName: editName,
        bio: editBio,
        email: editEmail,
        socials: editSocials,
        handle: editHandle || profile.handle,
        ...(avatarPreview ? { avatarUrl: avatarPreview } : {}),
      }});
      setAvatarB64(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err?.message || t("profile.edit.error"));
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    if (IS_LOGGED_IN) {
      window.location.href = WP_LOGOUT_URL;
    } else {
      dispatch({ type: "LOGOUT" });
    }
  };

  const tabLabel = (key) => {
    if (key === TAB_SKETCHBOOK)   return t("profile.tab.sketchbook");
    if (key === TAB_EDIT)         return t("profile.tab.edit");
    if (key === TAB_ACHIEVEMENTS) return t("profile.tab.achievements");
    if (key === TAB_STATS)        return t("profile.tab.stats");
    return key;
  };

  const avatarSrc = avatarPreview || profile.avatarUrl || null;

  return (
    <Phone>
      <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile}/>
      {selectedArtwork && (
        <ArtworkModal
          post={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
        />
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Hero */}
        <div style={{ background: "var(--lilac)", borderBottom: "2px solid var(--ink)", padding: "12px 22px 14px", position: "relative", overflow: "hidden", flexShrink: 0 }} className="grain-soft">
          <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.1 }}/>

          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "notifications" })}
            style={{
              position: "absolute", top: 12, right: 16, zIndex: 10,
              width: 36, height: 36, borderRadius: 999,
              border: "2px solid var(--ink)",
              background: state.unreadNotifs > 0 ? "var(--butter)" : "rgba(20,17,15,.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: state.unreadNotifs > 0 ? "2px 2px 0 var(--ink)" : "none",
            }}
          >
            <IBell s={16}/>
            {state.unreadNotifs > 0 && (
              <span style={{
                position: "absolute", top: -5, right: -5,
                minWidth: 16, height: 16, borderRadius: 999,
                background: "var(--coral, #e55)", color: "#fff",
                border: "1.5px solid var(--ink)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, fontWeight: 800, padding: "0 3px",
              }}>
                {state.unreadNotifs > 99 ? "99+" : state.unreadNotifs}
              </span>
            )}
          </button>

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
                  onClick={() => { setTab(TAB_EDIT); avatarRef.current?.click(); }}
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
                  {getLevelName(level, state.lang)}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.6)" }}>
                  {profile.streak > 0
                    ? <><IFlame s={12}/> {t("profile.streak.ok", { n: profile.streak })}</>
                    : t("profile.streak.broken")
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 14 }}>
            {[
              { l: t("profile.counters.challenges"), v: profile.completedChallenges, onClick: null },
              { l: t("profile.counters.followers"),  v: profile.followers > 999 ? `${(profile.followers / 1000).toFixed(1)}K` : profile.followers, onClick: IS_LOGGED_IN ? () => dispatch({ type: "VIEW_FOLLOW_LIST", userId: WP_USER_ID, listType: "followers" }) : null },
              { l: t("profile.counters.following"),  v: profile.following, onClick: IS_LOGGED_IN ? () => dispatch({ type: "VIEW_FOLLOW_LIST", userId: WP_USER_ID, listType: "following" }) : null },
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
          {TABS.map((key, i) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: "10px 0", border: "none",
              borderRight: i < TABS.length - 1 ? "2px solid var(--ink)" : "none",
              background: tab === key ? "var(--acid)" : "var(--paper-2)",
              fontWeight: 800, fontSize: 10, fontFamily: "JetBrains Mono",
              textTransform: "uppercase", letterSpacing: "0.03em", cursor: "pointer",
            }}>{tabLabel(key)}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 22px 90px" }}>

          {tab === TAB_SKETCHBOOK && (
            <div>
              {favTechs.length > 0 && (
                <>
                  <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>{t("profile.work.tech")}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                    {favTechs.map(tech => (
                      <span key={tech.id} style={{ display: "inline-flex", gap: 5, alignItems: "center", padding: "5px 10px", borderRadius: 999, border: "2px solid var(--ink)", background: tech.color || "var(--sky)", fontSize: 11, fontWeight: 700 }}>
                        <IBrush s={13}/> {tech.label}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 10 }}>{t("profile.work.done")}</p>
              {loadingArt && (
                <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.4)", animation: "pulse 1.5s ease-in-out infinite" }}>{t("profile.loading")}</p>
              )}
              {!loadingArt && artworks.length === 0 && (
                <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.45)" }}>
                  {t("profile.empty")}
                </p>
              )}
              {artworks.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, margin: "0 -22px" }}>
                  {artworks.map((aw, i) => {
                    const img = aw.images?.[0] || aw.image;
                    return (
                      <div key={aw.id ?? i} onClick={() => setSelectedArtwork(aw)} style={{ aspectRatio: "3/4", background: "var(--lilac)", overflow: "hidden", position: "relative", cursor: "pointer" }}>
                        {img
                          ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `var(--${["rose","lilac","sky","mint","butter","acid"][i%6]})` }}>
                              <p className="serif" style={{ fontSize: 9, padding: "6px", textAlign: "center", lineHeight: 1.2 }}>{aw.prompt}</p>
                            </div>
                        }
                        {aw.hidden && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(20,17,15,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <p className="mono" style={{ fontSize: 8, color: "white", fontWeight: 800 }}>{t("profile.hidden")}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === TAB_EDIT && (
            <div>
              <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 16 }}>{t("profile.edit.title")}</p>

              {/* Avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: 999, border: "3px solid var(--ink)", background: "var(--rose)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {avatarSrc
                    ? <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                    : <IUser s={32}/>
                  }
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 6 }}>{t("profile.edit.avatar")}</p>
                  <button
                    onClick={() => avatarRef.current?.click()}
                    className="stk-sm"
                    style={{ height: 36, padding: "0 14px", border: "2px solid var(--ink)", borderRadius: 10, background: "var(--paper-2)", fontWeight: 800, fontSize: 11, cursor: "pointer" }}
                  >
                    {t("profile.edit.avatar.change")}
                  </button>
                </div>
              </div>

              <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>{t("profile.edit.name")}</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                style={{ width: "100%", border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 14, outline: "none", background: "var(--paper-2)", marginBottom: 14 }}/>

              <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>{t("profile.edit.handle")}</label>
              <div style={{ position: "relative", marginBottom: 6 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontWeight: 800, fontSize: 14, color: "rgba(20,17,15,.45)", fontFamily: "Space Grotesk" }}>@</span>
                <input
                  type="text"
                  value={editHandle}
                  onChange={e => onHandleChange(e.target.value)}
                  placeholder="tuhandle"
                  style={{ width: "100%", border: `2px solid ${handleStatus === "taken" || handleStatus === "invalid" ? "var(--coral)" : handleStatus === "available" ? "var(--mint)" : "var(--ink)"}`, borderRadius: 12, padding: "10px 12px 10px 28px", fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 14, outline: "none", background: "var(--paper-2)", transition: "border-color .2s" }}
                />
              </div>
              <p className="mono" style={{ fontSize: 9, fontWeight: 700, marginBottom: 14, color: handleStatus === "taken" || handleStatus === "invalid" ? "var(--coral)" : handleStatus === "available" ? "var(--mint)" : "rgba(20,17,15,.5)" }}>
                {handleStatus === "checking"  && t("profile.edit.handle.checking")}
                {handleStatus === "available" && t("profile.edit.handle.available")}
                {handleStatus === "taken"     && t("profile.edit.handle.taken")}
                {handleStatus === "invalid"   && t("profile.edit.handle.invalid")}
                {!handleStatus && `@${editHandle || profile.handle || "…"} · visible en el buscador`}
              </p>

              <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>{t("profile.edit.bio")}</label>
              <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder={t("profile.edit.bio.placeholder")}
                style={{ width: "100%", height: 80, border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, resize: "none", outline: "none", background: "var(--paper-2)", marginBottom: 14 }}/>

              <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>{t("profile.edit.email")}</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                style={{ width: "100%", border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 13, outline: "none", background: "var(--paper-2)", marginBottom: 16 }}/>

              <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>{t("profile.edit.socials")}</p>
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

              {/* Language selector */}
              <div style={{ marginTop: 16, marginBottom: 6 }}>
                <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 10 }}>{t("profile.lang.label")}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {["es", "en"].map(lang => (
                    <button
                      key={lang}
                      onClick={() => dispatch({ type: "SET_LANG", lang })}
                      style={{
                        flex: 1, height: 44, borderRadius: 12,
                        border: "2px solid var(--ink)",
                        background: state.lang === lang ? "var(--ink)" : "var(--paper-2)",
                        color: state.lang === lang ? "var(--acid)" : "var(--ink)",
                        fontWeight: 800, fontSize: 13,
                        cursor: "pointer",
                        boxShadow: state.lang === lang ? "3px 3px 0 var(--ink)" : "none",
                        fontFamily: "Space Grotesk",
                        transition: "background .15s",
                      }}
                    >
                      {t(`profile.lang.${lang}`)}
                    </button>
                  ))}
                </div>
              </div>

              {saveError && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--rose)", border: "2px solid var(--ink)", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4 }}>
                  ⚠ {saveError}
                </div>
              )}
              <button onClick={handleSaveProfile} disabled={saving} className="stk"
                style={{ width: "100%", height: 50, background: saved ? "var(--mint)" : "var(--acid)", border: "2px solid var(--ink)", borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1, marginTop: 10, marginBottom: 24 }}>
                {saved ? t("profile.edit.saved") : saving ? t("profile.edit.saving") : t("profile.edit.save")}
              </button>

              <PushSettings />

              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => dispatch({ type: "SET_SCREEN", screen: "bugReport" })}
                  className="stk-sm"
                  style={{ width: "100%", height: 44, background: "var(--paper-2)", border: "2px solid rgba(20,17,15,.25)", borderRadius: 14, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {t("profile.edit.bug")}
                </button>
                <button onClick={handleLogout} className="stk-sm"
                  style={{ width: "100%", height: 48, background: "var(--rose)", border: "2px solid var(--ink)", borderRadius: 14, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                  {t("profile.edit.logout")}
                </button>
              </div>
            </div>
          )}

          {tab === TAB_ACHIEVEMENTS && (
            <div>
              <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 12 }}>{t("profile.achievements.title")}</p>
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
                        <p style={{ fontWeight: 800, fontSize: 13 }}>{getLevelName(lv, state.lang)}</p>
                        <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>{lv.minChallenges}+ {t("profile.counters.challenges").toLowerCase()} · {(state.lang === "en" && lv.desc_en) ? lv.desc_en : lv.desc}</p>
                      </div>
                      {unlocked
                        ? <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>{current ? t("profile.achievements.current") : <ICheck s={12} stroke="var(--acid)"/>}</span>
                        : <ILock s={16} stroke="rgba(20,17,15,.4)"/>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === TAB_STATS && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
                {[
                  { Ico: IHeart,   l: t("home.stats.likes"),    v: profile.totalLikes,    c: "var(--rose)" },
                  { Ico: IInspire, l: t("home.stats.inspires"), v: profile.totalInspires, c: "var(--lilac)" },
                  { Ico: IFlame,   l: t("home.stats.tries"),    v: profile.totalTries,    c: "var(--butter)" },
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
                  { Ico: ITimer, l: t("profile.stats.sessions"),   v: profile.pomodorosCompleted,  c: "var(--sky)" },
                  { Ico: IDice,  l: t("profile.stats.challenges"),  v: profile.completedChallenges, c: "var(--mint)" },
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
                  <p style={{ fontWeight: 800, fontSize: 13 }}>{t("profile.stats.community")}</p>
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(20,17,15,.65)", marginTop: 6 }}>
                  {t("profile.stats.inspired", { n: profile.totalInspires })}
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
