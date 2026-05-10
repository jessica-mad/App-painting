import { motion } from "framer-motion";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { RarityBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { RARITY } from "../data/parameters";

const SAVED_IDEAS = [
  { id: "s1", variables: ["melancolía", "cuervo", "carnaval"], rarity: RARITY.EPICO, params: ["Emociones", "Animales", "Eventos"] },
  { id: "s2", variables: ["nostalgia", "zorro", "biblioteca infinita"], rarity: RARITY.RARO, params: ["Emociones", "Animales", "Lugares"] },
  { id: "s3", variables: ["dualidad interior", "fénix", "fin del mundo"], rarity: RARITY.LEGENDARIO, params: ["Emociones", "Animales", "Eventos"] },
];

export function SavedScreen() {
  const { dispatch } = useApp();

  return (
    <Phone>
      <div className="flex flex-col h-full">
        <div className="px-5 pt-4 pb-3 shrink-0">
          <h2 className="text-2xl font-black">Ideas guardadas 🔖</h2>
          <p className="text-xs font-semibold text-neutral-500 mt-1">{SAVED_IDEAS.length} ideas para cuando estés listo</p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-20 space-y-3">
          {SAVED_IDEAS.map((idea, i) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border-2 border-black bg-white p-4 sticker-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-wrap gap-1">
                  {idea.variables.map(v => (
                    <span key={v} className="text-xs font-black bg-[#DFFF23] border border-black px-2 py-0.5 rounded-full capitalize">
                      {v}
                    </span>
                  ))}
                </div>
                <RarityBadge rarity={idea.rarity} size="sm" />
              </div>
              <p className="text-sm font-black text-neutral-600 mb-3">
                Ilustra {idea.variables[0]} encontrando {idea.variables[1]} en {idea.variables[2]}.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => dispatch({ type: "SET_SCREEN", screen: "setupTimer" })}
                  className="flex-1 h-10 rounded-xl border-2 border-black bg-[#DFFF23] font-black text-xs sticker-shadow"
                >
                  🎯 Aceptar reto
                </button>
                <button className="w-10 h-10 rounded-xl border-2 border-black bg-white flex items-center justify-center sticker-shadow">
                  🗑️
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <BottomNav current="saved" />
      </div>
    </Phone>
  );
}
