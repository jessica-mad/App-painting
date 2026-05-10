import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { RarityBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { PARAM_CATEGORIES, pickVariables, getOverallRarity, generatePrompt } from "../data/parameters";

function SlotColumn({ value, rolling }) {
  return (
    <div className="flex-1 h-20 rounded-2xl border-2 border-black bg-white overflow-hidden relative flex items-center justify-center">
      <AnimatePresence mode="wait">
        {rolling ? (
          <motion.div
            key="rolling"
            className="text-center"
            animate={{ y: [0, -40, 40, -20, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="text-2xl">🎲</div>
            <div className="text-xs font-black text-neutral-400">...</div>
          </motion.div>
        ) : value ? (
          <motion.div
            key={value.value}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="text-center px-2"
          >
            <div className="text-sm font-black leading-tight">{value.value}</div>
          </motion.div>
        ) : (
          <motion.div key="empty" className="text-center text-neutral-300">
            <div className="text-2xl">?</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RandomScreen() {
  const { state, dispatch } = useApp();
  const { selectedParams, rollsLeft, activeSeason } = state;
  const [rolling, setRolling] = useState(false);
  const [slots, setSlots] = useState([null, null, null]);
  const [shaking, setShaking] = useState(false);

  const toggle = (paramId) => {
    if (selectedParams.includes(paramId)) {
      if (selectedParams.length > 1) {
        dispatch({ type: "SET_PARAMS", params: selectedParams.filter(p => p !== paramId) });
      }
    } else if (selectedParams.length < 3) {
      dispatch({ type: "SET_PARAMS", params: [...selectedParams, paramId] });
    }
  };

  const doRoll = () => {
    if (rolling || rollsLeft <= 0 || selectedParams.length === 0) return;
    setRolling(true);
    setShaking(true);

    // Progressive reveal
    const results = pickVariables(selectedParams, activeSeason);
    const timing = [300, 500, 700];

    timing.slice(0, selectedParams.length).forEach((t, i) => {
      setTimeout(() => {
        setSlots(prev => {
          const next = [...prev];
          next[i] = results[i];
          return next;
        });
      }, t);
    });

    setTimeout(() => {
      setRolling(false);
      setShaking(false);
      dispatch({ type: "SET_IDEA", idea: results });
      dispatch({ type: "SET_SCREEN", screen: "idea" });
    }, 900);
  };

  return (
    <Phone>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <h2 className="text-2xl font-black leading-tight">
            🎰 El{" "}
            <span className="bg-black text-[#DFFF23] px-2 rounded-xl">Randometro</span>
          </h2>
          <p className="text-xs font-semibold text-neutral-500 mt-1">
            Selecciona hasta 3 parámetros para mezclar
          </p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-20">
          {/* Parameter chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {PARAM_CATEGORIES.map(cat => {
              const isSelected = selectedParams.includes(cat.id);
              const isDisabled = !isSelected && selectedParams.length >= 3;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggle(cat.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 border-black font-black text-xs transition-all
                    ${isSelected ? "sticker-shadow" : ""}
                    ${isDisabled ? "opacity-30" : ""}
                  `}
                  style={{ backgroundColor: isSelected ? cat.color : "white" }}
                >
                  {cat.icon} {cat.label}
                  {isSelected && <span className="w-4 h-4 rounded-full bg-black text-white text-[9px] flex items-center justify-center">✓</span>}
                </motion.button>
              );
            })}
          </div>

          {/* Machine */}
          <motion.div
            animate={shaking ? {
              x: [-3, 3, -3, 3, -2, 2, 0],
              y: [0, -2, 2, -2, 2, 0],
            } : {}}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border-4 border-black bg-gradient-to-br from-pink-200 via-[#DFFF23] to-cyan-200 p-5 mb-4 sticker-shadow-xl"
          >
            {/* Machine header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 border border-black" />
                <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black" />
                <div className="w-3 h-3 rounded-full bg-green-400 border border-black" />
              </div>
              <span className="text-xs font-black bg-black text-[#DFFF23] px-2 py-0.5 rounded-full">
                RANDOMETRO 3000
              </span>
            </div>

            {/* Slots */}
            <div className="flex gap-2 mb-3">
              {[0, 1, 2].map(i => (
                <SlotColumn
                  key={i}
                  value={selectedParams[i] ? slots[i] : null}
                  rolling={rolling && !!selectedParams[i]}
                />
              ))}
            </div>

            {/* Labels */}
            <div className="flex gap-2 mb-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex-1 text-center">
                  {selectedParams[i] ? (
                    <span className="text-[10px] font-black text-black/60">
                      {PARAM_CATEGORIES.find(c => c.id === selectedParams[i])?.icon} {selectedParams[i]}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-black/30">—</span>
                  )}
                </div>
              ))}
            </div>

            {/* Roll button */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={doRoll}
              disabled={rolling || rollsLeft <= 0}
              className="w-full h-14 rounded-2xl border-2 border-black bg-black text-[#DFFF23] font-black text-lg sticker-shadow disabled:opacity-50"
            >
              {rolling ? "🎲 Mezclando..." : rollsLeft > 0 ? "🎲 ¡RANDOMIZAR!" : "Sin intentos hoy"}
            </motion.button>
          </motion.div>

          {/* Rolls counter */}
          <div className="flex items-center justify-between rounded-2xl border-2 border-black bg-white p-4 mb-4">
            <div>
              <p className="font-black">Intentos restantes</p>
              <p className="text-xs font-semibold text-neutral-400">
                {rollsLeft > 0 ? "Úsalos con sabiduría ✨" : "Vuelve mañana por más ideas"}
              </p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-sm ${i < rollsLeft ? "bg-[#DFFF23]" : "bg-neutral-100"}`}
                >
                  {i < rollsLeft ? "🎲" : "✗"}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border-2 border-black bg-[#EFE8FF] p-4">
            <p className="font-black text-sm mb-1">💡 Tip</p>
            <p className="text-xs font-semibold text-neutral-600">
              Las variables Épicas y Legendarias son más raras. ¡Mezcla parámetros creativos para mejores combinaciones!
            </p>
          </div>
        </div>

        <BottomNav current="random" />
      </div>
    </Phone>
  );
}
