import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";

function CircularProgress({ progress, size = 240, strokeWidth = 16, color = "#DFFF23" }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  return (
    <svg width={size} height={size} className="absolute inset-0">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#E8E8E8" strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring__circle"
        style={{ transformOrigin: "50% 50%", transform: "rotate(-90deg)" }}
      />
    </svg>
  );
}

function Particle({ delay }) {
  const emojis = ["✦", "○", "◇", "★", "△"];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  return (
    <motion.span
      className="absolute text-black/10 text-xl font-black pointer-events-none select-none"
      style={{
        left: `${10 + Math.random() * 80}%`,
        top: `${10 + Math.random() * 80}%`,
      }}
      animate={{
        y: [0, -30, 0],
        opacity: [0.1, 0.4, 0.1],
        rotate: [0, 15, -15, 0],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay: delay,
      }}
    >
      {emoji}
    </motion.span>
  );
}

export function TimerScreen() {
  const { state, dispatch } = useApp();
  const { timerConfig } = state;

  if (!timerConfig) {
    dispatch({ type: "SET_SCREEN", screen: "setupTimer" });
    return null;
  }

  const isFree = timerConfig.duration.seconds === null;
  const [seconds, setSeconds] = useState(isFree ? 0 : timerConfig.duration.seconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [musicOn, setMusicOn] = useState(timerConfig.musicOn);
  const totalSeconds = timerConfig.duration.seconds || 1;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds(s => {
        if (!isFree && s <= 1) {
          clearInterval(id);
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return isFree ? s + 1 : s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, isFree]);

  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  const progress = isFree ? 0 : 1 - seconds / totalSeconds;

  const reset = () => {
    setSeconds(isFree ? 0 : timerConfig.duration.seconds);
    setRunning(false);
    setFinished(false);
  };

  const finish = () => {
    dispatch({ type: "COMPLETE_CHALLENGE" });
  };

  if (finished) {
    return (
      <Phone bg="bg-[#DFFF23]">
        <div className="flex flex-col items-center justify-center h-full px-6">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
            className="text-8xl mb-6"
          >
            🎉
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black text-center mb-2"
          >
            ¡Reto completado!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-semibold text-center text-neutral-700 mb-8"
          >
            Increíble trabajo artista 🎨<br />
            Ahora sube tu resultado a la comunidad.
          </motion.p>
          {/* Confetti particles */}
          {["🎨","✦","🌟","○","★"].map((e, i) => (
            <motion.span
              key={i}
              className="absolute text-3xl pointer-events-none"
              style={{ left: `${15 + i * 18}%`, top: "10%" }}
              animate={{ y: [0, 200], opacity: [1, 0], rotate: [0, 360] }}
              transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
            >
              {e}
            </motion.span>
          ))}
          <motion.button
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={finish}
            className="w-full h-14 rounded-2xl border-2 border-black bg-black text-[#DFFF23] font-black sticker-shadow-md"
          >
            📤 Subir mi dibujo
          </motion.button>
        </div>
      </Phone>
    );
  }

  return (
    <Phone bg="bg-[#111111]">
      <div className="flex flex-col h-full relative">
        {/* Particles */}
        {Array.from({ length: 6 }).map((_, i) => <Particle key={i} delay={i * 0.5} />)}

        {/* Music card */}
        <div className="mx-5 mt-4 rounded-2xl border-2 border-white/20 bg-white/10 p-3 flex items-center gap-3 shrink-0 z-10">
          <span className="text-2xl">{timerConfig.music.icon}</span>
          <div className="flex-1">
            <p className="font-black text-white text-sm">{timerConfig.music.title}</p>
            <p className="text-xs text-white/50">{musicOn ? "reproduciendo · ∞ loop" : "en pausa"}</p>
          </div>
          {/* Sound bars */}
          {musicOn && (
            <div className="flex gap-0.5 items-end h-5">
              {[3,5,7,4,6].map((h, i) => (
                <div key={i} className="w-1 bg-[#DFFF23] rounded-full"
                  style={{ height: `${h}px`, animation: `float${i % 2 + 1} ${0.4 + i * 0.08}s ease-in-out infinite` }}
                />
              ))}
            </div>
          )}
          <button onClick={() => setMusicOn(m => !m)} className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white text-sm">
            {musicOn ? "⏸" : "▶"}
          </button>
        </div>

        {/* Timer circle */}
        <div className="flex-1 flex flex-col items-center justify-center z-10">
          <div className="relative w-60 h-60 flex items-center justify-center">
            <CircularProgress progress={progress} size={240} />
            {/* Inner glow */}
            <div className="w-48 h-48 rounded-full border-4 border-white/10 flex flex-col items-center justify-center bg-white/5 countdown-pulse">
              <p className="text-5xl font-black text-white">{min}:{sec}</p>
              <p className="text-xs font-black text-white/50 mt-1">
                {running ? (isFree ? "creando..." : "pomodoro activo") : "listo para iniciar"}
              </p>
              {!isFree && (
                <p className="text-xs font-black text-[#DFFF23] mt-1">
                  {Math.round(progress * 100)}% completado
                </p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mt-8">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setRunning(r => !r)}
              className="w-20 h-20 rounded-full border-4 border-[#DFFF23] bg-[#DFFF23] text-black flex items-center justify-center text-3xl sticker-shadow-lg"
            >
              {running ? "⏸" : "▶"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={reset}
              className="w-16 h-16 rounded-full border-2 border-white/30 bg-white/10 text-white flex items-center justify-center text-2xl self-center"
            >
              ↺
            </motion.button>
          </div>
        </div>

        {/* Bottom */}
        <div className="px-5 pb-6 shrink-0 z-10">
          <div className="flex items-center gap-2 mb-4 rounded-2xl border border-white/10 bg-white/5 p-3">
            <span className="text-lg">{timerConfig.music.icon}</span>
            <p className="text-xs font-semibold text-white/60">
              {timerConfig.duration.label === "Tiempo libre" ? "Sesión libre" : `Sesión de ${timerConfig.duration.label}`}
              {" · "}Modo pomodoro
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={finish}
            className="w-full h-12 rounded-2xl border-2 border-white/30 bg-white/10 text-white font-black"
          >
            Finalizar y subir dibujo →
          </motion.button>
        </div>
      </div>
    </Phone>
  );
}
