import { useState } from "react";
import { Phone } from "../components/Phone";
import { RarityBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { PARAM_CATEGORIES, getOverallRarity, generatePrompt } from "../data/parameters";
import { IArrowL, IDice, IBookmark, IBrush, IHeart, IFlame, IStar } from "../components/Icons";

const CAT_MAP = Object.fromEntries(PARAM_CATEGORIES.map(c => [c.id, c]));
const CAT_ICONS_EL = { emo: IHeart, ani: IFlame, lug: IStar, obj: IBrush, evt: IStar, col: IBrush };

const VAR_COLORS = {
  "Común":      "var(--paper-2)",
  "Raro":       "var(--sky)",
  "Épico":      "var(--lilac)",
  "Legendario": "var(--acid)",
};

const RARITY_DISPLAY = {
  "Común": "Susurro", "Raro": "Visión", "Épico": "Éxtasis", "Legendario": "✦ Epifanía",
};

const RARITY_MSG = {
  "Común": "Un susurro de inspiración. Sencillo, directo.",
  "Raro": "Una visión. Esto tiene potencial.",
  "Épico": "Éxtasis. La Musa ha sido generosa hoy.",
  "Legendario": "Epifanía. Esto no pasa todos los días. No lo desperdicies.",
};

export function IdeaScreen() {
  const { state, dispatch } = useApp();
  const { currentIdea, rollsLeft } = state;
  const [saved, setSaved] = useState(false);
  const saveIdea = () => {
    dispatch({ type: "SAVE_IDEA", idea: currentIdea });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  if (!currentIdea) {
    dispatch({ type: "SET_SCREEN", screen: "random" });
    return null;
  }

  const { variables, params } = currentIdea;
  const rarity = getOverallRarity(variables);
  const prompt = generatePrompt(variables);
  const rotations = [-1, 1, -0.5];

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "0 22px" }}>
        {/* Header */}
        <div style={{ paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })}
            style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 800, fontSize: 13, background: "transparent", border: "none", cursor: "pointer" }}
          >
            <IArrowL s={16}/> Volver
          </button>
          <RarityBadge rarity={rarity} size="md"/>
        </div>
        <h2 className="serif" style={{ fontSize: 36, marginTop: 8, lineHeight: 1 }}>Tu idea</h2>

        <div className="scroll" style={{ flex: 1, paddingTop: 14, paddingBottom: 20 }}>
          {/* Variable cards */}
          {variables.map((variable, i) => {
            const cat = CAT_MAP[params[i]] ?? {};
            const CatIcon = CAT_ICONS_EL[params[i]] || IHeart;
            const bg = VAR_COLORS[variable.rarity] || "var(--paper-2)";
            return (
              <div key={`${variable.value}-${i}`} className="stk" style={{
                background: bg, padding: 12, marginBottom: 10,
                display: "flex", gap: 10, alignItems: "center",
                transform: `rotate(${rotations[i] || 0}deg)`,
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CatIcon s={22}/>
                </div>
                <div style={{ flex: 1 }}>
                  <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>// {cat.label?.toUpperCase() || params[i]?.toUpperCase()}</p>
                  <p style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.1, marginTop: 2, textTransform: "lowercase" }}>{variable.value}</p>
                </div>
                <RarityBadge rarity={variable.rarity}/>
              </div>
            );
          })}

          {/* Prompt ticket */}
          <div style={{ position: "relative", marginTop: 14, transform: "rotate(-1deg)" }}>
            <div className="stk-lg" style={{ background: "var(--butter)", padding: 0, borderRadius: 22, overflow: "hidden", position: "relative", border: "3px solid var(--ink)" }}>
              <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.18 }}/>
              <div style={{ position: "relative", padding: "20px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <span className="tag">// TU RETO</span>
                  <span className="stamp" style={{ background: rarity === "Legendario" ? "var(--coral)" : "var(--acid)", color: rarity === "Legendario" ? "#fff" : "var(--ink)", borderColor: rarity === "Legendario" ? "#fff" : "var(--ink)" }}>
                    {RARITY_DISPLAY[rarity] || rarity}
                  </span>
                </div>
                <p className="serif" style={{ fontSize: 22, lineHeight: 1.1, letterSpacing: "-0.005em" }}>
                  {prompt}
                </p>
                <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 8, lineHeight: 1.4 }}>
                  {RARITY_MSG[rarity]}
                </p>
                <div className="perforated" style={{ margin: "12px -8px 10px" }}/>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700 }}>MUSAI · HOY</span>
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700 }}>RAREZA ×{variables.length}</span>
                </div>
              </div>
            </div>
          </div>

          {rollsLeft > 0 && (
            <div className="stk-sm" style={{ background: "var(--paper-2)", padding: 10, marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <IDice s={18}/>
              <p style={{ fontSize: 11, fontWeight: 700 }}>
                Te quedan <span style={{ background: "var(--acid)", padding: "0 4px", borderRadius: 4 }}>{rollsLeft}</span> intento{rollsLeft !== 1 ? "s" : ""} hoy
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ paddingBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 56px", gap: 10 }}>
            <button
              onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })}
              disabled={rollsLeft <= 0}
              className="stk"
              style={{ height: 48, background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: rollsLeft > 0 ? "pointer" : "not-allowed", opacity: rollsLeft <= 0 ? 0.4 : 1 }}
            >
              <IDice s={16}/> {rollsLeft > 0 ? "Otra idea" : "Sin visitas hoy"}
            </button>
            <button
              onClick={saveIdea}
              className="stk"
              style={{ background: saved ? "var(--acid)" : "var(--lilac)", border: "2px solid var(--ink)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .2s" }}
              title={saved ? "¡Guardado!" : "Guardar idea"}
            >
              <IBookmark s={20}/>
            </button>
          </div>
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "setupTimer" })}
            className="stk"
            style={{ height: 56, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", cursor: "pointer" }}
          >
            <IBrush s={20}/> ¡Aceptar reto!
          </button>
        </div>
      </div>
    </Phone>
  );
}
