import { motion } from "framer-motion";
import { Phone } from "../components/Phone";
import { RarityBadge, SeasonBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { PARAM_CATEGORIES, RARITY_COLORS, getOverallRarity, generatePrompt } from "../data/parameters";

const CATEGORY_ICONS = Object.fromEntries(PARAM_CATEGORIES.map(c => [c.id, c.icon]));

export function IdeaScreen() {
  const { state, dispatch } = useApp();
  const { currentIdea, selectedParams, rollsLeft } = state;

  if (!currentIdea) {
    dispatch({ type: "SET_SCREEN", screen: "random" });
    return null;
  }

  const rarity = getOverallRarity(currentIdea);
  const prompt = generatePrompt(currentIdea);
  const rarityColors = RARITY_COLORS[rarity];
  const isLegendary = rarity === "Legendario";

  return (
    <Phone>
      <div className="flex flex-col h-full px-5">
        {/* Header */}
        <div className="pt-4 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })}
              className="text-sm font-black"
            >
              ← Volver
            </button>
            <RarityBadge rarity={rarity} size="md" />
          </div>
          <h2 className="text-2xl font-black mt-3 leading-tight">Tu idea del día ✨</h2>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
          {/* Variable cards */}
          <div className="space-y-3 mb-5">
            {currentIdea.map((variable, i) => {
              const paramId = selectedParams[i];
              const varColors = RARITY_COLORS[variable.rarity];
              return (
                <motion.div
                  key={`${variable.value}-${i}`}
                  initial={{ x: 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center gap-4 rounded-2xl border-2 border-black p-4 sticker-shadow"
                  style={{ backgroundColor: varColors.bg }}
                >
                  <div className="w-12 h-12 rounded-xl border-2 border-black bg-white flex items-center justify-center text-2xl">
                    {CATEGORY_ICONS[paramId] || "✦"}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-neutral-400 uppercase tracking-wider">{paramId}</p>
                    <p className="font-black text-base capitalize">{variable.value}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <RarityBadge rarity={variable.rarity} size="sm" />
                    {variable.season && <SeasonBadge season={variable.season} />}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Prompt card */}
          <motion.div
            initial={{ rotate: -3, opacity: 0 }}
            animate={{ rotate: -1.5, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl border-4 border-black p-6 mb-5 relative overflow-hidden"
            style={{
              backgroundColor: isLegendary ? "#FFE066" : "#FFFDF3",
              boxShadow: `7px 7px 0 ${rarityColors.border}`,
            }}
          >
            {isLegendary && (
              <div className="absolute top-2 right-3 text-2xl float-1">🌟</div>
            )}
            <p className="text-xs font-black text-neutral-400 mb-2 uppercase tracking-widest">Tu reto</p>
            <p className="text-xl font-black leading-snug">{prompt}</p>
            {isLegendary && (
              <div className="mt-3 inline-flex items-center gap-2 bg-black text-[#DFFF23] rounded-full px-3 py-1 text-xs font-black">
                🌟 ¡Combinación legendaria! Rarísima.
              </div>
            )}
          </motion.div>

          {/* Rolls left */}
          {rollsLeft > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border-2 border-black bg-white p-3 mb-4">
              <span className="text-lg">🎲</span>
              <p className="text-xs font-black">
                Te quedan <span className="bg-[#DFFF23] px-1 rounded">{rollsLeft} intento{rollsLeft !== 1 ? "s" : ""}</span> para hoy
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pb-6 space-y-3 shrink-0">
          <div className="grid grid-cols-[1fr_56px] gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })}
              disabled={rollsLeft <= 0}
              className="h-12 rounded-2xl border-2 border-black bg-white font-black sticker-shadow active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-40"
            >
              {rollsLeft > 0 ? "🎲 Otra idea" : "Sin intentos"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="h-12 rounded-2xl border-2 border-black bg-[#FFD6E7] flex items-center justify-center text-xl sticker-shadow"
              aria-label="Guardar"
            >
              🔖
            </motion.button>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "setupTimer" })}
            className="w-full h-14 rounded-2xl border-2 border-black bg-[#DFFF23] font-black text-base sticker-shadow-md active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all"
          >
            🎯 ¡Aceptar reto!
          </motion.button>
        </div>
      </div>
    </Phone>
  );
}
