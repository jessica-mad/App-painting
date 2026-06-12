import { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { RarityBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { PARAM_CATEGORIES, PARAMETERS, RARITY as RARITY_ENUM, pickVariables, getVarLabel, getRarityName, getOverallRarity, generatePrompt } from "../data/parameters";
import { IDice, IHeart, IFlame, IDiamond, IBolt, IStar, IBrush, IX, ISpark, IBookmark, IUndo } from "../components/Icons";
import { WP_ROLLS, fetchParameters, useRoll, generateAIPrompt } from "../utils/api";
import { track } from "../utils/track";
import { useT } from "../i18n";

const CAT_ICONS = {
  Emociones:  IHeart,
  Animales:   IFlame,
  Lugares:    IDiamond,
  Objetos:    IBolt,
  Eventos:    IStar,
  Acciones:   ISpark,
  Personajes: IBrush,
};
const CAT_COLORS = {
  Emociones:  "var(--rose)",
  Animales:   "var(--butter)",
  Lugares:    "var(--sky)",
  Objetos:    "var(--mint)",
  Eventos:    "var(--lilac)",
  Acciones:   "var(--acid)",
  Personajes: "var(--paper-2)",
};

const RARITY_BG = {
  "Común":      "#E8E1D0",
  "Raro":       "var(--sky)",
  "Épico":      "var(--lilac)",
  "Legendario": "var(--acid)",
};
const RARITY_GLYPH = {
  "Común":      "●",
  "Raro":       "◆",
  "Épico":      "▲",
  "Legendario": "★",
};

/* ── Palanca arrastrable con idle bounce ───────────────────────────────── */
function IdleLever({ onPull, disabled, height = 200, ballSize = 34, hintLabel = "DRAG ↓" }) {
  const [y, setY]           = useState(0);
  const [dragging, setDragging] = useState(false);
  const [idle, setIdle]     = useState(true);
  const maxY                = height - ballSize - 4;
  const startRef            = useRef({ y: 0, posY: 0 });
  const triggeredRef        = useRef(false);

  useEffect(() => {
    if (dragging || disabled) { setIdle(false); return; }
    setIdle(true);
    const id = setInterval(() => {
      setIdle(false);
      setTimeout(() => setIdle(true), 50);
    }, 5000);
    return () => clearInterval(id);
  }, [dragging, disabled]);

  const onPointerDown = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    setDragging(true);
    setIdle(false);
    triggeredRef.current = false;
    startRef.current = { y: e.clientY, posY: y };
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const dy   = e.clientY - startRef.current.y;
    const next = Math.max(0, Math.min(maxY, startRef.current.posY + dy));
    setY(next);
    if (!triggeredRef.current && next >= maxY * 0.85) {
      triggeredRef.current = true;
      onPull();
    }
  };
  const onPointerUp = () => { if (!dragging) return; setDragging(false); setY(0); };

  return (
    <div
      style={{
        position: "relative", width: ballSize + 8, height,
        cursor: disabled ? "not-allowed" : dragging ? "grabbing" : "grab",
      }}
    >
      {/* track */}
      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 6, marginLeft: -3, background: "var(--ink)", borderRadius: 4 }} />
      {/* trigger zone line */}
      <div style={{ position: "absolute", left: -2, right: -2, top: maxY * 0.85, height: 2, background: "var(--coral)", opacity: 0.45 }} />
      {/* ball */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={idle && !dragging && !disabled ? "rnd-lever-nudge" : ""}
        style={{
          position: "absolute", top: y, left: 4,
          width: ballSize, height: ballSize, borderRadius: 999,
          background: disabled ? "rgba(20,17,15,.2)" : "var(--coral)",
          border: "3px solid var(--ink)",
          boxShadow: disabled ? "none" : "2px 2px 0 var(--ink)",
          touchAction: "none",
          transition: dragging ? "none" : "top 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />
      {/* "ARRASTRA ↓" hint */}
      {idle && !dragging && !disabled && (
        <span
          className="rnd-lever-hint"
          style={{
            position: "absolute", right: ballSize + 14, top: ballSize / 2 - 9,
            fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 800,
            letterSpacing: "0.08em", color: "var(--ink)",
            background: "var(--paper-2)", border: "1.5px solid var(--ink)",
            padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap",
            boxShadow: "2px 2px 0 var(--ink)",
          }}
        >
          {hintLabel}
        </span>
      )}
    </div>
  );
}

/* ── Confetti (Legendario) ─────────────────────────────────────────────── */
function Confetti({ count = 24 }) {
  const COLORS = ["var(--coral)", "var(--acid)", "var(--sky)", "var(--lilac)", "var(--rose)", "var(--mint)"];
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left:     Math.random() * 100,
    delay:    Math.random() * 0.3,
    duration: 1.4 + Math.random() * 1.0,
    color:    COLORS[i % COLORS.length],
    rotate:   Math.random() * 360,
    size:     6 + Math.random() * 6,
    drift:    -20 + Math.random() * 40,
  })), []);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 10 }}>
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: "absolute", top: -16, left: `${p.left}%`,
          width: p.size, height: p.size * 0.5,
          background: p.color, border: "1.5px solid var(--ink)",
          animation: `confetti-fall ${p.duration}s cubic-bezier(0.4,0,0.6,1) ${p.delay}s forwards`,
          ["--rotate"]: `${p.rotate}deg`,
          ["--drift"]:  `${p.drift}px`,
        }}/>
      ))}
    </div>
  );
}

/* ── Sparkles (Épico) ──────────────────────────────────────────────────── */
function Sparkles({ count = 8 }) {
  const sparkles = useMemo(() => Array.from({ length: count }, () => ({
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    delay: Math.random() * 0.4,
    size:  14 + Math.random() * 10,
  })), []);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 9 }}>
      {sparkles.map((s, i) => (
        <span key={i} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          animation: `sparkle-pop 0.9s ease-out ${s.delay}s forwards`,
        }}>
          <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="var(--acid)" stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/>
          </svg>
        </span>
      ))}
    </div>
  );
}

/* ── Banner de victoria (Raro / Épico / Legendario) ───────────────────── */
function WinBanner({ rarity, onDone, showCta, ctaLabel, t }) {
  const { state } = useApp();
  useEffect(() => {
    if (showCta) return; // manual dismiss via button
    const timer = setTimeout(onDone, 2600);
    return () => clearTimeout(timer);
  }, [onDone, showCta]);

  const line = t(`random.win.${rarity}.line`);
  const sub  = t(`random.win.${rarity}.sub`);
  if (!line) return null;

  return (
    <div className="rnd-win-banner" style={{
      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", zIndex: 15,
      pointerEvents: showCta ? "auto" : "none",
      background: "rgba(20,17,15,0.45)",
      backdropFilter: "blur(2px)",
    }}>
      <div className="rnd-win-banner-card" style={{
        background: RARITY_BG[rarity], border: "3px solid var(--ink)",
        boxShadow: "var(--shadow-lg)", borderRadius: 16,
        padding: "14px 22px 16px", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div className="stripes-y" style={{ position: "absolute", inset: 0, opacity: 0.5 }}/>
        <span style={{ position: "relative", fontFamily: "JetBrains Mono", fontWeight: 800, fontSize: 11, letterSpacing: "0.18em", color: "rgba(20,17,15,.65)" }}>
          {RARITY_GLYPH[rarity]} {getRarityName(rarity, state.lang, state.rarityLabels).toUpperCase()}
        </span>
        <p className="serif" style={{ position: "relative", fontSize: 28, lineHeight: 1, margin: "8px 0 4px", textTransform: "lowercase" }}>{line}</p>
        <p className="mono" style={{ position: "relative", fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.65)", margin: 0, letterSpacing: "0.04em" }}>{sub}</p>
        {showCta && (
          <button
            onClick={onDone}
            style={{
              position: "relative", marginTop: 14,
              background: "var(--ink)", color: RARITY_BG[rarity],
              border: "2px solid var(--ink)", borderRadius: 12,
              fontWeight: 800, fontSize: 13, padding: "8px 20px",
              cursor: "pointer",
            }}
          >
            {ctaLabel || "Ver resultado"}
          </button>
        )}
      </div>
    </div>
  );
}

const CAT_MAP_ICONS = { Emociones: IHeart, Animales: IFlame, Lugares: IStar, Objetos: IBrush, Eventos: IStar, Acciones: IBrush };
const VAR_COLORS = { "Común": "var(--paper-2)", "Raro": "var(--sky)", "Épico": "var(--lilac)", "Legendario": "var(--acid)" };

/* ── Pantalla principal ─────────────────────────────────────────────────── */
export function RandomScreen() {
  const { state, dispatch } = useApp();
  const t = useT();
  const { selectedParams, rollsLeft, activeSeason, apiParams, slotFlow } = state;
  const [rolling, setRolling]       = useState(false);
  const [slots, setSlots]           = useState([null, null, null]);
  const [win, setWin]               = useState(null);
  const [toast, setToast]           = useState(null);
  const [phase, setPhase]           = useState("idle"); // reveal_first phases: idle | rarity_shown | landing | idea_shown
  const [pendingResults, setPendingResults] = useState(null);
  const [inlineSaved, setInlineSaved]       = useState(false);
  const [inlineRerolling, setInlineRerolling] = useState(false);
  const [aiPrompt, setAiPrompt]     = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const toastTimer  = useRef(null);
  const totalRolls  = WP_ROLLS || 3;

  /* Load backend variables (with value_en) once per session */
  useEffect(() => {
    if (Object.keys(apiParams).length > 0) return;
    fetchParameters()
      .then(data => {
        if (!data?.parameters?.length) return;
        const map = {};
        data.parameters.forEach(v => {
          if (!map[v.category]) map[v.category] = [];
          map[v.category].push(v);
        });
        dispatch({ type: "SET_API_PARAMS", params: map });
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Use API data when available, fall back to static data */
  const paramsMap = Object.keys(apiParams).length > 0 ? apiParams : PARAMETERS;

  const getCatCount = (catId) => {
    const pool     = paramsMap[catId] || [];
    const filtered = activeSeason
      ? pool.filter(v => !v.season || v.season === activeSeason)
      : pool.filter(v => !v.season);
    return filtered.length || pool.length;
  };

  const toggle = (paramId) => {
    if (selectedParams.includes(paramId)) {
      if (selectedParams.length > 1)
        dispatch({ type: "SET_PARAMS", params: selectedParams.filter(p => p !== paramId) });
    } else {
      if (selectedParams.length >= 3) {
        const bumped = PARAM_CATEGORIES.find(c => c.id === selectedParams[0]);
        if (bumped) {
          if (toastTimer.current) clearTimeout(toastTimer.current);
          setToast({ label: t(`random.cat.${bumped.id}`) });
          toastTimer.current = setTimeout(() => setToast(null), 2500);
        }
        dispatch({ type: "SET_PARAMS", params: [...selectedParams.slice(1), paramId] });
      } else {
        dispatch({ type: "SET_PARAMS", params: [...selectedParams, paramId] });
      }
    }
  };

  const doRoll = () => {
    if (rolling || rollsLeft <= 0 || selectedParams.length === 0 || win) return;
    useRoll();
    setRolling(true);
    setSlots([null, null, null]);
    setWin(null);
    setPhase("idle");
    setAiPrompt(null);

    const prevValues = (state.currentIdea?.variables ?? []).map(v => v.value);
    const results = pickVariables(selectedParams, activeSeason, paramsMap, prevValues);

    const computeOverall = (res) => {
      const rarities = res.slice(0, selectedParams.length).map(r => r.rarity);
      return rarities.includes("Legendario") ? "Legendario"
        : rarities.includes("Épico") ? "Épico"
        : rarities.includes("Raro") ? "Raro" : "Común";
    };

    if (slotFlow === "reveal_first") {
      // Spin animation (empty slots), then show rarity banner before revealing variables
      setTimeout(() => {
        setRolling(false);
        const overall = computeOverall(results);
        dispatch({ type: "SET_IDEA", idea: results, params: [...selectedParams] });
        setPendingResults(results);
        setWin(overall);
        setPhase("rarity_shown");
        track('roll', { params: selectedParams, rarity: overall });
      }, 1500);
    } else {
      // Classic: animate slots → rarity flash → IdeaScreen
      [350, 600, 850].slice(0, selectedParams.length).forEach((tv, i) => {
        setTimeout(() => {
          setSlots(prev => { const n = [...prev]; n[i] = results[i]; return n; });
        }, tv);
      });
      setTimeout(() => {
        setRolling(false);
        const overall = computeOverall(results);
        dispatch({ type: "SET_IDEA", idea: results, params: [...selectedParams] });
        setWin(overall);
        track('roll', { params: selectedParams, rarity: overall });
        if (overall === "Común") {
          setTimeout(() => dispatch({ type: "SET_SCREEN", screen: "idea" }), 600);
        }
      }, 1500);
    }
  };

  // Classic flow: after WinBanner → IdeaScreen
  const handleWinDone = () => {
    setWin(null);
    dispatch({ type: "SET_SCREEN", screen: "idea" });
  };

  // Reveal-first: rarity banner done → animate slots revealing variables
  const handleRevealDone = () => {
    setWin(null);
    setPhase("landing");
    const results = pendingResults;
    [350, 600, 850].slice(0, selectedParams.length).forEach((tv, i) => {
      setTimeout(() => {
        setSlots(prev => { const n = [...prev]; n[i] = results[i]; return n; });
      }, tv);
    });
    setTimeout(() => {
      setPhase("idea_shown");
      if (results?.length) {
        setAiLoading(true);
        generateAIPrompt(
          results.map(v => (state.lang === "en" && v.value_en) ? v.value_en : v.value),
          state.lang
        ).then(data => { if (data?.prompt) setAiPrompt(data.prompt); })
          .catch(() => {}).finally(() => setAiLoading(false));
      }
    }, 950);
  };

  const saveInline = () => {
    if (!state.currentIdea) return;
    dispatch({ type: "SAVE_IDEA", idea: state.currentIdea });
    setInlineSaved(true);
    track('idea_saved', { rarity: getOverallRarity(state.currentIdea.variables) });
    setTimeout(() => setInlineSaved(false), 1800);
  };

  const rerollInline = () => {
    if (rollsLeft <= 0 || inlineRerolling || !state.currentIdea) return;
    setInlineRerolling(true);
    const pm = Object.keys(apiParams).length > 0 ? apiParams : null;
    const prev = (state.currentIdea.variables ?? []).map(v => v.value);
    const newIdea = pickVariables(state.currentIdea.params, activeSeason, pm, prev);
    setTimeout(() => {
      dispatch({ type: "SET_IDEA", idea: newIdea, params: state.currentIdea.params });
      setSlots(newIdea.slice(0, selectedParams.length));
      setAiPrompt(null);
      setAiLoading(true);
      generateAIPrompt(newIdea.map(v => (state.lang === "en" && v.value_en) ? v.value_en : v.value), state.lang)
        .then(data => { if (data?.prompt) setAiPrompt(data.prompt); })
        .catch(() => {}).finally(() => setAiLoading(false));
      setInlineRerolling(false);
      track('idea_rerolled', {});
    }, 380);
  };

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

        {/* FIFO toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -28, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -28, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              style={{
                position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
                zIndex: 50, background: "var(--ink)", color: "#fff",
                borderRadius: 999, padding: "7px 14px",
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 7,
                whiteSpace: "nowrap", boxShadow: "3px 3px 0 rgba(20,17,15,.25)",
                pointerEvents: "none",
              }}
            >
              <IX s={11} stroke="var(--coral)"/>
              <span style={{ color: "var(--coral)" }}>«{toast.label}»</span>
              <span style={{ color: "rgba(255,255,255,.75)" }}>fue reemplazado</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div style={{ padding: "8px 22px 6px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <IDice s={24}/>
            <h2 className="serif" style={{ fontSize: 32, lineHeight: 1 }}>
              {t("random.title")}
            </h2>
          </div>
          <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.5)", marginTop: 6 }}>
            {t("random.subtitle")}
          </p>
        </div>

        <div className="scroll" style={{ flex: 1, padding: "10px 22px 90px" }}>

          {/* Category chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {PARAM_CATEGORIES.map((cat) => {
              const active  = selectedParams.includes(cat.id);
              const slot    = selectedParams.indexOf(cat.id);
              const CatIcon = CAT_ICONS[cat.id] || IDice;
              const col     = CAT_COLORS[cat.id] || "var(--paper-2)";
              const count   = getCatCount(cat.id);
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => toggle(cat.id)}
                  className={active ? "stk-sm" : ""}
                  layout
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: active ? col : "var(--paper-2)",
                    border: "2px solid var(--ink)",
                    borderRadius: 999, padding: "6px 12px",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    boxShadow: active ? "3px 3px 0 var(--ink)" : "none",
                  }}
                >
                  <CatIcon s={14}/>
                  {t(`random.cat.${cat.id}`)}
                  <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: active ? "rgba(20,17,15,.5)" : "rgba(20,17,15,.38)" }}>
                    ({count})
                  </span>
                  {active && (
                    <span style={{
                      width: 16, height: 16, borderRadius: 999, background: "var(--ink)", color: "var(--acid)",
                      fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {slot + 1}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Arcade cabinet */}
          <div style={{ position: "relative", width: "100%" }}>
            {/* Machine body — 22px right gap so lever ball overlaps machine edge */}
            <div style={{
              background: "var(--ink)",
              borderRadius: 26,
              boxShadow: "var(--shadow-lg)",
              padding: "16px 14px",
              position: "relative",
              marginRight: 22,
            }}>

              {/* Top hood: LEDs + title */}
              <div style={{
                background: "var(--acid)",
                borderRadius: "18px 18px 4px 4px",
                border: "2px solid var(--ink)",
                padding: "12px 14px",
                marginBottom: 10,
                position: "relative",
                overflow: "hidden",
              }}>
                <div className="stripes-y" style={{ position: "absolute", inset: 0, opacity: 0.6 }}/>
                {/* LED row */}
                <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: 5, marginBottom: 6 }}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className={rolling ? "rnd-led-on" : ""} style={{
                      width: 9, height: 9, borderRadius: 999,
                      background: rolling ? "var(--coral)" : "var(--ink)",
                      border: "1.5px solid var(--ink)",
                      animationDelay: `${i * 0.07}s`,
                    }}/>
                  ))}
                </div>
                {/* Title */}
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
                  <span className="serif" style={{ fontSize: 24, lineHeight: 1, fontStyle: "italic" }}>{t("random.title")}</span>
                  <span className="mono" style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", color: "rgba(20,17,15,.55)" }}>· 3 0 0 0 ·</span>
                </div>
              </div>

              {/* CRT screen */}
              <div style={{
                background: "var(--paper-2)",
                borderRadius: 14,
                padding: 12,
                position: "relative",
                overflow: "hidden",
                border: "2px solid #444",
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.25)",
              }}>
                {/* Scanlines */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(transparent 0 2px, rgba(20,17,15,0.04) 2px 3px)", pointerEvents: "none" }}/>

                {/* Reels */}
                <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {[0, 1, 2].map(i => {
                    const cat     = PARAM_CATEGORIES.find(c => c.id === selectedParams[i]);
                    const v       = slots[i];
                    const isActive = !!selectedParams[i];
                    const pool    = isActive ? (PARAMETERS[selectedParams[i]] || []).slice(0, 6) : [];
                    const tint    = v ? RARITY_BG[v.rarity] : "transparent";
                    return (
                      <div key={i} style={{
                        height: 110,
                        background: isActive ? tint : "rgba(255,255,255,0.05)",
                        borderRadius: 8,
                        position: "relative",
                        overflow: "hidden",
                        border: "1.5px solid var(--ink)",
                        transition: "background 0.3s",
                      }}>
                        {rolling && !v && isActive ? (
                          <div className="rnd-reel" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                            {[...pool, ...pool, ...pool, ...pool].map((w, k) => (
                              <span key={k} className="serif" style={{ height: 36, display: "flex", alignItems: "center", fontSize: 15, lineHeight: 1, color: "rgba(20,17,15,.65)" }}>
                                {getVarLabel(w, state.lang)}
                              </span>
                            ))}
                          </div>
                        ) : v ? (
                          <div className="rnd-stop" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 4, gap: 4 }}>
                            <span className="mono" style={{ fontWeight: 800, fontSize: 8, letterSpacing: "0.08em", opacity: 0.7 }}>
                              {RARITY_GLYPH[v.rarity]} {v.rarity.toUpperCase()}
                            </span>
                            <span className="serif" style={{ fontSize: 17, lineHeight: 1, textAlign: "center" }}>{getVarLabel(v, state.lang)}</span>
                          </div>
                        ) : (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: isActive ? "rgba(20,17,15,.15)" : "rgba(255,255,255,.2)", fontWeight: 800, fontSize: 30 }}>
                            ?
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Category labels */}
                <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 6 }}>
                  {[0, 1, 2].map(i => {
                    const cat = PARAM_CATEGORIES.find(c => c.id === selectedParams[i]);
                    return (
                      <p key={i} className="mono" style={{ fontSize: 8, fontWeight: 700, textAlign: "center", color: "rgba(20,17,15,.55)" }}>
                        {cat ? t(`random.cat.${cat.id}`).toUpperCase() : "—"}
                      </p>
                    );
                  })}
                </div>

                {/* Win celebrations */}
                {win === "Legendario" && <Confetti count={30}/>}
                {win === "Épico"      && <Sparkles count={10}/>}
                {win === "Raro"       && (
                  <div className="rnd-win-glow" style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 40px var(--sky)", pointerEvents: "none", zIndex: 8 }}/>
                )}
                {win === "Común"      && (
                  <div className="rnd-win-flash" style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.4)", pointerEvents: "none", zIndex: 8 }}/>
                )}
                {win && win !== "Común" && (
                  <WinBanner
                    rarity={win}
                    onDone={slotFlow === "reveal_first" ? handleRevealDone : handleWinDone}
                    showCta={slotFlow === "reveal_first"}
                    ctaLabel={t("random.reveal.cta")}
                    t={t}
                  />
                )}
              </div>

              {/* Coin tray */}
              <div style={{
                marginTop: 12,
                background: "var(--acid)",
                borderRadius: 12,
                border: "2px solid var(--ink)",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <span className="mono" style={{ fontWeight: 800, fontSize: 10, letterSpacing: "0.1em" }}>
                  {rollsLeft > 0 ? t("random.coins") : t("random.no_coins")}
                </span>
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  {Array.from({ length: totalRolls }).map((_, j) => (
                    <span key={j} style={{
                      width: 24, height: 24, borderRadius: 999,
                      background: j < rollsLeft ? "var(--coral)" : "transparent",
                      border: "2px solid var(--ink)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 800,
                      color: j < rollsLeft ? "var(--paper-2)" : "rgba(20,17,15,.3)",
                      boxShadow: j < rollsLeft ? "1.5px 1.5px 0 var(--ink)" : "none",
                      transition: "all 0.3s",
                    }}>
                      {j < rollsLeft ? "¢" : ""}
                    </span>
                  ))}
                </span>
              </div>

              <p className="mono" style={{ fontSize: 9, fontWeight: 700, textAlign: "center", color: "rgba(255,255,255,.5)", margin: "10px 0 0" }}>
                {rollsLeft > 0 ? t("random.roll.drag") : t("random.roll.tomorrow")}
              </p>
            </div>

            {/* Lever — sits in the 46px gap on the right */}
            <div style={{ position: "absolute", right: 0, top: 80 }}>
              <IdleLever
                onPull={doRoll}
                disabled={rolling || rollsLeft <= 0 || !!win}
                height={200}
                ballSize={34}
                hintLabel={t("random.lever.hint")}
              />
            </div>
          </div>
        </div>

        {/* ── Reveal-first: inline idea section ── */}
        <AnimatePresence>
          {phase === "idea_shown" && state.currentIdea && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="scroll"
              style={{
                flex: 1, minHeight: 0,
                padding: "12px 16px 0",
                background: "var(--paper)",
                borderTop: "2px solid var(--ink)",
              }}
            >
              {/* Variable cards */}
              {state.currentIdea.variables.map((variable, i) => {
                const catId = state.currentIdea.params[i];
                const CatIcon = CAT_MAP_ICONS[catId] || IHeart;
                const bg = VAR_COLORS[variable.rarity] || "var(--paper-2)";
                return (
                  <motion.div
                    key={`${variable.value}-${i}`}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, type: "spring", stiffness: 380, damping: 28 }}
                    className="stk"
                    style={{ background: bg, padding: 10, marginBottom: 8, display: "flex", gap: 10, alignItems: "center" }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CatIcon s={18}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="mono" style={{ fontSize: 8, fontWeight: 700, color: "rgba(20,17,15,.5)" }}>// {catId ? t(`random.cat.${catId}`).toUpperCase() : ""}</p>
                      <p style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.1, marginTop: 2, textTransform: "lowercase" }}>{getVarLabel(variable, state.lang)}</p>
                    </div>
                    <RarityBadge rarity={variable.rarity}/>
                  </motion.div>
                );
              })}

              {/* Prompt */}
              <div style={{ background: "var(--butter)", border: "2.5px solid var(--ink)", borderRadius: 18, padding: "14px 16px", marginBottom: 10, position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span className="tag">{t("idea.spoken")}</span>
                  {aiLoading && <span className="mono" style={{ fontSize: 8, fontWeight: 700, color: "rgba(20,17,15,.4)", animation: "pulse 1s infinite" }}>{t("idea.ai.generating")}</span>}
                  {aiPrompt && !aiLoading && <span className="mono" style={{ fontSize: 8, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>{t("idea.ai.btn")}</span>}
                </div>
                <p className="serif" style={{ fontSize: 18, lineHeight: 1.15 }}>
                  {aiPrompt ?? generatePrompt(state.currentIdea.variables, state.lang, t)}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 46px", gap: 8, marginBottom: 8 }}>
                <button
                  onClick={rerollInline}
                  disabled={rollsLeft <= 0 || inlineRerolling}
                  className="stk"
                  style={{
                    height: 42, background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 12,
                    fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    cursor: rollsLeft > 0 && !inlineRerolling ? "pointer" : "not-allowed",
                    opacity: rollsLeft <= 0 ? 0.4 : 1,
                  }}
                >
                  {inlineRerolling
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}><IDice s={14}/></motion.div>
                    : <IDice s={14}/>
                  }
                  {rollsLeft > 0 ? t("idea.reroll") : t("idea.reroll.disabled")}
                </button>
                <button
                  onClick={saveInline}
                  className="stk"
                  style={{ background: inlineSaved ? "var(--acid)" : "var(--lilac)", border: "2px solid var(--ink)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .2s" }}
                >
                  <IBookmark s={18}/>
                </button>
              </div>

              <button
                onClick={() => dispatch({ type: "SET_SCREEN", screen: "setupTimer" })}
                className="stk"
                style={{ width: "100%", height: 52, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "var(--shadow-lg)", cursor: "pointer", marginBottom: 12 }}
              >
                <IBrush s={18}/> {t("idea.accept")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav current="random"/>
      </div>

      <style>{`
        @keyframes rnd-led-pulse {
          0%,100% { background: var(--ink); box-shadow: none; }
          50%      { background: var(--coral); box-shadow: 0 0 8px var(--coral); }
        }
        .rnd-led-on { animation: rnd-led-pulse 0.42s ease-in-out infinite; }

        @keyframes rnd-reel-anim { 0% { transform: translateY(0); } 100% { transform: translateY(-216px); } }
        .rnd-reel { animation: rnd-reel-anim 0.24s linear infinite; }

        @keyframes rnd-stop-anim {
          0%   { transform: translateY(-30px); opacity: 0; }
          60%  { transform: translateY(6px);   opacity: 1; }
          100% { transform: translateY(0);     opacity: 1; }
        }
        .rnd-stop { animation: rnd-stop-anim 0.5s cubic-bezier(0.34,1.56,0.64,1); }

        @keyframes rnd-lever-bounce {
          0%, 88%, 100% { transform: translateY(0); }
          92%           { transform: translateY(7px); }
          96%           { transform: translateY(0); }
        }
        .rnd-lever-nudge { animation: rnd-lever-bounce 5s ease-in-out infinite; }

        @keyframes rnd-hint-fade {
          0%, 88%, 100% { opacity: 0.85; }
          92%, 96%      { opacity: 1; }
        }
        .rnd-lever-hint { animation: rnd-hint-fade 5s ease-in-out infinite; }

        @keyframes confetti-fall {
          0%   { transform: translate(0, 0) rotate(var(--rotate)); opacity: 1; }
          100% { transform: translate(var(--drift), 200px) rotate(calc(var(--rotate) + 540deg)); opacity: 0; }
        }
        @keyframes sparkle-pop {
          0%   { transform: scale(0) rotate(0);      opacity: 0; }
          40%  { transform: scale(1.2) rotate(90deg); opacity: 1; }
          100% { transform: scale(0.8) rotate(180deg); opacity: 0; }
        }
        @keyframes rnd-win-banner-in { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 1; } }
        .rnd-win-banner { animation: rnd-win-banner-in 0.3s ease-out; }
        @keyframes rnd-win-card-in {
          0%   { transform: scale(0.5) rotate(-6deg); opacity: 0; }
          60%  { transform: scale(1.1) rotate(2deg);  opacity: 1; }
          100% { transform: scale(1) rotate(0);        opacity: 1; }
        }
        .rnd-win-banner-card { animation: rnd-win-card-in 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes rnd-glow-anim { 0%,100% { opacity: 0; } 40% { opacity: 1; } }
        .rnd-win-glow  { animation: rnd-glow-anim 1.2s ease-in-out; }
        @keyframes rnd-flash-anim { 0% { opacity: 1; } 100% { opacity: 0; } }
        .rnd-win-flash { animation: rnd-flash-anim 0.35s ease-out forwards; }
      `}</style>
    </Phone>
  );
}
