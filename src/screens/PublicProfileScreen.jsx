import { useState, useEffect } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { fetchUserProfile, fetchUserArtworks, followUser, addReaction, IS_LOGGED_IN, WP_USER_ID } from "../utils/api";
import { getUserLevel } from "../data/parameters";
import { IUser, IFlame, IBrush, IHeart, IInspire, IArrowL, ICheck, IX } from "../components/Icons";

function ArtworkModal({ artwork, onClose }) {
  const [likes,    setLikes]    = useState(artwork.likes    ?? 0);
  const [inspires, setInspires] = useState(artwork.inspires ?? 0);
  const [tries,    setTries]    = useState(artwork.tries    ?? 0);
  const [reacted,  setReacted]  = useState({ like: false, inspire: false, try: false });

  const react = (type) => {
    if (artwork.id) addReaction(artwork.id, type).catch(() => {});
    const was = reacted[type];
    if (type === "like")    setLikes(n    => was ? n - 1 : n + 1);
    if (type === "inspire") setInspires(n => was ? n - 1 : n + 1);
    if (type === "try")     setTries(n    => was ? n - 1 : n + 1);
    setReacted(r => ({ ...r, [type]: !was }));
  };

  const img = artwork.images?.[0] ?? artwork.image ?? null;
  const tags = artwork.variables ?? artwork.tags ?? [];

  return (
    <div
      onClick={onClose}
      style={{ position: "absolute", inset: 0, background: "rgba(20,17,15,.75)", zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--paper-2)", borderTop: "3px solid var(--ink)", borderRadius: "22px 22px 0 0", maxHeight: "90%", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Handle + close */}
        <div style={{ padding: "12px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "rgba(20,17,15,.15)", margin: "0 auto" }}/>
        </div>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "var(--ink)", border: "none", borderRadius: 999, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <IX s={14} stroke="var(--acid)"/>
        </button>

        <div style={{ overflowY: "auto", padding: "12px 16px 24px" }}>
          {/* Image */}
          {img ? (
            <img src={img} alt="" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 16, border: "2px solid var(--ink)", display: "block" }}/>
          ) : (
            <div style={{ width: "100%", aspectRatio: "3/4", background: "var(--lilac)", borderRadius: 16, border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p className="serif" style={{ fontSize: 16, padding: 16, textAlign: "center" }}>{artwork.prompt}</p>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
              {tags.map((t, i) => (
                <span key={i} style={{ background: "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                  {typeof t === "string" ? t : t.value}
                </span>
              ))}
            </div>
          )}

          {/* Technique + prompt */}
          {artwork.technique && (
            <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 10 }}>// {artwork.technique.toUpperCase()}</p>
          )}
          {artwork.prompt && (
            <p className="serif" style={{ fontSize: 18, lineHeight: 1.15, marginTop: 6 }}>{artwork.prompt}</p>
          )}

          {/* Reactions */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {[
              { Ico: IHeart,   count: likes,    type: "like",    col: "var(--rose)",   active: reacted.like },
              { Ico: IInspire, count: inspires, type: "inspire", col: "var(--lilac)",  active: reacted.inspire },
              { Ico: IFlame,   count: tries,    type: "try",     col: "var(--butter)", active: reacted.try },
            ].map((b, j) => (
              <button
                key={j}
                onClick={() => react(b.type)}
                style={{
                  flex: 1, height: 44, borderRadius: 12, border: "2px solid var(--ink)",
                  background: b.active ? b.col : "var(--paper-2)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontWeight: 800, fontSize: 13,
                  boxShadow: b.active ? "3px 3px 0 var(--ink)" : "none",
                  cursor: "pointer",
                }}
              >
                <b.Ico s={16}/> {b.count}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const COL_CYCLE = ["var(--rose)", "var(--lilac)", "var(--sky)", "var(--mint)", "var(--butter)", "var(--acid)"];

export function PublicProfileScreen() {
  const { state, dispatch } = useApp();
  const userId = state.viewingUserId;

  const [profile,      setProfile]      = useState(null);
  const [artworks,     setArtworks]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [following,    setFollowing]    = useState(false);
  const [followLoading,setFollowLoading]= useState(false);
  const [activeArt,    setActiveArt]    = useState(null);

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
      setFollowing(res?.following ?? !following);
      if (profile) {
        setProfile(p => ({
          ...p,
          followers: (p.followers ?? 0) + (following ? -1 : 1),
        }));
      }
    } catch { /* ignore */ }
    finally { setFollowLoading(false); }
  };

  const goBack = () => dispatch({ type: "CLEAR_VIEW_USER" });

  const level = profile ? getUserLevel(profile.completedChallenges ?? 0) : null;
  const avatarSrc = profile?.avatarUrl || null;
  const col = COL_CYCLE[(userId ?? 0) % COL_CYCLE.length];

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "10px 18px 8px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={goBack}
            style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, cursor: "pointer", padding: 0 }}
          >
            <IArrowL s={16}/> Volver
          </button>
        </div>

        {loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="mono" style={{ fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>// CARGANDO PERFIL...</p>
          </div>
        )}

        {!loading && !profile && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <p className="serif" style={{ fontSize: 28, lineHeight: 1 }}>Perfil no encontrado</p>
            <button onClick={goBack} className="stk-sm" style={{ marginTop: 16, height: 40, padding: "0 16px", borderRadius: 12, border: "2px solid var(--ink)", background: "var(--paper-2)", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              Volver al feed
            </button>
          </div>
        )}

        {!loading && profile && (
          <div className="scroll" style={{ flex: 1, padding: "0 0 20px", position: "relative" }}>
            {activeArt && <ArtworkModal artwork={activeArt} onClose={() => setActiveArt(null)}/>}
            {/* Profile hero */}
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
                  <div style={{ flex: 1 }}>
                    <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>
                      @{(profile.username ?? profile.display_name ?? "artista").toUpperCase()}
                    </p>
                    <h2 className="serif" style={{ fontSize: 24, lineHeight: 1, marginTop: 2 }}>
                      {profile.displayName ?? profile.display_name ?? "Artista"}
                    </h2>
                    {level && (
                      <span style={{ display: "inline-block", marginTop: 4, background: "var(--ink)", color: "var(--acid)", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>
                        {level.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginTop: 12, color: "rgba(20,17,15,.8)" }}>
                    {profile.bio}
                  </p>
                )}

                {/* Stats */}
                <div style={{ display: "flex", gap: 0, marginTop: 14, borderTop: "2px solid var(--ink)", paddingTop: 12 }}>
                  {[
                    { l: "Retos",      v: profile.completedChallenges ?? 0, click: null },
                    { l: "Seguidores", v: profile.followers ?? 0,           click: null },
                    { l: "Siguiendo",  v: profile.following ?? 0,           click: () => dispatch({ type: "VIEW_FOLLOW_LIST", userId }) },
                  ].map((s, i) => (
                    <div
                      key={i}
                      onClick={s.click ?? undefined}
                      style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1.5px solid rgba(20,17,15,.2)" : "none", cursor: s.click ? "pointer" : "default" }}
                    >
                      <p className="serif" style={{ fontSize: 24, lineHeight: 1, textDecoration: s.click ? "underline" : "none" }}>{s.v}</p>
                      <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)", marginTop: 2 }}>{s.l.toUpperCase()}</p>
                    </div>
                  ))}
                </div>

                {/* Follow button — only show if logged in and not own profile */}
                {IS_LOGGED_IN && parseInt(userId) !== WP_USER_ID && (
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
                    {following ? <><ICheck s={15}/> Siguiendo</> : `+ Seguir`}
                  </button>
                )}
              </div>
            </div>

            {/* Artworks grid */}
            <div style={{ padding: "16px 14px 0" }}>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)", marginBottom: 10 }}>
                // OBRAS · {artworks.length}
              </p>

              {artworks.length === 0 ? (
                <div className="stk-sm" style={{ background: "var(--paper-2)", padding: 20, borderRadius: 16, textAlign: "center" }}>
                  <p className="serif" style={{ fontSize: 20, lineHeight: 1 }}>Sin obras publicadas</p>
                  <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 6 }}>
                    // AÚN NO HA SUBIDO NADA
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {artworks.map((aw, i) => {
                    const img = aw.images?.[0] ?? aw.image ?? null;
                    return (
                      <div
                        key={aw.id ?? i}
                        onClick={() => setActiveArt(aw)}
                        className="stk-sm"
                        style={{ borderRadius: 14, overflow: "hidden", background: "var(--paper-2)", cursor: "pointer" }}
                      >
                        {img
                          ? <img src={img} alt="" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}/>
                          : <div style={{ width: "100%", aspectRatio: "3/4", background: COL_CYCLE[i % COL_CYCLE.length], display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <p className="serif" style={{ fontSize: 12, padding: 10, textAlign: "center" }}>{aw.prompt}</p>
                            </div>
                        }
                        <div style={{ padding: "6px 8px" }}>
                          <p style={{ fontWeight: 800, fontSize: 10 }}>{aw.technique}</p>
                          <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}><IHeart s={9}/> {aw.likes ?? 0}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}><IInspire s={9}/> {aw.inspires ?? 0}</span>
                          </div>
                        </div>
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
