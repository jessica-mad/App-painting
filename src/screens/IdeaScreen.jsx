import { motion } from "framer-motion";
import { Phone } from "../components/Phone";
import { RarityBadge, SeasonBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { PARAM_CATEGORIES, RARITY_COLORS, getOverallRarity, generatePrompt } from "../data/parameters";

const CAT_MAP = Object.fromEntries(PARAM_CATEGORIES.map(c => [c.id, c]));

export function IdeaScreen() {
  const { state, dispatch } = useApp();
  const { currentIdea, rollsLeft } = state;

  if (!currentIdea) {
    dispatch({ type: "SET_SCREEN", screen: "random" });
    return null;
  }

  const { variables, params } = currentIdea;
  const rarity       = getOverallRarity(variables);
  const prompt       = generatePrompt(variables);
  const rarityColors = RARITY_COLORS[rarity];
  const isLegendary  = rarity === "Legendario";

  return (
    <Phone>
      <div className="flex flex-col h-full px-5">
        {/* Header */}
        <div className="pt-4 pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <button onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })}
              className="text-sm font-black">
              ← Volver
            </button>
            <RarityBadge rarity={rarity} size="md" />
          </div>
          <h2 className="text-2xl font-black mt-2 leading-tight">Tu idea ✨</h2>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-4 space-y-3">
          {/* Cards de variables */}
          {variables.map((variable, i) => {
            const cat       = CAT_MAP[params[i]] ?? {};
            const varColors = RARITY_COLORS[variable.rarity];
            return (
              <motion.div key={`${variable.value}-${i}`}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 320, damping: 26 }}
                className="flex items-center gap-3 rounded-2xl border-2 border-black p-3 sticker-shadow"
                style={{ backgroundColor: varColors.bg }}
              >
                <div className="w-11 h-11 rounded-xl border-2 border-black bg-white flex items-center justify-center text-xl shrink-0">
                  {cat.icon ?? "✦"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">{params[i]}</p>
                  <p className="font-black text-sm leading-tight capitalize">{variable.value}</p>
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <RarityBadge rarity={variable.rarity} size="sm" />
                  {variable.season && <SeasonBadge season={variable.season} />}
                </div>
              </motion.div>
            );
          })}

          {/* Tarjeta del prompt */}
          <motion.div
            initial={{ rotate: -3, opacity: 0 }}
            animate={{ rotate: -1.5, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="rounded-3xl border-4 border-black p-5 relative overflow-hidden"
            style={{
              backgroundColor: isLegendary ? "#FFE066" : "#FFFDF3",
              boxShadow: `6px 6px 0 ${rarityColors.border}`,
            }}
          >
            {isLegendary && <span className="absolute top-2 right-3 text-xl float-1">🌟</span>}
            <p className="text-[10px] font-black text-neutral-400 mb-1.5 uppercase tracking-widest">Tu reto</p>
            <p className="text-lg font-black leading-snug">{prompt}</p>
            {isLegendary && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-black text-[#DFFF23] rounded-full px-3 py-1 text-xs font-black">
                🌟 ¡Combinación legendaria! Rarísima.
              </div>
            )}
          </motion.div>

          {/* Intentos restantes */}
          {rollsLeft > 0 && (
            <div className="flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2">
              <span className="text-base">🎲</span>
              <p className="text-xs font-black">
                Te quedan{" "}
                <span className="bg-[#DFFF23] px-1 rounded font-black">{rollsLeft}</span>
                {" "}intento{rollsLeft !== 1 ? "s" : ""} hoy
              </p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="pb-5 space-y-2.5 shrink-0">
          <div className="grid grid-cols-[1fr_52px] gap-2.5">
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })}
              disabled={rollsLeft <= 0}
              className="h-12 rounded-2xl border-2 border-black bg-white font-black text-sm sticker-shadow active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-40"
            >
              {rollsLeft > 0 ? "🎲 Otra idea" : "Sin intentos"}
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }}
              className="h-12 rounded-2xl border-2 border-black bg-[#FFD6E7] flex items-center justify-center text-xl sticker-shadow"
              aria-label="Guardar"
            >🔖</motion.button>
          </div>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "setupTimer" })}
            className="w-full h-13 py-3 rounded-2xl border-2 border-black bg-[#DFFF23] font-black sticker-shadow-md active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all"
          >
            🎯 ¡Aceptar reto!
          </motion.button>
        </div>
      </div>
    </Phone>
  );
}
