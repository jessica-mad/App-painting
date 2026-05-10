import { useState } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { DURATIONS, MUSIC_TRACKS } from "../data/parameters";
import { IArrowL, ITimer, IMusic, IPlay } from "../components/Icons";

export function TimerSetupScreen() {
  const { dispatch } = useApp();
  const [duration, setDuration] = useState(DURATIONS[2]);
  const [music, setMusic] = useState(MUSIC_TRACKS[0]);
  const [musicOn, setMusicOn] = useState(true);

  const start = () => {
    dispatch({ type: "SET_TIMER_CONFIG", config: { duration, music, musicOn } });
    dispatch({ type: "SET_SCREEN", screen: "timer" });
  };

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 22px 22px" }}>
        <button
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "idea" })}
          style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, alignSelf: "flex-start", padding: 0, cursor: "pointer" }}
        >
          <IArrowL s={16}/> Volver
        </button>
        <h2 className="serif" style={{ fontSize: 28, marginTop: 8, lineHeight: 1 }}>Prepara tu sesión</h2>
        <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>// ELIGE TIEMPO Y AMBIENTE MUSICAL</p>

        <div className="scroll" style={{ flex: 1, marginTop: 16 }}>
          {/* Duration */}
          <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <ITimer s={14}/> Duración
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            {DURATIONS.map((d) => (
              <button
                key={d.label}
                onClick={() => setDuration(d)}
                className={duration.label === d.label ? "stk" : "stk-sm"}
                style={{
                  height: 76, background: duration.label === d.label ? "var(--acid)" : "var(--paper-2)",
                  border: "2px solid var(--ink)", borderRadius: 14,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                  cursor: "pointer",
                }}
              >
                <ITimer s={22}/>
                <span style={{ fontFamily: "JetBrains Mono", fontWeight: 800, fontSize: 13 }}>{d.label}</span>
              </button>
            ))}
          </div>

          {/* Music */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <IMusic s={14}/> Música ambiente
              </p>
              <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.5)", marginTop: 2 }}>LOOP INFINITO PARA CONCENTRARSE</p>
            </div>
            <button
              onClick={() => setMusicOn(m => !m)}
              style={{ width: 50, height: 26, borderRadius: 999, border: "2px solid var(--ink)", background: musicOn ? "var(--acid)" : "var(--paper)", position: "relative", cursor: "pointer" }}
            >
              <div style={{ position: "absolute", top: 1, left: musicOn ? 25 : 2, width: 20, height: 20, borderRadius: 999, background: "#fff", border: "2px solid var(--ink)", transition: "left 0.2s" }}/>
            </button>
          </div>

          {musicOn && (
            <div className="stk" style={{ background: "var(--ink)", color: "#fff", padding: 12, display: "flex", alignItems: "center", gap: 10, marginBottom: 12, borderRadius: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(223,255,35,.18)", border: "1.5px solid var(--acid)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IMusic s={18} stroke="var(--acid)"/>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: 13 }}>{music.title}</p>
                <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,.5)" }}>{music.mood?.toUpperCase()}</p>
              </div>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 14 }}>
                {[6, 10, 4, 12, 8].map((h, j) => (
                  <span key={j} style={{ width: 2, height: h, background: "var(--acid)", borderRadius: 2 }}/>
                ))}
              </div>
            </div>
          )}

          <div className="scroll" style={{ display: "flex", gap: 10, paddingBottom: 4 }}>
            {MUSIC_TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => { setMusic(track); setMusicOn(true); }}
                style={{
                  minWidth: 140, padding: 12, borderRadius: 18,
                  border: "2px solid var(--ink)",
                  background: music.id === track.id ? "var(--acid)" : "var(--paper-2)",
                  boxShadow: music.id === track.id ? "var(--shadow)" : "3px 3px 0 var(--ink)",
                  outline: music.id === track.id ? "2px solid var(--ink)" : "none", outlineOffset: 2,
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  <IMusic s={20}/>
                </div>
                <p style={{ fontWeight: 800, fontSize: 12, lineHeight: 1.1 }}>{track.title}</p>
                <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>{track.mood?.toUpperCase()}</p>
                <span style={{ display: "inline-block", marginTop: 8, background: "var(--ink)", color: "var(--acid)", padding: "2px 8px", borderRadius: 999, fontSize: 9, fontWeight: 800, fontFamily: "JetBrains Mono" }}>∞ LOOP</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={start}
          className="stk"
          style={{ marginTop: 14, height: 54, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", cursor: "pointer" }}
        >
          <IPlay s={18}/> ¡Iniciar sesión creativa!
        </button>
      </div>
    </Phone>
  );
}
