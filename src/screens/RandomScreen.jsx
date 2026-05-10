import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { useApp } from "../data/store";
import { PARAM_CATEGORIES, pickVariables } from "../data/parameters";

/* Columna del slot machine */
function SlotColumn({ label, icon, value, rolling, color }) {
  return (
    <div className="flex-1 flex flex-col gap-1">
      <div
        className="h-20 rounded-2xl border-2 border-black overflow-hidden relative flex flex-col items-center justify-center"
        style={{ backgroundColor: color + "40" }}
      >
        <AnimatePresence mode="wait">
          {rolling ? (
            <motion.div key="rolling"
              animate={{ y: [0, -30, 30, -15, 0] }}
              transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
              className="text-2xl"
            >🎲</motion.div>
          ) : value ? (
            <motion.div key={value.value}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              className="px-2 text-center"
            >
              <p className="text-[11px] font-black leading-tight capitalize">{value.value}</p>
            </motion.div>
          ) : (
            <motion.p key="empty" className="text-2xl text-black/20">?</motion.p>
          )}
        </AnimatePresence>
      </div>
      <p className="text-[10px] font-black text-center text-black/50 truncate">
        {icon} {label}
      </p>
    </div>
  );
}

export function RandomScreen() {
  const { state, dispatch } = useApp();
  const { selectedParams, rollsLeft, activeSeason } = state;
  const [rolling, setRolling] = useState(false);
  const [slots, setSlots] = useState([null, null, null]);
  const [shaking, setShaking] = useState(false);

  /* Toggle con FIFO: si ya hay 3 y tocas uno nuevo, reemplaza el primero */
  const toggle = (paramId) => {
    if (selectedParams.includes(paramId)) {
      // Deseleccionar (mínimo 1)
      if (selectedParams.length > 1) {
        dispatch({ type: "SET_PARAMS", params: selectedParams.filter(p => p !== paramId) });
      }
    } else {
      // Añadir: si ya hay 3, quitar el primero (FIFO)
      const next = selectedParams.length >= 3
        ? [...selectedParams.slice(1), paramId]
        : [...selectedParams, paramId];
      dispatch({ type: "SET_PARAMS", params: next });
    }
  };

  const doRoll = () => {
    if (rolling || rollsLeft <= 0 || selectedParams.length === 0) return;
    setRolling(true);
    setShaking(true);

    const results = pickVariables(selectedParams, activeSeason);

    // Revelar progresivamente
    [300, 500, 700].slice(0, selectedParams.length).forEach((t, i) => {
      setTimeout(() => {
        setSlots(prev => { const n = [...prev]; n[i] = results[i]; return n; });
      }, t);
    });

    setTimeout(() => {
      setRolling(false);
      setShaking(false);
      // Guardar idea CON los params usados (evita desfase en IdeaScreen)
      dispatch({ type: "SET_IDEA", idea: results, params: [...selectedParams] });
      dispatch({ type: "SET_SCREEN", screen: "idea" });
    }, 950);
  };

  return (
    <Phone>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 shrink-0">
          <h2 className="text-2xl font-black leading-tight">
            🎰 El <span className="bg-black text-[#DFFF23] px-2 rounded-xl">Randometro</span>
          </h2>
          <p className="text-xs font-semibold text-neutral-500 mt-1">
            Toca para activar · Toca otro para intercambiar
          </p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-20 space-y-4">
          {/* Chips de parámetros */}
          <div className="flex flex-wrap gap-2">
            {PARAM_CATEGORIES.map((cat, idx) => {
              const isSelected = selectedParams.includes(cat.id);
              const slot = selectedParams.indexOf(cat.id); // posición (0,1,2)
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.90 }}
                  onClick={() => toggle(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 border-black font-black text-xs transition-all ${isSelected ? "sticker-shadow" : ""}`}
                  style={{ backgroundColor: isSelected ? cat.color : "white" }}
                >
                  {cat.icon} {cat.label}
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-black text-white text-[9px] flex items-center justify-center">
                      {slot + 1}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Hint de slots */}
          <p className="text-[10px] font-black text-neutral-400">
            {selectedParams.length < 3
              ? `Puedes añadir ${3 - selectedParams.length} más`
              : "Toca uno nuevo para intercambiar el primero seleccionado"}
          </p>

          {/* Máquina */}
          <motion.div
            animate={shaking ? { x: [-4,4,-4,4,-2,2,0], y: [0,-2,2,-2,2,0] } : {}}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border-4 border-black bg-gradient-to-br from-pink-200 via-[#DFFF23] to-cyan-200 p-4 sticker-shadow-xl"
          >
            {/* Barra de título */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                {["bg-red-400","bg-yellow-400","bg-green-400"].map(c => (
                  <div key={c} className={`w-2.5 h-2.5 rounded-full ${c} border border-black`} />
                ))}
              </div>
              <span className="text-[10px] font-black bg-black text-[#DFFF23] px-2 py-0.5 rounded-full tracking-widest">
                RANDOMETRO 3000
              </span>
            </div>

            {/* Slots */}
            <div className="flex gap-2 mb-3">
              {[0,1,2].map(i => {
                const cat = PARAM_CATEGORIES.find(c => c.id === selectedParams[i]);
                return (
                  <SlotColumn
                    key={i}
                    label={cat?.label ?? "—"}
                    icon={cat?.icon ?? ""}
                    color={cat?.color ?? "#E8E8E8"}
                    value={selectedParams[i] ? slots[i] : null}
                    rolling={rolling && !!selectedParams[i]}
                  />
                );
              })}
            </div>

            {/* Botón randomizar */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={doRoll}
              disabled={rolling || rollsLeft <= 0}
              className="w-full h-14 rounded-2xl border-2 border-black bg-black text-[#DFFF23] font-black text-base sticker-shadow disabled:opacity-50"
            >
              {rolling ? "🎲 Mezclando..." : rollsLeft > 0 ? "🎲 ¡RANDOMIZAR!" : "Sin intentos hoy"}
            </motion.button>
          </motion.div>

          {/* Contador de intentos */}
          <div className="flex items-center justify-between rounded-2xl border-2 border-black bg-white px-4 py-3">
            <div>
              <p className="font-black text-sm">Intentos restantes</p>
              <p className="text-xs font-semibold text-neutral-400">
                {rollsLeft > 0 ? "Úsalos con sabiduría ✨" : "Vuelve mañana"}
              </p>
            </div>
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <div key={i}
                  className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-sm ${i < rollsLeft ? "bg-[#DFFF23]" : "bg-neutral-100 text-neutral-300"}`}
                >
                  {i < rollsLeft ? "🎲" : "×"}
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="rounded-2xl border-2 border-black bg-[#EFE8FF] px-4 py-3">
            <p className="font-black text-xs">
              💡 Las variables Épicas y Legendarias tienen menor probabilidad. ¡Mezcla bien!
            </p>
          </div>
        </div>

        <BottomNav current="random" />
      </div>
    </Phone>
  );
}
