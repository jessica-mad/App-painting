import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { useApp } from "../data/store";
import { PARAM_CATEGORIES, PARAMETERS, pickVariables } from "../data/parameters";
import { IDice, IHeart, IFlame, IDiamond, IBolt, IStar, IBrush, IX, ISpark } from "../components/Icons";

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

export function RandomScreen() {
  const { state, dispatch } = useApp();
  const { selectedParams, rollsLeft, activeSeason } = state;
  const [rolling, setRolling] = useState(false);
  const [slots, setSlots] = useState([null, null, null]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const getCatCount = (catId) => {
    const pool = PARAMETERS[catId] || [];
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
          setToast({ label: bumped.label });
          toastTimer.current = setTimeout(() => setToast(null), 2500);
        }
        dispatch({ type: "SET_PARAMS", params: [...selectedParams.slice(1), paramId] });
      } else {
        dispatch({ type: "SET_PARAMS", params: [...selectedParams, paramId] });
      }
    }
  };

  const doRoll = () => {
    if (rolling || rollsLeft <= 0 || selectedParams.length === 0) return;
    setRolling(true);
    setSlots([null, null, null]);

    const results = pickVariables(selectedParams, activeSeason);

    [350, 600, 850].slice(0, selectedParams.length).forEach((t, i) => {
      setTimeout(() => {
        setSlots(prev => { const n = [...prev]; n[i] = results[i]; return n; });
      }, t);
    });

    setTimeout(() => {
      setRolling(false);
      dispatch({ type: "SET_IDEA", idea: results, params: [...selectedParams] });
      dispatch({ type: "SET_SCREEN", screen: "idea" });
    }, 1500);
  };

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

        {/* FIFO bump toast */}
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
              El{" "}
              <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "0 8px", borderRadius: 8, fontFamily: "Space Grotesk", fontStyle: "normal", fontWeight: 700, fontSize: 22, letterSpacing: "-0.04em" }}>
                Randometro
              </span>
            </h2>
          </div>
          <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.5)", marginTop: 6 }}>
            // ACTIVA HASTA 3 SLOTS · EL MÁS ANTIGUO SALE PRIMERO (FIFO)
          </p>
        </div>

        <div className="scroll" style={{ flex: 1, padding: "10px 22px 90px" }}>

          {/* Category chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {PARAM_CATEGORIES.map((cat) => {
              const active = selectedParams.includes(cat.id);
              const slot   = selectedParams.indexOf(cat.id);
              const CatIcon = CAT_ICONS[cat.id] || IDice;
              const col    = CAT_COLORS[cat.id] || "var(--paper-2)";
              const count  = getCatCount(cat.id);
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
                  {cat.label}
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

          {/* Machine */}
          <div className="stk-lg" style={{ background: "var(--paper-2)", padding: 14, position: "relative", overflow: "hidden" }}>
            <div className="stripes-acid" style={{ position: "absolute", inset: 0, opacity: 0.6 }}/>
            <div style={{ position: "relative" }}>
              {/* Machine header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {["var(--coral)", "var(--butter)", "var(--mint)"].map((c, j) => (
                    <span key={j} style={{ width: 11, height: 11, borderRadius: 999, background: c, border: "1.5px solid var(--ink)" }}/>
                  ))}
                </div>
                <span className="tag" style={{ background: "var(--ink)", color: "var(--acid)", padding: "3px 8px", borderRadius: 4 }}>RANDOMETRO 3000</span>
              </div>

              {/* Slots grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
                {[0, 1, 2].map(i => {
                  const cat    = PARAM_CATEGORIES.find(c => c.id === selectedParams[i]);
                  const val    = slots[i];
                  const isActive = !!selectedParams[i];
                  return (
                    <div key={i}>
                      <div style={{
                        height: 78, border: "2px solid var(--ink)", borderRadius: 14,
                        background: isActive ? "var(--paper-2)" : "rgba(20,17,15,.04)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        textAlign: "center", padding: 6, position: "relative", overflow: "hidden",
                        transition: "background .2s",
                      }}>
                        <span style={{ position: "absolute", top: 4, left: 6 }} className="mono">
                          <span style={{ fontSize: 8, fontWeight: 700, color: isActive ? "rgba(20,17,15,.5)" : "rgba(20,17,15,.18)" }}>
                            S{i + 1}
                          </span>
                        </span>
                        <AnimatePresence mode="wait">
                          {rolling && !val ? (
                            <motion.div
                              key="rolling"
                              animate={{ y: [0, -18, 18, -8, 0], rotate: [0, -12, 12, -4, 0] }}
                              transition={{ duration: 0.38, repeat: Infinity }}
                            >
                              <IDice s={24} stroke={isActive ? "rgba(20,17,15,.45)" : "rgba(20,17,15,.12)"}/>
                            </motion.div>
                          ) : val ? (
                            <motion.p
                              key={val.value}
                              initial={{ y: 22, opacity: 0, scale: 0.75 }}
                              animate={{ y: 0, opacity: 1, scale: 1 }}
                              transition={{ type: "spring", stiffness: 420, damping: 20 }}
                              style={{ fontWeight: 800, fontSize: 12, textTransform: "lowercase" }}
                            >
                              {val.value}
                            </motion.p>
                          ) : (
                            <span style={{ fontWeight: 800, fontSize: 22, color: "rgba(20,17,15,.18)" }}>?</span>
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="mono" style={{ fontSize: 9, fontWeight: 700, textAlign: "center", marginTop: 4, color: "rgba(20,17,15,.6)" }}>
                        {cat ? cat.label.toUpperCase() : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Randomize button */}
              <button
                onClick={doRoll}
                disabled={rolling || rollsLeft <= 0}
                className="stk"
                style={{
                  width: "100%", height: 54, background: "var(--ink)", color: "var(--acid)",
                  border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  cursor: rollsLeft > 0 && !rolling ? "pointer" : "not-allowed",
                  opacity: rollsLeft <= 0 ? 0.5 : 1,
                }}
              >
                {rolling ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.55, repeat: Infinity, ease: "linear" }}>
                      <IDice s={20} stroke="var(--acid)"/>
                    </motion.div>
                    Buscando reto perfecto…
                  </>
                ) : rollsLeft > 0 ? (
                  <><IDice s={20} stroke="var(--acid)"/> ¡RANDOMIZAR!</>
                ) : (
                  "Sin intentos hoy"
                )}
              </button>
            </div>
          </div>

          {/* Tries counter */}
          <div className="stk-sm" style={{ background: "var(--paper-2)", padding: 14, marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: 13 }}>Intentos restantes</p>
              <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.5)" }}>// ÚSALOS CON SABIDURÍA</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{
                  width: 30, height: 30, borderRadius: 999, border: "2px solid var(--ink)",
                  background: j < rollsLeft ? "var(--acid)" : "var(--paper)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {j < rollsLeft ? <IDice s={14}/> : <IX s={14} stroke="rgba(20,17,15,.3)"/>}
                </div>
              ))}
            </div>
          </div>

          {/* Secondary CTA: skip session */}
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "upload" })}
            style={{
              width: "100%", marginTop: 10, height: 44,
              background: "transparent", border: "2px dashed rgba(20,17,15,.28)", borderRadius: 14,
              fontWeight: 700, fontSize: 12, color: "rgba(20,17,15,.52)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            Ya tengo mi obra · Continuar sin sesión →
          </button>

          <div className="stk-sm" style={{ background: "var(--lilac)", padding: 12, marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <ISpark s={20}/>
            <p style={{ fontWeight: 700, fontSize: 11, lineHeight: 1.3 }}>Épico y Legendario tienen menor probabilidad. ¡Mezcla bien para una idea más original!</p>
          </div>

        </div>

        <BottomNav current="random"/>
      </div>
    </Phone>
  );
}
