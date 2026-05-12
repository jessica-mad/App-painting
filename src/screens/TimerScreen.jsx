import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { MUSIC_TRACKS, generatePrompt, getOverallRarity } from "../data/parameters";
import { generateAIKeywords } from "../utils/api";
import { RarityBadge } from "../components/RarityBadge";
import { IMusic, IPause, IPlay, ICheck, ISpark, IArrowR, IChevronD } from "../components/Icons";

const VAR_BG = ["var(--acid)", "var(--lilac)", "var(--rose)", "var(--mint)", "var(--butter)"];

function HighlightedPrompt({ variables }) {
  if (!variables?.length) return null;
  const text = generatePrompt(variables);
  const parts = [];
  let remaining = text;
  variables.forEach((v, i) => {
    const idx = remaining.indexOf(v.value);
    if (idx === -1) return;
    if (idx > 0) parts.push({ text: remaining.slice(0, idx), hi: false });
    parts.push({ text: v.value, hi: true, bg: VAR_BG[i % VAR_BG.length] });
    remaining = remaining.slice(idx + v.value.length);
  });
  if (remaining) parts.push({ text: remaining, hi: false });

  return (
    <p className="serif" style={{ fontSize: 19, lineHeight: 1.15, color: "#fff", marginTop: 10 }}>
      {parts.map((p, i) =>
        p.hi
          ? <em key={i} style={{ background: p.bg, color: "var(--ink)", padding: "0 4px", fontStyle: "normal", borderRadius: 3 }}>{p.text}</em>
          : <span key={i}>{p.text}</span>
      )}
    </p>
  );
}

/* Donut pie — starts FULL (remaining=total), shrinks as time passes */
function PieTimer({ frac, size = 220 }) {
  const cx = size / 2, cy = size / 2;
  const R   = size / 2 - 4;
  const rIn = Math.round(R * 0.48);

  if (frac >= 1) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={R} fill="var(--acid)"/>
        <circle cx={cx} cy={cy} r={rIn} fill="#14110F"/>
      </svg>
    );
  }
  if (frac <= 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={R} fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.12)" strokeWidth={1.5}/>
        <circle cx={cx} cy={cy} r={rIn} fill="#14110F"/>
      </svg>
    );
  }
  const ang  = frac * 2 * Math.PI;
  const px   = cx + R * Math.sin(ang);
  const py   = cy - R * Math.cos(ang);
  const large = ang > Math.PI ? 1 : 0;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={R} fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.08)" strokeWidth={1.5}/>
      <path d={`M${cx} ${cy} L${cx} ${cy - R} A${R} ${R} 0 ${large} 1 ${px} ${py} Z`} fill="var(--acid)"/>
      <circle cx={cx} cy={cy} r={rIn} fill="#14110F"/>
    </svg>
  );
}

function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function KeywordRain({ keywords }) {
  const SLOTS    = 5;
  const POOL_MAX = 30;

  const pool = useMemo(() => {
    if (!keywords.length) return [];
    return Array.from({ length: POOL_MAX }, (_, i) => keywords[i % keywords.length]);
  }, [keywords]);

  const slotCfg = useMemo(() =>
    Array.from({ length: SLOTS }, (_, i) => ({
      left:     (i / SLOTS) * 80 + seededRand(i * 3) * 10 + 2,
      duration: 15 + seededRand(i * 7) * 14,
      delay:    -(seededRand(i * 11) * 22),
      fontSize: 11 + seededRand(i * 5) * 11,
      opacity:  0.22 + seededRand(i * 13) * 0.10,
      blur:     0.6  + seededRand(i * 19) * 1.4,
      rotate:   (seededRand(i * 17) * 16) - 8,
    }))
  , []);

  const [words, setWords] = useState(() =>
    Array.from({ length: SLOTS }, (_, i) => pool[i] ?? "")
  );
  const nextRef = useRef(SLOTS);

  const advance = useCallback((slotIdx) => {
    if (!pool.length) return;
    const idx = nextRef.current % pool.length;
    nextRef.current++;
    setWords(prev => { const next = [...prev]; next[slotIdx] = pool[idx]; return next; });
  }, [pool]);

  if (!pool.length) return null;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }} aria-hidden="true">
      {slotCfg.map((cfg, i) => (
        <span
          key={i}
          onAnimationIteration={() => advance(i)}
          style={{
            position: "absolute", top: 0, left: `${cfg.left}%`,
            fontSize: cfg.fontSize, fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700, color: "#fff", opacity: cfg.opacity,
            filter: `blur(${cfg.blur}px)`, letterSpacing: "0.06em",
            textTransform: "lowercase", whiteSpace: "nowrap", userSelect: "none",
            "--kw-rotate": `${cfg.rotate}deg`,
            animation: `fall ${cfg.duration}s linear ${cfg.delay}s infinite`,
          }}
        >
          {words[i]}
        </span>
      ))}
    </div>
  );
}

export function TimerScreen() {
  const { state, dispatch } = useApp();
  const { timerConfig, currentIdea, musicSrcs } = state;

  const isFree       = timerConfig?.duration?.seconds == null;
  const totalSeconds = timerConfig?.duration?.seconds || 1;

  const [seconds,   setSeconds]   = useState(isFree ? 0 : (timerConfig?.duration?.seconds ?? 0));
  const [running,   setRunning]   = useState(false);
  const [finished,  setFinished]  = useState(false);
  const [musicOn,   setMusicOn]   = useState(timerConfig?.musicOn ?? true);
  const [rainOn,    setRainOn]    = useState(true);
  const [musicOpen, setMusicOpen] = useState(false);
  const [keywords,  setKeywords]  = useState([]);
  const audioRef = useRef(null);

  const availableTracks = useMemo(
    () => MUSIC_TRACKS.filter(t => musicSrcs?.[t.id]),
    [musicSrcs]
  );
  const [currentTrack, setCurrentTrack] = useState(() =>
    timerConfig?.music ?? availableTracks[0] ?? null
  );

  /* Countdown / count-up */
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds(s => {
        if (!isFree && s <= 1) { clearInterval(id); setRunning(false); setFinished(true); return 0; }
        return isFree ? s + 1 : s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, isFree]);

  /* Audio: play/pause */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (running && musicOn) { audio.play().catch(() => {}); }
    else { audio.pause(); }
  }, [running, musicOn]);

  const advanceTrack = useCallback(() => {
    if (!availableTracks.length) return;
    if (availableTracks.length === 1) {
      if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
      return;
    }
    const idx = availableTracks.findIndex(t => t.id === currentTrack?.id);
    setCurrentTrack(availableTracks[(idx + 1) % availableTracks.length]);
  }, [availableTracks, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    const src = musicSrcs[currentTrack.id];
    if (!src) return;
    audio.src = src;
    if (running && musicOn) { audio.play().catch(() => {}); }
  }, [currentTrack]); // eslint-disable-line

  /* AI keyword rain */
  useEffect(() => {
    const GENERIC = ["pintura","color","trazo","forma","luz","sombra","textura","boceto","paleta","composición","detalle","atmósfera"];
    const vars = currentIdea?.variables?.map(v => v.value) ?? [];
    const fallback = vars.length ? vars : GENERIC;
    setKeywords(fallback);
    if (!vars.length) return;
    generateAIKeywords(vars)
      .then(data => { if (data?.keywords?.length >= 3) setKeywords(data.keywords); })
      .catch(() => {});
  }, [currentIdea]); // eslint-disable-line

  if (!timerConfig) {
    dispatch({ type: "SET_SCREEN", screen: "setupTimer" });
    return null;
  }

  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  /* Remaining fraction: 1 = full circle (start), 0 = empty (done) */
  const frac    = isFree ? 1 : seconds / totalSeconds;
  const finish  = () => dispatch({ type: "COMPLETE_CHALLENGE" });

  const ideaVars  = currentIdea?.variables ?? [];
  const rarity    = ideaVars.length ? getOverallRarity(ideaVars) : null;
  const trackSrc  = currentTrack ? musicSrcs[currentTrack.id] : null;

  if (finished) {
    return (
      <Phone dark>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 22px" }}>
          <div className="stk-lg" style={{ background: "var(--acid)", padding: "32px 24px", textAlign: "center", position: "relative", overflow: "hidden", width: "100%" }}>
            <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.2 }}/>
            <div style={{ position: "relative" }}>
              <div className="serif" style={{ fontSize: 72, lineHeight: 1 }}>🎉</div>
              <h2 className="serif" style={{ fontSize: 36, lineHeight: 1, marginTop: 12 }}>¡Reto completado!</h2>
              <p style={{ fontSize: 13, fontWeight: 600, marginTop: 12, lineHeight: 1.4 }}>Increíble trabajo artista.<br/>Sube tu resultado a la comunidad.</p>
              <div className="perforated" style={{ margin: "20px 0 16px" }}/>
              <button onClick={finish} className="stk" style={{ width: "100%", height: 52, background: "var(--ink)", color: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
                Ya terminé, subir mi obra <IArrowR s={18} stroke="var(--acid)"/>
              </button>
            </div>
          </div>
        </div>
      </Phone>
    );
  }

  return (
    <Phone dark>
      {trackSrc && (
        <audio ref={audioRef} src={trackSrc} onEnded={advanceTrack} preload="none" style={{ display: "none" }}/>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {rainOn && <KeywordRain keywords={keywords}/>}

        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", padding: "10px 16px 0" }}>

          {/* Reto card */}
          {ideaVars.length > 0 && (
            <div style={{ border: "1.5px solid rgba(255,255,255,.2)", borderRadius: 16, padding: "14px 14px 12px", background: "rgba(255,255,255,.04)", position: "relative", marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.5)", letterSpacing: ".08em" }}>// TU RETO</p>
                {rarity && <RarityBadge rarity={rarity}/>}
              </div>

              <HighlightedPrompt variables={ideaVars}/>

              {/* Word pills */}
              <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
                {ideaVars.map((v, i) => (
                  <span key={i} style={{
                    fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700,
                    padding: "2px 7px", borderRadius: 999,
                    border: "1px solid rgba(255,255,255,.35)",
                    color: "rgba(255,255,255,.85)",
                  }}>{v.value}</span>
                ))}
              </div>

              {/* Perforated separator */}
              <div style={{ height: 2, margin: "12px -14px 10px", backgroundImage: "linear-gradient(to right, rgba(255,255,255,.3) 50%, transparent 50%)", backgroundSize: "8px 2px", backgroundRepeat: "repeat-x" }}/>

              {/* Rain toggle — pill switch style */}
              <button
                onClick={() => setRainOn(r => !r)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", color: "#fff", textAlign: "left", padding: 0, cursor: "pointer" }}
              >
                <ISpark s={16} stroke={rainOn ? "var(--acid)" : "rgba(255,255,255,.55)"}/>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 12 }}>Lluvia de ideas</span>
                <span style={{
                  width: 40, height: 22, borderRadius: 999, flexShrink: 0,
                  border: `1.5px solid ${rainOn ? "var(--acid)" : "rgba(255,255,255,.3)"}`,
                  background: rainOn ? "var(--acid)" : "transparent",
                  position: "relative", display: "inline-block",
                }}>
                  <span style={{
                    position: "absolute", top: 2, left: rainOn ? 19 : 2,
                    width: 15, height: 15, borderRadius: 999,
                    background: rainOn ? "var(--ink)" : "rgba(255,255,255,.85)",
                    transition: "left .2s",
                  }}/>
                </span>
              </button>
            </div>
          )}

          {/* Pie chart timer */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <div style={{ position: "relative", width: 220, height: 220 }}>
              <PieTimer frac={frac} size={220}/>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <p className="serif" style={{ fontSize: 46, lineHeight: 1, color: "#fff", letterSpacing: "-0.02em" }}>{min}:{sec}</p>
                <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.45)", marginTop: 2 }}>
                  {running ? "RESTANTES" : isFree ? "LIBRE" : "PAUSADO"}
                </p>
              </div>
            </div>

            {/* Pause only */}
            <button
              onClick={() => setRunning(r => !r)}
              className="stk"
              style={{ width: 78, height: 78, borderRadius: 999, background: "var(--acid)", border: "3px solid var(--acid)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 3px var(--ink), 5px 5px 0 var(--ink)", cursor: "pointer" }}
            >
              {running ? <IPause s={30} stroke="var(--ink)"/> : <IPlay s={30} stroke="var(--ink)"/>}
            </button>
          </div>

          {/* Bottom: music dropdown + finish */}
          <div style={{ padding: "0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Music collapsible */}
            {currentTrack && (
              <div style={{ border: "1.5px solid rgba(255,255,255,.18)", borderRadius: 16, background: "rgba(255,255,255,.05)", overflow: "hidden" }}>
                <button
                  onClick={() => setMusicOpen(o => !o)}
                  style={{ width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#fff", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(223,255,35,.12)", border: "1.5px solid var(--acid)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IMusic s={16} stroke="var(--acid)"/>
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <p style={{ fontWeight: 800, fontSize: 12, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</p>
                    <p className="mono" style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,.45)", marginTop: 1 }}>{musicOn ? "REPRODUCIENDO" : "EN PAUSA"}</p>
                  </div>
                  {musicOn && (
                    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 14 }}>
                      {[6, 10, 4, 12, 7].map((h, j) => (
                        <span key={j} style={{ width: 2, height: h, background: "var(--acid)", borderRadius: 2 }}/>
                      ))}
                    </div>
                  )}
                  <IChevronD s={16} stroke="rgba(255,255,255,.5)" style={{ transform: musicOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}/>
                </button>

                {musicOpen && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      onClick={() => setMusicOn(m => !m)}
                      style={{ height: 36, borderRadius: 10, border: "1.5px solid rgba(255,255,255,.25)", background: "transparent", color: "#fff", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                    >
                      {musicOn ? <IPause s={14} stroke="#fff"/> : <IPlay s={14} stroke="#fff"/>}
                      {musicOn ? "Pausar música" : "Reanudar música"}
                    </button>
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                      {availableTracks.map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setCurrentTrack(t); setMusicOn(true); setMusicOpen(false); }}
                          style={{
                            flexShrink: 0, padding: "5px 10px", borderRadius: 999,
                            border: `1.5px solid ${t.id === currentTrack.id ? "var(--acid)" : "rgba(255,255,255,.2)"}`,
                            background: t.id === currentTrack.id ? "rgba(223,255,35,.15)" : "transparent",
                            color: t.id === currentTrack.id ? "var(--acid)" : "rgba(255,255,255,.6)",
                            fontSize: 10, fontWeight: 800, fontFamily: "JetBrains Mono", cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {t.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={finish}
              style={{ width: "100%", height: 48, borderRadius: 16, border: "2px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.08)", color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
            >
              <ICheck s={16} stroke="#fff"/> Ya terminé, subir mi obra
            </button>
          </div>

        </div>
      </div>
    </Phone>
  );
}
