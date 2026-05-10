import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";

const SLIDES = [
  {
    emoji: "🎨",
    bg: "from-[#DFFF23] to-[#FFD6E7]",
    title: "Bienvenido a InkRush",
    desc: "La app para artistas e ilustradores que quieren crear más. Cada día, un reto nuevo generado aleatoriamente para despertar tu creatividad.",
    doodles: ["✦", "○", "△"],
  },
  {
    emoji: "🎰",
    bg: "from-[#EFE8FF] to-[#D6F5FF]",
    title: "El Randometro",
    desc: "Combina hasta 3 parámetros (emociones, personajes, lugares...) y genera una idea artística única. Tienes 3 intentos por día.",
    doodles: ["★", "◇", "☆"],
  },
  {
    emoji: "⏱️",
    bg: "from-[#FFD6E7] to-[#FFF3D6]",
    title: "Modo Pomodoro",
    desc: "Elige tu tiempo de sesión: 10, 15, 30 minutos o tiempo libre. Trabaja con música ambiente y mantén tu racha creativa.",
    doodles: ["▲", "●", "■"],
  },
  {
    emoji: "✨",
    bg: "from-[#D6FFE8] to-[#D6F5FF]",
    title: "Rareza de Ideas",
    desc: "Las variables tienen rareza: Común, Raro, Épico y Legendario. Las temporadas activan parámetros exclusivos. ¿Puedes conseguir una idea Legendaria?",
    doodles: ["🌟", "💫", "⚡"],
  },
  {
    emoji: "🌍",
    bg: "from-[#FFF3D6] to-[#EFE8FF]",
    title: "Comunidad de Artistas",
    desc: "Sube tus dibujos, reacciona con ❤️ ✨ 🔥, inspira y sé inspirado. Sube de nivel completando retos y desbloquea funciones exclusivas.",
    doodles: ["♡", "☁", "◆"],
  },
];

export function TutorialScreen() {
  const [slide, setSlide] = useState(0);
  const { dispatch } = useApp();
  const current = SLIDES[slide];

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1);
    else dispatch({ type: "SET_SCREEN", screen: "login" });
  };

  const skip = () => dispatch({ type: "SET_SCREEN", screen: "login" });

  return (
    <Phone>
      <div className="flex flex-col h-full">
        {/* Skip */}
        <div className="flex justify-end px-6 pt-2">
          <button onClick={skip} className="text-xs font-black text-neutral-400 underline">
            Saltar
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="flex flex-col flex-1"
          >
            {/* Hero area */}
            <div className={`mx-6 mt-4 rounded-3xl border-2 border-black bg-gradient-to-br ${current.bg} p-8 relative overflow-hidden`}
              style={{ minHeight: 260 }}>
              {/* Floating doodles */}
              {current.doodles.map((d, i) => (
                <span
                  key={i}
                  className="absolute text-black/20 font-black text-4xl select-none"
                  style={{
                    top: `${15 + i * 25}%`,
                    right: `${8 + i * 12}%`,
                    animation: `float${(i % 2) + 1} ${4 + i}s ease-in-out infinite`,
                  }}
                >
                  {d}
                </span>
              ))}
              <div className="text-7xl mb-4 text-center wiggle inline-block w-full">
                {current.emoji}
              </div>
              <div className="w-16 h-1 bg-black/20 rounded-full mx-auto" />
            </div>

            {/* Text */}
            <div className="px-6 pt-6 flex-1">
              <h2 className="text-2xl font-black leading-tight mb-3">{current.title}</h2>
              <p className="text-sm font-semibold text-neutral-600 leading-relaxed">
                {current.desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex justify-center gap-2 pb-4">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-2 rounded-full border border-black transition-all ${i === slide ? "w-6 bg-black" : "w-2 bg-neutral-300"}`}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={next}
            className="w-full h-14 rounded-2xl border-2 border-black bg-[#DFFF23] font-black text-base sticker-shadow-md active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all"
          >
            {slide < SLIDES.length - 1 ? "Siguiente →" : "¡Empezar!"}
          </motion.button>
        </div>
      </div>
    </Phone>
  );
}
