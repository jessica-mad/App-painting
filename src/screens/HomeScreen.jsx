import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { Wordmark } from "../components/Wordmark";
import { useApp } from "../data/store";
import { getUserLevel } from "../data/parameters";
import { IUser, IBrush, IDice, IHeart, IInspire, IFlame, ISpark, IArrowR } from "../components/Icons";

export function HomeScreen() {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const level = getUserLevel(profile.completedChallenges);
  const pct = Math.min(100, Math.round((profile.completedChallenges % 10) / 10 * 100));

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {/* deco */}
        <svg style={{ position: "absolute", top: 80, right: -20, opacity: 0.06, pointerEvents: "none" }} width="120" height="120" viewBox="0 0 24 24">
          <path d="M12 4l2.4 5.4 5.6.5-4.2 3.8 1.2 5.6L12 16l-5 3.3 1.2-5.6L4 9.9l5.6-.5z" fill="var(--ink)"/>
        </svg>

        {/* Header */}
        <div style={{ padding: "8px 22px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.45)" }}>
                // hola, {(profile.displayName || profile.username || "artista").split(" ")[0].toLowerCase()}
              </p>
              <Wordmark size={26}/>
            </div>
            <button
              onClick={() => dispatch({ type: "SET_SCREEN", screen: "profile", profileTab: "Editar" })}
              style={{ width: 46, height: 46, borderRadius: 999, border: "2px solid var(--ink)", background: "var(--rose)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 var(--ink)", position: "relative", cursor: "pointer" }}
            >
              <IUser s={22}/>
              {profile.streak > 0 && (
                <span style={{ position: "absolute", bottom: -4, right: -4, width: 18, height: 18, borderRadius: 999, background: "var(--acid)", border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>
                  {profile.streak}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="scroll" style={{ flex: 1, padding: "4px 22px 90px" }}>
          {/* Level ticket */}
          <div className="stk" style={{ background: "var(--mint)", padding: 14, marginBottom: 14, position: "relative", overflow: "hidden", borderRadius: 18 }}>
            <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.12 }}/>
            <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IBrush s={24}/>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: 14, lineHeight: 1 }}>{level.name}</p>
                <p className="mono" style={{ fontSize: 10, fontWeight: 600, marginTop: 4, color: "rgba(20,17,15,.6)" }}>
                  {profile.completedChallenges} retos · {profile.streak > 0 ? `${profile.streak} días seguidos` : "racha rota"}
                </p>
              </div>
              <span className="serif" style={{ fontSize: 30, lineHeight: 1, color: "var(--ink)" }}>0{level.id}</span>
            </div>
            <div style={{ marginTop: 12, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 9, fontWeight: 700 }}>NIVEL 0{level.id}</span>
                <span className="mono" style={{ fontSize: 9, fontWeight: 700 }}>NIVEL 0{Math.min(5, level.id + 1)}</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, border: "1.5px solid var(--ink)", background: "rgba(255,255,255,.6)", overflow: "hidden", position: "relative" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "var(--ink)" }}/>
                <div style={{ position: "absolute", left: `${Math.max(0, pct - 2)}%`, top: -4, width: 14, height: 14, borderRadius: 999, background: "var(--acid)", border: "2px solid var(--ink)" }}/>
              </div>
            </div>
          </div>

          {/* Big CTA ticket */}
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })}
            className="stk"
            style={{ width: "100%", background: "var(--acid)", padding: 0, marginBottom: 14, borderRadius: 22, overflow: "hidden", position: "relative", boxShadow: "var(--shadow-lg)", cursor: "pointer", textAlign: "left" }}
          >
            <div className="stripes-y" style={{ position: "absolute", inset: 0 }}/>
            <div style={{ position: "relative", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span className="tag" style={{ background: "var(--ink)", color: "var(--acid)", padding: "3px 8px", borderRadius: 4 }}>RETO DEL DÍA</span>
                  <h3 className="serif" style={{ fontSize: 36, lineHeight: 0.95, marginTop: 12, maxWidth: 220 }}>La hoja en blanco ya está esperando.</h3>
                  <p className="mono" style={{ fontSize: 11, fontWeight: 600, marginTop: 8 }}>{state.rollsLeft} intentos · se acaba a las 23:59</p>
                </div>
                <div style={{ width: 56, height: 56, borderRadius: 14, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IDice s={28} sw={2.4}/>
                </div>
              </div>
              <div className="perforated" style={{ margin: "16px 0 12px" }}/>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 10, fontWeight: 700 }}>RANDOMETRO 3000™</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13 }}>
                  Dale al Randómetro <IArrowR s={16}/>
                </span>
              </div>
            </div>
          </button>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
            {[
              { Ico: IHeart,   v: profile.totalLikes,    l: "Likes",       c: "var(--rose)" },
              { Ico: IInspire, v: profile.totalInspires, l: "Inspiras",    c: "var(--lilac)" },
              { Ico: IFlame,   v: profile.totalTries,    l: "Lo intentaré",c: "var(--butter)" },
            ].map((s, i) => (
              <div key={i} className="stk-sm" style={{ background: "var(--paper-2)", padding: 10, textAlign: "center" }}>
                <div style={{ width: 30, height: 30, margin: "0 auto", borderRadius: 8, background: s.c, border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <s.Ico s={16}/>
                </div>
                <div className="serif" style={{ fontSize: 22, lineHeight: 1, marginTop: 6 }}>{s.v}</div>
                <div className="mono" style={{ fontSize: 8, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 2 }}>{s.l.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Season banner */}
          <div className="stk" style={{ background: "var(--sky)", padding: 14, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -10, right: -10, opacity: 0.3 }}>
              <ISpark s={80} stroke="var(--ink-blue)"/>
            </div>
            <div style={{ position: "relative" }}>
              <div className="stamp" style={{ background: "var(--paper-2)" }}>TEMP · {state.activeSeason || "primavera"}</div>
              <p className="serif" style={{ fontSize: 18, marginTop: 8, lineHeight: 1.1 }}>Variables de {state.activeSeason || "primavera"} activas. Úsalas bien y puede salir algo legendario.</p>
            </div>
          </div>
        </div>

        <BottomNav current="home"/>
      </div>
    </Phone>
  );
}
