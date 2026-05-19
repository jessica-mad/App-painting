import { useState, useEffect, useMemo } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { generateAIKeywords } from "../utils/api";
import { IMusic, IPause, IPlay, IReload, ICheck, ISpark, IStar, IDiamond, ICircle, IArrowR } from "../components/Icons";

function CircularProgress({ progress, size = 240, strokeWidth = 14 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  const cx = size / 2;
  const cy = size / 2;
  const tickX = cx + r * Math.cos((progress * 2 * Math.PI) - Math.PI / 2);
  const tickY = cy + r * Math.sin((progress * 2 * Math.PI) - Math.PI / 2);

  return (
    <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
      <circle cx={cx} cy={cy} r={r + 16} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1" strokeDasharray="2 6"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={strokeWidth}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--acid)" strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {progress > 0 && (
        <circle cx={tickX} cy={tickY} r="9" fill="var(--coral)" stroke="var(--ink)" strokeWidth="2"/>
      )}
    </svg>
  );
}

const DECO = [
  { top: "10%", left: "8%",  Icon: ISpark,   s: 16 },
  { top: "18%", left: "85%", Icon: IStar,    s: 14 },
  { top: "30%", left: "12%", Icon: IDiamond, s: 12 },
  { top: "78%", left: "88%", Icon: ICircle,  s: 10 },
];

function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function KeywordRain({ keywords }) {
  const TOTAL = 32;

  const elements = useMemo(() => {
    if (!keywords.length) return [];
    return Array.from({ length: TOTAL }, (_, i) => ({
      word:     keywords[i % keywords.length],
      left:     seededRand(i * 3)   * 88,
      duration: 9 + seededRand(i * 7)  * 13,
      delay:    seededRand(i * 11)  * -22,
      fontSize: 12 + seededRand(i * 5) * 13,
      opacity:  0.14 + seededRand(i * 13) * 0.20,
      rotate:   (seededRand(i * 17) * 18) - 9,
      key:      `kw-${i}-${keywords[i % keywords.length]}`,
    }));
  }, [keywords]);

  if (!elements.length) return null;

  return (
    <div
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}
      aria-hidden="true"
    >
      {elements.map(el => (
        <span
          key={el.key}
          style={{
            position: "absolute",
            top: 0,
            left: `${el.left}%`,
            fontSize: el.fontSize,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            color: "#fff",
            opacity: el.opacity,
            letterSpacing: "0.06em",
            textTransform: "lowercase",
            whiteSpace: "nowrap",
            userSelect: "none",
            "--kw-rotate": `${el.rotate}deg`,
            animation: `fall ${el.duration}s linear ${el.delay}s infinite`,
          }}
        >
          {el.word}
        </span>
      ))}
    </div>
  );
}

export function TimerScreen() {
  const { state, dispatch } = useApp();
  const { timerConfig, currentIdea } = state;

  /* ── All hooks before any conditional return ── */
  const isFree       = timerConfig?.duration?.seconds == null;
  const totalSeconds = timerConfig?.duration?.seconds || 1;

  const [seconds,  setSeconds]  = useState(isFree ? 0 : (timerConfig?.duration?.seconds ?? 0));
  const [running,  setRunning]  = useState(false);
  const [finished, setFinished] = useState(false);
  const [musicOn,  setMusicOn]  = useState(timerConfig?.musicOn ?? true);
  const [keywords, setKeywords] = useState([]);

  /* Countdown / count-up */
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds(s => {
        if (!isFree && s <= 1) {
          clearInterval(id);
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return isFree ? s + 1 : s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, isFree]);

  /* AI keyword rain — set variables as immediate fallback, then upgrade with AI */
  useEffect(() => {
    const GENERIC = ["pintura", "color", "trazo", "forma", "luz", "sombra", "textura", "boceto", "paleta", "composición", "detalle", "atmósfera"];
    const vars = currentIdea?.variables?.map(v => v.value) ?? [];
    const fallback = vars.length ? vars : GENERIC;

    setKeywords(fallback);

    if (!vars.length) return;
    generateAIKeywords(vars)
      .then(data => { if (data?.keywords?.length >= 3) setKeywords(data.keywords); })
      .catch(() => {});
  }, [currentIdea]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Guard after all hooks */
  if (!timerConfig) {
    dispatch({ type: "SET_SCREEN", screen: "setupTimer" });
    return null;
  }

  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  const progress = isFree ? 0 : 1 - seconds / totalSeconds;
  const pct = Math.round(progress * 100);

  const reset  = () => { setSeconds(isFree ? 0 : timerConfig.duration.seconds); setRunning(false); setFinished(false); };
  const finish = () => dispatch({ type: "COMPLETE_CHALLENGE" });

  if (finished) {
    return (
      <Phone dark>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 22px" }}>
          <div className="stk-lg" style={{ background: "var(--acid)", padding: "32px 24px", textAlign: "center", position: "relative", overflow: "hidden", width: "100%" }}>
            <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.2 }}/>
            <div style={{ position: "relative" }}>
              <div className="serif" style={{ fontSize: 72, lineHeight: 1 }}>🎉</div>
              <h2 className="serif" style={{ fontSize: 36, lineHeight: 1, marginTop: 12 }}>Tiempo.</h2>
              <p style={{ fontSize: 13, fontWeight: 600, marginTop: 12, lineHeight: 1.4 }}>¿Qué has hecho? Muéstranos.</p>
              <div className="perforated" style={{ margin: "20px 0 16px" }}/>
              <button onClick={finish} className="stk" style={{ width: "100%", height: 52, background: "var(--ink)", color: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
                Subir mi dibujo <IArrowR s={18} stroke="var(--acid)"/>
              </button>
            </div>
          </div>
        </div>
      </Phone>
    );
  }

  return (
    <Phone dark>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>

        {/* Keyword rain — z-index 0 */}
        <KeywordRain keywords={keywords}/>

        {/* Timer UI — z-index 1 */}
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Deco */}
          {DECO.map((d, i) => (
            <span key={i} style={{ position: "absolute", top: d.top, left: d.left, color: "rgba(255,255,255,.18)", pointerEvents: "none" }}>
              <d.Icon s={d.s}/>
            </span>
          ))}

          {/* Music card */}
          <div style={{ margin: "10px 22px", border: "2px solid rgba(255,255,255,.22)", borderRadius: 16, background: "rgba(255,255,255,.06)", padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(223,255,35,.15)", border: "1.5px solid var(--acid)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IMusic s={20} stroke="var(--acid)"/>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>{timerConfig.music.title}</p>
              <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{musicOn ? "REPRODUCIENDO · ∞ LOOP" : "EN PAUSA"}</p>
            </div>
            {musicOn && (
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 16 }}>
                {[8, 12, 5, 14, 9].map((h, j) => (
                  <span key={j} style={{ width: 2, height: h, background: "var(--acid)", borderRadius: 2 }}/>
                ))}
              </div>
            )}
            <button onClick={() => setMusicOn(m => !m)} style={{ width: 30, height: 30, borderRadius: 999, border: "1.5px solid rgba(255,255,255,.4)", background: "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {musicOn ? <IPause s={14} stroke="#fff"/> : <IPlay s={14} stroke="#fff"/>}
            </button>
          </div>

          {/* Timer ring */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
            <div style={{ position: "relative", width: 240, height: 240 }}>
              <CircularProgress progress={progress} size={240}/>
              <div style={{ position: "absolute", inset: 30, borderRadius: 999, background: "rgba(255,255,255,.04)", border: "2px solid rgba(255,255,255,.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.5)" }}>
                  {running ? (isFree ? "MODO LIBRE" : "MODO MUSAI ACTIVO") : "LISTO PARA INICIAR"}
                </p>
                <p className="serif" style={{ fontSize: 64, lineHeight: 1, color: "#fff", marginTop: 4, letterSpacing: "-0.02em" }}>{min}:{sec}</p>
                {!isFree && (
                  <span style={{ marginTop: 8, padding: "3px 10px", border: "1.5px solid var(--acid)", borderRadius: 999, color: "var(--acid)", fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700 }}>
                    {pct}% completado
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <button onClick={reset} style={{ width: 56, height: 56, borderRadius: 999, border: "2px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.08)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <IReload s={22} stroke="#fff"/>
              </button>
              <button
                onClick={() => setRunning(r => !r)}
                className="stk"
                style={{ width: 84, height: 84, borderRadius: 999, background: "var(--acid)", border: "3px solid var(--acid)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 4px var(--ink), 6px 6px 0 var(--ink)", cursor: "pointer" }}
              >
                {running ? <IPause s={32} stroke="var(--ink)"/> : <IPlay s={32} stroke="var(--ink)"/>}
              </button>
              <button onClick={finish} style={{ width: 56, height: 56, borderRadius: 999, border: "2px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.08)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <ICheck s={22} stroke="#fff"/>
              </button>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ padding: "0 22px 28px" }}>
            <div style={{ border: "1.5px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", padding: 12, borderRadius: 14, marginBottom: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <ISpark s={18} stroke="rgba(255,255,255,.7)"/>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>
                SESIÓN DE {timerConfig.duration.label.toUpperCase()} · MODO MUSAI
              </p>
            </div>
            <button
              onClick={finish}
              style={{ width: "100%", height: 48, borderRadius: 16, border: "1.5px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.08)", color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
            >
              Finalizar y subir <IArrowR s={16} stroke="#fff"/>
            </button>
          </div>

        </div>
      </div>
    </Phone>
  );
}
