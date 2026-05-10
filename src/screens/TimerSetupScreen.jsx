import { useState } from "react";
import { motion } from "framer-motion";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { DURATIONS, MUSIC_TRACKS } from "../data/parameters";

export function TimerSetupScreen() {
  const { dispatch } = useApp();
  const [duration, setDuration] = useState(DURATIONS[2]);
  const [music, setMusic] = useState(MUSIC_TRACKS[0]);
  const [musicOn, setMusicOn] = useState(true);

  const start = () => {
    dispatch({
      type: "SET_TIMER_CONFIG",
      config: { duration, music, musicOn },
    });
    dispatch({ type: "SET_SCREEN", screen: "timer" });
  };

  return (
    <Phone>
      <div className="flex flex-col h-full px-5">
        {/* Header */}
        <div className="pt-4 pb-3 shrink-0">
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "idea" })}
            className="text-sm font-black mb-3 block"
          >
            ← Volver
          </button>
          <h2 className="text-2xl font-black">Prepara tu sesión 🎨</h2>
          <p className="text-xs font-semibold text-neutral-500 mt-1">
            Elige tu tiempo y ambiente musical
          </p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
          {/* Duration */}
          <div className="mb-5">
            <p className="font-black mb-3">⏱️ Duración del reto</p>
            <div className="grid grid-cols-2 gap-3">
              {DURATIONS.map(d => (
                <motion.button
                  key={d.label}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDuration(d)}
                  className={`h-20 rounded-2xl border-2 border-black flex flex-col items-center justify-center gap-1 font-black transition-all
                    ${duration.label === d.label ? "bg-[#DFFF23] sticker-shadow-md" : "bg-white sticker-shadow"}`}
                >
                  <span className="text-2xl">{d.emoji}</span>
                  <span className="text-sm">{d.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Music */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-black">🎵 Música ambiente</p>
                <p className="text-xs font-semibold text-neutral-500">Loop infinito para concentrarse</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMusicOn(m => !m)}
                className={`w-14 h-7 rounded-full border-2 border-black relative transition-colors ${musicOn ? "bg-[#DFFF23]" : "bg-neutral-200"}`}
              >
                <motion.div
                  animate={{ x: musicOn ? 28 : 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute top-0.5 w-5 h-5 rounded-full border-2 border-black bg-white"
                />
              </motion.button>
            </div>

            {/* Now playing indicator */}
            {musicOn && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-2xl border-2 border-black bg-black text-white p-3 mb-3"
              >
                <span className="text-2xl">{music.icon}</span>
                <div className="flex-1">
                  <p className="font-black text-sm">{music.title}</p>
                  <p className="text-xs text-white/60">{music.mood}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4].map(b => (
                    <div key={b} className="w-1 rounded-full bg-[#DFFF23]"
                      style={{ height: `${8 + Math.random() * 12}px`, animation: `float${b % 2 + 1} ${0.5 + b * 0.1}s ease-in-out infinite` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {MUSIC_TRACKS.map(track => (
                <motion.button
                  key={track.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setMusic(track); setMusicOn(true); }}
                  className={`min-w-[130px] rounded-3xl border-2 border-black p-4 text-left transition-all
                    ${music.id === track.id ? "sticker-shadow-md" : "sticker-shadow"}
                  `}
                  style={{
                    backgroundColor: music.id === track.id ? "#DFFF23" : "white",
                    outline: music.id === track.id ? "3px solid #111" : "none",
                    outlineOffset: "2px",
                  }}
                >
                  <div className="text-3xl mb-2">{track.icon}</div>
                  <div className="text-xs font-black leading-tight">{track.title}</div>
                  <div className="text-[10px] font-semibold text-neutral-500 mt-0.5">{track.mood}</div>
                  <div className="mt-2 rounded-full bg-black px-2 py-0.5 text-center text-[9px] font-black text-white">
                    ∞ LOOP
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pb-6 shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={start}
            className="w-full h-14 rounded-2xl border-2 border-black bg-[#DFFF23] font-black sticker-shadow-md active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all"
          >
            🚀 ¡Iniciar sesión creativa!
          </motion.button>
        </div>
      </div>
    </Phone>
  );
}
