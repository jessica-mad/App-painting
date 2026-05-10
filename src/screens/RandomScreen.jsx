import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { useApp } from "../data/store";
import { PARAM_CATEGORIES, pickVariables } from "../data/parameters";
import { IDice, IHeart, IFlame, IDiamond, IBolt, IStar, IBrush, IX, ISpark } from "../components/Icons";

const CAT_ICONS = { emo: IHeart, ani: IFlame, lug: IDiamond, obj: IBolt, evt: IStar, col: IBrush };
const CAT_COLORS = {
  emo: "var(--rose)", ani: "var(--butter)", lug: "var(--sky)",
  obj: "var(--mint)", evt: "var(--lilac)", col: "var(--acid)",
};

export function RandomScreen() {
  const { state, dispatch } = useApp();
  const { selectedParams, rollsLeft, activeSeason } = state;
  const [rolling, setRolling] = useState(false);
  const [slots, setSlots] = useState([null, null, null]);

  const toggle = (paramId) => {
    if (selectedParams.includes(paramId)) {
      if (selectedParams.length > 1)
        dispatch({ type: "SET_PARAMS", params: selectedParams.filter(p => p !== paramId) });
    } else {
      const next = selectedParams.length >= 3
        ? [...selectedParams.slice(1), paramId]
        : [...selectedParams, paramId];
      dispatch({ type: "SET_PARAMS", params: next });
    }
  };

  const doRoll = () => {
    if (rolling || rollsLeft <= 0 || selectedParams.length === 0) return;
    setRolling(true);
    setSlots([null, null, null]);

    const results = pickVariables(selectedParams, activeSeason);

    [300, 500, 700].slice(0, selectedParams.length).forEach((t, i) => {
      setTimeout(() => {
        setSlots(prev => { const n = [...prev]; n[i] = results[i]; return n; });
      }, t);
    });

    setTimeout(() => {
      setRolling(false);
      dispatch({ type: "SET_IDEA", idea: results, params: [...selectedParams] });
      dispatch({ type: "SET_SCREEN", screen: "idea" });
    }, 950);
  };

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
            // TOCA PARA ACTIVAR · TOCA OTRO PARA INTERCAMBIAR
          </p>
        </div>

        <div className="scroll" style={{ flex: 1, padding: "10px 22px 90px" }}>
          {/* Category chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {PARAM_CATEGORIES.map((cat) => {
              const active = selectedParams.includes(cat.id);
              const slot = selectedParams.indexOf(cat.id);
              const CatIcon = CAT_ICONS[cat.id] || IDice;
              const col = CAT_COLORS[cat.id] || "var(--paper-2)";
              return (
                <button
                  key={cat.id}
                  onClick={() => toggle(cat.id)}
                  className={active ? "stk-sm" : ""}
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
                  {active && (
                    <span style={{ width: 16, height: 16, borderRadius: 999, background: "var(--ink)", color: "var(--acid)", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {slot + 1}
                    </span>
                  )}
                </button>
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
                  const cat = PARAM_CATEGORIES.find(c => c.id === selectedParams[i]);
                  const val = slots[i];
                  return (
                    <div key={i}>
                      <div style={{
                        height: 78, border: "2px solid var(--ink)", borderRadius: 14,
                        background: "var(--paper-2)", display: "flex", alignItems: "center",
                        justifyContent: "center", textAlign: "center", padding: 6, position: "relative",
                        overflow: "hidden",
                      }}>
                        <span style={{ position: "absolute", top: 4, left: 6 }} className="mono">
                          <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>0{i + 1}</span>
                        </span>
                        <AnimatePresence mode="wait">
                          {rolling && !val ? (
                            <motion.div key="rolling" animate={{ y: [0, -20, 20, -10, 0] }} transition={{ duration: 0.35, repeat: Infinity }}>
                              <IDice s={24} stroke="rgba(20,17,15,.3)"/>
                            </motion.div>
                          ) : val ? (
                            <motion.p key={val.value} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ fontWeight: 800, fontSize: 12, textTransform: "lowercase" }}>
                              {val.value}
                            </motion.p>
                          ) : (
                            <span style={{ fontWeight: 800, fontSize: 22, color: "rgba(20,17,15,.2)" }}>?</span>
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
                  cursor: rollsLeft > 0 ? "pointer" : "not-allowed", opacity: rollsLeft <= 0 ? 0.5 : 1,
                }}
              >
                <IDice s={20} stroke="var(--acid)"/>
                {rolling ? "Mezclando..." : rollsLeft > 0 ? "¡RANDOMIZAR!" : "Sin intentos hoy"}
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

          <div className="stk-sm" style={{ background: "var(--lilac)", padding: 12, marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <ISpark s={20}/>
            <p style={{ fontWeight: 700, fontSize: 11, lineHeight: 1.3 }}>Las variables Épicas y Legendarias tienen menor probabilidad. Mezcla bien.</p>
          </div>
        </div>

        <BottomNav current="random"/>
      </div>
    </Phone>
  );
}
