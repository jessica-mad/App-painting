import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "../components/Phone";
import { RarityBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { PARAM_CATEGORIES, RARITY, getOverallRarity, generatePrompt, pickVariables, getVarLabel, getRarityName } from "../data/parameters";
import { generateAIPrompt } from "../utils/api";
import { IArrowL, IDice, IBookmark, IBrush, IHeart, IFlame, IStar, IUndo } from "../components/Icons";
import { useT } from "../i18n";

const CAT_MAP = Object.fromEntries(PARAM_CATEGORIES.map(c => [c.id, c]));
const CAT_ICONS_EL = { Emociones: IHeart, Animales: IFlame, Lugares: IStar, Objetos: IBrush, Eventos: IStar, Acciones: IBrush };

const VAR_COLORS = {
  "Común":      "var(--paper-2)",
  "Raro":       "var(--sky)",
  "Épico":      "var(--lilac)",
  "Legendario": "var(--acid)",
};

const RARITY_INFO = {
  [RARITY.COMUN]:      { emoji: "⚪", pct: "50%" },
  [RARITY.RARO]:       { emoji: "🔵", pct: "30%" },
  [RARITY.EPICO]:      { emoji: "🟣", pct: "15%" },
  [RARITY.LEGENDARIO]: { emoji: "🌟", pct: "5%"  },
};

const GLOW_COLORS = {
  "Épico":      "160,80,255",
  "Legendario": "210,155,0",
};

export function IdeaScreen() {
  const { state, dispatch } = useApp();
  const t = useT();
  const { currentIdea, rollsLeft, activeSeason, displacedIdea, apiParams } = state;

  /* Auto-dismiss undo toast */
  useEffect(() => {
    if (!displacedIdea) return;
    const timer = setTimeout(() => dispatch({ type: "CLEAR_DISPLACED" }), 6000);
    return () => clearTimeout(timer);
  }, [displacedIdea, dispatch]);
  const [saved, setSaved]         = useState(false);
  const [rerolling, setRerolling] = useState(false);
  const [aiPrompt, setAiPrompt]   = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!currentIdea?.variables?.length) return;
    setAiPrompt(null);
    setAiLoading(true);
    generateAIPrompt(currentIdea.variables.map(v => v.value))
      .then(data => { if (data?.prompt) setAiPrompt(data.prompt); })
      .catch(() => {})
      .finally(() => setAiLoading(false));
  }, [currentIdea]);

  const saveIdea = () => {
    dispatch({ type: "SAVE_IDEA", idea: currentIdea });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const reroll = () => {
    if (rollsLeft <= 0 || rerolling) return;
    setRerolling(true);
    const paramsMap = Object.keys(apiParams).length > 0 ? apiParams : null;
    const newIdea = pickVariables(currentIdea.params, activeSeason, paramsMap);
    setTimeout(() => {
      dispatch({ type: "SET_IDEA", idea: newIdea, params: currentIdea.params });
      setRerolling(false);
    }, 380);
  };

  if (!currentIdea) {
    dispatch({ type: "SET_SCREEN", screen: "random" });
    return null;
  }

  const { variables, params } = currentIdea;
  const rarity   = getOverallRarity(variables);
  const prompt   = aiPrompt ?? generatePrompt(variables, state.lang, t);
  const rarityInfo = RARITY_INFO[rarity] ?? RARITY_INFO[RARITY.COMUN];
  const glowRgb  = GLOW_COLORS[rarity];
  const rotations = [-1, 1, -0.5];

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "8px 22px 0", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })}
            style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 800, fontSize: 13, background: "transparent", border: "none", cursor: "pointer" }}
          >
            <IArrowL s={16}/> {t("idea.back")}
          </button>

          {/* Rarity badge — glows for Épico/Legendario */}
          {glowRgb ? (
            <motion.div
              animate={{ boxShadow: [`0 0 0px rgba(${glowRgb},0)`, `0 0 14px rgba(${glowRgb},0.75)`, `0 0 5px rgba(${glowRgb},0.3)`, `0 0 14px rgba(${glowRgb},0.75)`] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{ borderRadius: 999, display: "inline-flex" }}
            >
              <RarityBadge rarity={rarity} size="md"/>
            </motion.div>
          ) : (
            <RarityBadge rarity={rarity} size="md"/>
          )}
        </div>

        <h2 className="serif" style={{ fontSize: 36, marginTop: 6, lineHeight: 1, padding: "0 22px", flexShrink: 0 }}>{t("idea.title")}</h2>

        {/* Scrollable content */}
        <div className="scroll" style={{ flex: 1, minHeight: 0, padding: "14px 22px 8px" }}>

          {/* Variable cards */}
          <AnimatePresence mode="wait">
            <motion.div key={variables.map(v => v.value).join("-")}>
              {variables.map((variable, i) => {
                const cat = CAT_MAP[params[i]] ?? {};
                const CatIcon = CAT_ICONS_EL[params[i]] || IHeart;
                const bg = VAR_COLORS[variable.rarity] || "var(--paper-2)";
                return (
                  <motion.div
                    key={`${variable.value}-${i}`}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, type: "spring", stiffness: 380, damping: 28 }}
                    className="stk"
                    style={{ background: bg, padding: 12, marginBottom: 10, display: "flex", gap: 10, alignItems: "center", transform: `rotate(${rotations[i] || 0}deg)` }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CatIcon s={22}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>// {params[i] ? t(`random.cat.${params[i]}`).toUpperCase() : ""}</p>
                      <p style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.1, marginTop: 2, textTransform: "lowercase" }}>{getVarLabel(variable, state.lang)}</p>
                    </div>
                    <RarityBadge rarity={variable.rarity}/>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Prompt ticket */}
          <div style={{ position: "relative", marginTop: 14, transform: "rotate(-1deg)" }}>
            <div className="stk-lg" style={{ background: "var(--butter)", padding: 0, borderRadius: 22, overflow: "hidden", position: "relative", border: "3px solid var(--ink)" }}>
              <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.18 }}/>
              <div style={{ position: "relative", padding: "20px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <span className="tag">{t("idea.spoken")}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {aiPrompt && <span className="mono" style={{ fontSize: 8, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>{t("idea.ai.btn")}</span>}
                    {aiLoading && <span className="mono" style={{ fontSize: 8, fontWeight: 700, color: "rgba(20,17,15,.4)", animation: "pulse 1s infinite" }}>{t("idea.ai.generating")}</span>}
                    <span className="stamp" style={{ background: rarity === "Legendario" ? "var(--coral)" : "var(--acid)", color: rarity === "Legendario" ? "#fff" : "var(--ink)", borderColor: rarity === "Legendario" ? "#fff" : "var(--ink)" }}>
                      ★ {getRarityName(rarity, state.lang, state.rarityLabels).toLowerCase()}
                    </span>
                  </div>
                </div>
                <p className="serif" style={{ fontSize: 22, lineHeight: 1.1, letterSpacing: "-0.005em" }}>
                  {prompt}
                </p>
                <div className="perforated" style={{ margin: "16px -8px 10px" }}/>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700 }}>{t("idea.season")}</span>
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700 }}>{t("idea.deckLabel", { n: variables.length })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rarity legend — shown below the ticket */}
          <div style={{ marginTop: 12, background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{rarityInfo.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontWeight: 800, fontSize: 12 }}>{getRarityName(rarity, state.lang, state.rarityLabels)}</span>
                <span className="mono" style={{ fontSize: 9, fontWeight: 700, background: "rgba(20,17,15,.1)", padding: "1px 6px", borderRadius: 4 }}>{rarityInfo.pct} {t("idea.probability")}</span>
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(20,17,15,.6)", lineHeight: 1.3 }}>{t(`idea.headline.${rarity}`)}</p>
            </div>
          </div>

        </div>

        {/* Sticky CTA bar */}
        <div style={{
          flexShrink: 0, padding: "12px 22px",
          paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
          background: "rgba(255,253,243,0.92)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          borderTop: "2px solid rgba(20,17,15,.08)",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {/* Secondary row: re-roll + save */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 52px", gap: 8 }}>
            <button
              onClick={reroll}
              disabled={rollsLeft <= 0 || rerolling}
              className="stk"
              style={{
                height: 44, background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 14,
                fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                cursor: rollsLeft > 0 && !rerolling ? "pointer" : "not-allowed",
                opacity: rollsLeft <= 0 ? 0.4 : 1,
              }}
            >
              {rerolling
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}><IDice s={15}/></motion.div>
                : <IDice s={15}/>
              }
              {rollsLeft > 0 ? t("idea.reroll") : t("idea.reroll.disabled")}
            </button>
            <button
              onClick={saveIdea}
              className="stk"
              style={{ background: saved ? "var(--acid)" : "var(--lilac)", border: "2px solid var(--ink)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .2s" }}
              title={saved ? "¡Guardado!" : "Guardar idea"}
            >
              <IBookmark s={20}/>
            </button>
          </div>

          {/* Undo toast — displaced idea when limit reached */}
          <AnimatePresence>
            {displacedIdea && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{
                  background: "var(--coral)", border: "2px solid var(--ink)", borderRadius: 12,
                  padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
                }}>
                  <p style={{ flex: 1, fontWeight: 700, fontSize: 11, color: "#fff", lineHeight: 1.3 }}>
                    {t("idea.savedLimit")}
                  </p>
                  <button
                    onClick={() => dispatch({ type: "UNDO_SAVE" })}
                    style={{
                      height: 28, padding: "0 10px", borderRadius: 999,
                      border: "2px solid #fff", background: "#fff",
                      color: "var(--coral)", fontWeight: 800, fontSize: 10,
                      display: "flex", alignItems: "center", gap: 4, cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    <IUndo s={11}/> {t("idea.undo")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary CTA */}
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "setupTimer" })}
            className="stk"
            style={{ height: 56, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", cursor: "pointer" }}
          >
            <IBrush s={20}/> {t("idea.accept")}
          </button>
        </div>

      </div>
    </Phone>
  );
}
