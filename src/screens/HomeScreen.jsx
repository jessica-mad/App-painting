import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { useApp } from "../data/store";
import { getUserLevel } from "../data/parameters";
import { IUser, IDice, IHeart, IInspire, IFlame, ISpark, IArrowR, IBell } from "../components/Icons";

function BugButton({ onClick }) {
  const r = 37;
  const cx = 44, cy = 44;
  const circumference = 2 * Math.PI * r;
  const text = "REPORTAR ERRORES · Y BUGS · ";
  return (
    <button
      onClick={onClick}
      title="Reportar un bug"
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, width: 88, height: 88, position: "relative", flexShrink: 0 }}
    >
      <svg width="88" height="88" viewBox="0 0 88 88" className="spin-slow" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <path id="bugCircle" d={`M ${cx},${cy} m -${r},0 a ${r},${r} 0 1,1 ${r*2},0 a ${r},${r} 0 1,1 -${r*2},0`}/>
        </defs>
        <text style={{ fontSize: 7.5, fontWeight: 800, fill: "var(--ink)", letterSpacing: 1.2, fontFamily: "monospace" }}>
          <textPath href="#bugCircle" startOffset="0%">{text}</textPath>
        </text>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--paper-2)", border: "2.5px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "2px 2px 0 var(--ink)", fontSize: 22 }}>
          🐛
        </div>
      </div>
    </button>
  );
}

export function HomeScreen() {
  const { state, dispatch } = useApp();
  const { profile, unreadNotifs } = state;
  const level = getUserLevel(profile.completedChallenges);
  const pct = Math.min(100, Math.round((profile.completedChallenges % 10) / 10 * 100));

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

        {/* Header */}
        <div style={{ padding: "14px 22px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)" }}>
                // día {profile.streak} de racha · {level.name.toLowerCase()}
              </p>
              <h1 className="serif" style={{ fontSize: 30, lineHeight: 1, marginTop: 4 }}>
                Hola, {(profile.displayName || profile.username || "artista").split(" ")[0]} 🪶
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Bell */}
              <button
                onClick={() => dispatch({ type: "SET_SCREEN", screen: "notifications" })}
                style={{ width: 40, height: 40, borderRadius: 999, border: "2px solid var(--ink)", background: unreadNotifs > 0 ? "var(--butter)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: unreadNotifs > 0 ? "3px 3px 0 var(--ink)" : "none", position: "relative", cursor: "pointer" }}
              >
                <IBell s={18}/>
                {unreadNotifs > 0 && (
                  <span style={{ position: "absolute", top: -5, right: -5, minWidth: 17, height: 17, borderRadius: 999, background: "var(--coral, #e55)", color: "#fff", border: "1.5px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, padding: "0 3px" }}>
                    {unreadNotifs > 99 ? "99+" : unreadNotifs}
                  </span>
                )}
              </button>
              {/* Avatar */}
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
        </div>

        <div className="scroll" style={{ flex: 1, padding: "4px 22px 90px" }}>

          {/* Progress strip — informational, dashed border */}
          <div style={{ border: "2px dashed rgba(20,17,15,.25)", borderRadius: 14, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, fontSize: 13, lineHeight: 1 }}>{level.name}</p>
              <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.5)", marginTop: 3 }}>
                {profile.completedChallenges} retos · {profile.streak > 0 ? `${profile.streak} días seguidos` : "racha rota"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 80, height: 6, borderRadius: 999, background: "rgba(20,17,15,.1)", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "var(--ink)", borderRadius: 999 }}/>
              </div>
              <span className="serif" style={{ fontSize: 20, lineHeight: 1, color: "var(--ink)", opacity: 0.4 }}>0{level.id}</span>
            </div>
          </div>

          {/* Big CTA */}
          <div
            className="stk"
            style={{ background: "var(--acid)", marginBottom: 14, borderRadius: 22, overflow: "hidden", position: "relative", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="stripes-y" style={{ position: "absolute", inset: 0 }}/>
            <div style={{ position: "relative", padding: "20px 20px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <span className="tag" style={{ background: "var(--ink)", color: "var(--acid)", padding: "3px 8px", borderRadius: 4 }}>RETO DEL DÍA</span>
                  <h3 className="serif" style={{ fontSize: 32, lineHeight: 0.95, marginTop: 10, maxWidth: 210 }}>La hoja en blanco ya está esperando.</h3>
                  <p className="mono" style={{ fontSize: 10, fontWeight: 600, marginTop: 6 }}>{state.rollsLeft} intentos · recarga en 23h 41m</p>
                </div>
                <div style={{ width: 50, height: 50, borderRadius: 14, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IDice s={26} sw={2.4}/>
                </div>
              </div>
              <button
                onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })}
                style={{ width: "100%", height: 48, background: "var(--ink)", color: "var(--acid)", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
              >
                EMPEZAR <IArrowR s={16} stroke="var(--acid)"/>
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { Ico: IHeart,   v: profile.totalLikes,    l: "Likes",        c: "var(--rose)" },
              { Ico: IInspire, v: profile.totalInspires, l: "Inspiras",     c: "var(--lilac)" },
              { Ico: IFlame,   v: profile.totalTries,    l: "Lo intentaré", c: "var(--butter)" },
            ].map((s, i) => (
              <div key={i} className="stk-sm" style={{ background: "var(--paper-2)", padding: 10, textAlign: "center" }}>
                <div style={{ width: 28, height: 28, margin: "0 auto", borderRadius: 8, background: s.c, border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <s.Ico s={14}/>
                </div>
                <div className="serif" style={{ fontSize: 20, lineHeight: 1, marginTop: 6 }}>{s.v}</div>
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
              <p className="serif" style={{ fontSize: 16, marginTop: 8, lineHeight: 1.1 }}>Variables de {state.activeSeason || "primavera"} activas. Úsalas bien y puede salir algo legendario.</p>
            </div>
          </div>

          {/* Bug report button */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24, marginBottom: 8 }}>
            <BugButton onClick={() => dispatch({ type: "SET_SCREEN", screen: "bugReport" })}/>
          </div>
        </div>

        <BottomNav current="home"/>
      </div>
    </Phone>
  );
}
