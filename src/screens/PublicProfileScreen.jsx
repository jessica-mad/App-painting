import { useState, useEffect } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { fetchUserProfile, fetchUserArtworks, followUser, IS_LOGGED_IN, WP_USER_ID } from "../utils/api";
import { getUserLevel, getLevelName } from "../data/parameters";
import { IUser, IFlame, IBrush, IArrowL, ICheck, ILink, ICopy, IHeart, IInspire } from "../components/Icons";
import { ArtworkModal } from "../components/ArtworkModal";
import { useT } from "../i18n";

const COL_CYCLE = ["var(--rose)", "var(--lilac)", "var(--sky)", "var(--mint)", "var(--butter)", "var(--acid)"];

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.cssText = "position:fixed;top:-9999px;opacity:0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  } catch {}
}

export function PublicProfileScreen() {
  const { state, dispatch } = useApp();
  const t = useT();
  const userId = state.viewingUserId;

  const [profile,       setProfile]       = useState(null);
  const [artworks,      setArtworks]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [following,     setFollowing]     = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeArt,     setActiveArt]     = useState(null);
  const [copied,        setCopied]        = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      fetchUserProfile(userId).catch(() => null),
      fetchUserArtworks(userId).catch(() => null),
    ]).then(([prof, arts]) => {
      if (prof) {
        setProfile(prof);
        setFollowing(prof.isFollowing ?? false);
      }
      if (arts?.artworks) setArtworks(arts.artworks);
    }).finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    if (!IS_LOGGED_IN || !userId) return;
    setFollowLoading(true);
    try {
      const res = await followUser(userId);
      const nowFollowing = res?.following ?? !following;
      setFollowing(nowFollowing);
      setProfile(p => p ? ({
        ...p,
        followers: Math.max(0, (p.followers ?? 0) + (nowFollowing ? 1 : -1)),
      }) : p);
    } catch {}
    finally { setFollowLoading(false); }
  };

  const handleCopy = async () => {
    if (!profile?.shareLink) return;
    await copyText(profile.shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const goBack = () => dispatch({ type: "CLEAR_VIEW_USER" });

  const level    = profile ? getUserLevel(profile.completedChallenges ?? 0, state.levels) : null;
  const avatarSrc = profile?.avatarUrl || null;
  const col      = COL_CYCLE[(userId ?? 0) % COL_CYCLE.length];
  const handle   = profile?.handle || profile?.username || "artista";
  const isOwnProfile = IS_LOGGED_IN && parseInt(userId) === WP_USER_ID;

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "10px 18px 8px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={goBack}
            style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, cursor: "pointer", padding: 0 }}
          >
            <IArrowL s={16}/> {t("public.back")}
          </button>
        </div>

        {loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="mono" style={{ fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>{t("public.loading")}</p>
          </div>
        )}

        {!loading && !profile && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <p className="serif" style={{ fontSize: 28, lineHeight: 1 }}>{t("public.notFound")}</p>
            <button onClick={goBack} className="stk-sm" style={{ marginTop: 16, height: 40, padding: "0 16px", borderRadius: 12, border: "2px solid var(--ink)", background: "var(--paper-2)", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              {t("public.notFound.back")}
            </button>
          </div>
        )}

        {!loading && profile && (
          <div className="scroll" style={{ flex: 1, padding: "0 0 24px", position: "relative" }}>
            {activeArt && <ArtworkModal post={activeArt} onClose={() => setActiveArt(null)}/>}

            {/* ── Profile hero ── */}
            <div style={{ background: "var(--lilac)", padding: "20px 18px", position: "relative", overflow: "hidden" }} className="grain-soft">
              <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.12 }}/>
              <div style={{ position: "relative" }}>

                {/* Avatar + name */}
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 999,
                    border: "3px solid var(--ink)", background: col,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", boxShadow: "4px 4px 0 var(--ink)", flexShrink: 0,
                  }}>
                    {avatarSrc
                      ? <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                      : <IUser s={34}/>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>
                      @{handle.toLowerCase()}
                    </p>
                    <h2 className="serif" style={{ fontSize: 24, lineHeight: 1, marginTop: 2 }}>
                      {profile.displayName || profile.display_name || t("public.artist")}
                    </h2>
                    <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
                      {level && (
                        <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>
                          {getLevelName(level, state.lang)}
                        </span>
                      )}
                      {(profile.streak ?? 0) > 0 && (
                        <span style={{ background: "var(--butter)", border: "1.5px solid var(--ink)", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", gap: 3 }}>
                          <IFlame s={10}/> {profile.streak}d
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginTop: 12, color: "rgba(20,17,15,.8)" }}>
                    {profile.bio}
                  </p>
                )}

                {/* Socials */}
                {(profile.socials?.instagram || profile.socials?.tiktok || profile.socials?.pinterest) && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {profile.socials?.instagram && (
                      <span className="mono" style={{ fontSize: 10, fontWeight: 700, background: "rgba(20,17,15,.1)", padding: "3px 8px", borderRadius: 999 }}>
                        IG @{profile.socials.instagram.replace(/^@/, "")}
                      </span>
                    )}
                    {profile.socials?.tiktok && (
                      <span className="mono" style={{ fontSize: 10, fontWeight: 700, background: "rgba(20,17,15,.1)", padding: "3px 8px", borderRadius: 999 }}>
                        TT @{profile.socials.tiktok.replace(/^@/, "")}
                      </span>
                    )}
                    {profile.socials?.pinterest && (
                      <span className="mono" style={{ fontSize: 10, fontWeight: 700, background: "rgba(20,17,15,.1)", padding: "3px 8px", borderRadius: 999 }}>
                        PIN @{profile.socials.pinterest.replace(/^@/, "")}
                      </span>
                    )}
                  </div>
                )}

                {/* Share URL */}
                {profile.shareLink && (
                  <button
                    onClick={handleCopy}
                    style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(20,17,15,.08)", border: "1.5px solid rgba(20,17,15,.2)", borderRadius: 999, padding: "4px 10px", cursor: "pointer", maxWidth: "100%", overflow: "hidden" }}
                  >
                    {copied ? <ICheck s={12}/> : <ICopy s={12}/>}
                    <span className="mono" style={{ fontSize: 9, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(20,17,15,.7)" }}>
                      {copied ? t("public.copied") : profile.shareLink.replace(/^https?:\/\//, "")}
                    </span>
                  </button>
                )}

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0, marginTop: 14, borderTop: "2px solid var(--ink)", paddingTop: 12 }}>
                  {[
                    { l: t("public.counters.challenges"), v: profile.completedChallenges ?? 0, click: null },
                    { l: t("public.counters.followers"),  v: profile.followers ?? 0,           click: () => dispatch({ type: "VIEW_FOLLOW_LIST", userId, listType: "followers" }) },
                    { l: t("public.counters.following"),  v: profile.following ?? 0,           click: () => dispatch({ type: "VIEW_FOLLOW_LIST", userId, listType: "following" }) },
                    { l: t("public.counters.likes"),      v: profile.totalLikes ?? 0,          click: null },
                    { l: t("public.counters.inspires"),   v: profile.totalInspires ?? 0,       click: null },
                  ].map((s, i) => (
                    <div
                      key={i}
                      onClick={s.click ?? undefined}
                      style={{ textAlign: "center", borderRight: i < 4 ? "1.5px solid rgba(20,17,15,.15)" : "none", cursor: s.click ? "pointer" : "default", padding: "0 2px" }}
                    >
                      <p className="serif" style={{ fontSize: 20, lineHeight: 1, textDecoration: s.click ? "underline" : "none" }}>{s.v}</p>
                      <p className="mono" style={{ fontSize: 8, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 2 }}>{s.l.toUpperCase()}</p>
                    </div>
                  ))}
                </div>

                {/* Follow / Edit button */}
                {!isOwnProfile && IS_LOGGED_IN && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="stk"
                    style={{
                      width: "100%", height: 46, marginTop: 14,
                      background: following ? "var(--mint)" : "var(--ink)",
                      color: following ? "var(--ink)" : "var(--acid)",
                      border: "2px solid var(--ink)", borderRadius: 14,
                      fontWeight: 800, fontSize: 13,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      cursor: followLoading ? "default" : "pointer",
                      opacity: followLoading ? 0.6 : 1,
                    }}
                  >
                    {following ? <><ICheck s={15}/> {t("public.following")}</> : t("public.follow")}
                  </button>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => dispatch({ type: "SET_SCREEN", screen: "profile", profileTab: "Editar" })}
                    className="stk"
                    style={{ width: "100%", height: 46, marginTop: 14, background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 14, fontWeight: 800, fontSize: 13, cursor: "pointer" }}
                  >
                    {t("public.editProfile")}
                  </button>
                )}
              </div>
            </div>

            {/* ── Artworks grid ── */}
            <div style={{ marginTop: 2 }}>
              <div style={{ padding: "10px 14px 6px" }}>
                <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)" }}>
                  {t("public.works", { n: artworks.length })}
                </p>
              </div>

              {artworks.length === 0 ? (
                <div style={{ padding: "0 14px" }}>
                  <div className="stk-sm" style={{ background: "var(--paper-2)", padding: 20, borderRadius: 16, textAlign: "center" }}>
                    <p className="serif" style={{ fontSize: 20, lineHeight: 1 }}>{t("public.empty")}</p>
                    <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 6 }}>
                      {t("public.empty.sub")}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                  {artworks.map((aw, i) => {
                    const img = aw.images?.[0] ?? aw.image ?? null;
                    return (
                      <div
                        key={aw.id ?? i}
                        onClick={() => setActiveArt(aw)}
                        style={{ aspectRatio: "3/4", overflow: "hidden", background: COL_CYCLE[i % COL_CYCLE.length], cursor: "pointer", position: "relative" }}
                      >
                        {img
                          ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 6 }}>
                              <p className="serif" style={{ fontSize: 9, textAlign: "center", lineHeight: 1.2 }}>{aw.prompt}</p>
                            </div>
                        }
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Phone>
  );
}
