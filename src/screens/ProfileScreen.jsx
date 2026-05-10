import { useState } from "react";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { ArtTile } from "../components/ArtTile";
import { useApp } from "../data/store";
import { getUserLevel, LEVELS, TECHNIQUES } from "../data/parameters";
import { IUser, IBrush, IFlame, ILink, ICopy, IHeart, IInspire, ITimer, IDice, IStar, ICheck, ILock } from "../components/Icons";

const TABS = ["Perfil", "Logros", "Estadísticas"];

export function ProfileScreen() {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const level = getUserLevel(profile.completedChallenges);
  const [tab, setTab] = useState("Perfil");

  const favTechs = TECHNIQUES.filter(t => state.favoriteTechniques.includes(t.id));

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Hero */}
        <div style={{ background: "var(--lilac)", borderBottom: "2px solid var(--ink)", padding: "12px 22px 14px", position: "relative", overflow: "hidden" }} className="grain-soft">
          <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.1 }}/>
          <div style={{ display: "flex", gap: 14, position: "relative" }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 76, height: 76, borderRadius: 999, border: "3px solid var(--ink)", background: "var(--rose)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "4px 4px 0 var(--ink)" }}>
                <IUser s={40}/>
              </div>
              <div style={{ position: "absolute", bottom: -4, right: -4, width: 28, height: 28, borderRadius: 999, background: "var(--acid)", border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IBrush s={14}/>
              </div>
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
              {profile.shareLink}
            </span>
            <button style={{ background: "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <ICopy s={11}/> Copiar
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 14 }}>
            {[
              { l: "Retos",      v: profile.completedChallenges },
              { l: "Seguidores", v: profile.followers > 999 ? `${(profile.followers / 1000).toFixed(1)}K` : profile.followers },
              { l: "Siguiendo",  v: profile.following },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <p className="serif" style={{ fontSize: 22, lineHeight: 1 }}>{s.v}</p>
                <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)", marginTop: 2 }}>{s.l.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--ink)", flexShrink: 0 }}>
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "10px 0", border: "none",
                borderRight: i < TABS.length - 1 ? "2px solid var(--ink)" : "none",
                background: tab === t ? "var(--acid)" : "var(--paper-2)",
                fontWeight: 800, fontSize: 11, fontFamily: "JetBrains Mono",
                textTransform: "uppercase", letterSpacing: "0.04em", cursor: "pointer",
              }}
            >{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div className="scroll" style={{ flex: 1, padding: "12px 22px 90px" }}>
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
              <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>Mis obras</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[0, 1, 2, 3].map(k => <ArtTile key={k} kind={k + 2} height={130}/>)}
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
                      {unlocked ? (
                        <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>
                          {current ? "Actual" : <ICheck s={12} stroke="var(--acid)"/>}
                        </span>
                      ) : (
                        <ILock s={16} stroke="rgba(20,17,15,.4)"/>
                      )}
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
                <div style={{ marginTop: 10, height: 8, borderRadius: 999, border: "1.5px solid var(--ink)", background: "rgba(255,255,255,.5)", overflow: "hidden" }}>
                  <div style={{ width: "65%", height: "100%", background: "var(--ink)" }}/>
                </div>
              </div>
            </div>
          )}
        </div>

        <BottomNav current="profile"/>
      </div>
    </Phone>
  );
}
