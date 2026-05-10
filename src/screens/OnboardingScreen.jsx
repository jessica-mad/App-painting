import { useState } from "react";
import { motion } from "framer-motion";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { TECHNIQUES } from "../data/parameters";

export function OnboardingScreen() {
  const { dispatch } = useApp();
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    if (selected.includes(id)) setSelected(s => s.filter(x => x !== id));
    else if (selected.length < 3) setSelected(s => [...s, id]);
  };

  const confirm = () => {
    if (selected.length < 1) return;
    dispatch({ type: "SET_TECHNIQUES", techniques: selected });
  };

  return (
    <Phone>
      <div className="flex flex-col h-full px-5">
        {/* Header */}
        <div className="pt-4 pb-3">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#DFFF23] px-3 py-1 text-xs font-black">
            Paso 1 de 1
          </div>
          <h2 className="text-2xl font-black mt-3 leading-tight">
            Elige tus{" "}
            <span className="bg-black text-[#DFFF23] px-2 rounded-xl">3 técnicas</span>{" "}
            favoritas
          </h2>
          <p className="text-xs font-semibold text-neutral-500 mt-1">
            Esto personaliza tu experiencia. Puedes cambiarlas luego.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3 flex-1">
          {TECHNIQUES.map((tech, i) => {
            const isSelected = selected.includes(tech.id);
            const isDisabled = !isSelected && selected.length >= 3;
            return (
              <motion.button
                key={tech.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => toggle(tech.id)}
                disabled={isDisabled}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-black p-3 font-black text-xs transition-all
                  ${isSelected ? "sticker-shadow-md" : "sticker-shadow"}
                  ${isDisabled ? "opacity-40" : ""}
                `}
                style={{
                  backgroundColor: isSelected ? tech.color : "white",
                  outline: isSelected ? "3px solid #DFFF23" : "none",
                  outlineOffset: "2px",
                }}
                animate={isSelected ? { scale: [1, 1.06, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center text-2xl"
                  style={{ backgroundColor: tech.color }}
                >
                  {tech.icon}
                </div>
                <span>{tech.label}</span>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full border-2 border-black bg-[#DFFF23] flex items-center justify-center text-[10px]"
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Counter + CTA */}
        <div className="pt-4 pb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="font-black text-sm">
              {selected.length}/3 seleccionadas
            </span>
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className={`w-8 h-2 rounded-full border border-black ${i < selected.length ? "bg-black" : "bg-neutral-200"}`} />
              ))}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={confirm}
            disabled={selected.length < 1}
            className="w-full h-14 rounded-2xl border-2 border-black bg-[#DFFF23] font-black sticker-shadow-md active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all disabled:opacity-40"
          >
            {selected.length < 1 ? "Selecciona al menos 1" : "¡Comenzar a crear! 🎨"}
          </motion.button>
        </div>
      </div>
    </Phone>
  );
}
