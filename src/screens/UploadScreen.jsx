import { useState } from "react";
import { motion } from "framer-motion";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { TECHNIQUES, getUserLevel } from "../data/parameters";

export function UploadScreen() {
  const { state, dispatch } = useApp();
  const { profile, currentIdea } = state;
  const [technique, setTechnique] = useState(TECHNIQUES[0].id);
  const [description, setDescription] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [published, setPublished] = useState(false);

  const level = getUserLevel(profile.completedChallenges);
  const canUploadVideo = profile.completedChallenges >= 10;
  const nextVideoUnlock = 10 - profile.completedChallenges;

  const publish = () => {
    setPublished(true);
    setTimeout(() => {
      dispatch({ type: "SET_SCREEN", screen: "feed" });
    }, 2000);
  };

  if (published) {
    return (
      <Phone bg="bg-[#DFFF23]">
        <div className="flex flex-col items-center justify-center h-full px-6 gap-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-8xl"
          >
            🚀
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <h2 className="text-3xl font-black">¡Publicado!</h2>
            <p className="text-sm font-semibold text-neutral-600 mt-2">
              Tu obra ya está en la comunidad InkRush ✨
            </p>
          </motion.div>
        </div>
      </Phone>
    );
  }

  return (
    <Phone>
      <div className="flex flex-col h-full px-5">
        {/* Header */}
        <div className="pt-4 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => dispatch({ type: "SET_SCREEN", screen: "timer" })}
              className="text-sm font-black"
            >
              ← Volver
            </button>
            <span className="text-sm font-black text-[#DFFF23] bg-black px-3 py-1 rounded-full">
              {level.emoji} {level.name}
            </span>
          </div>
          <h2 className="text-2xl font-black">Sube tu resultado 🎨</h2>
          <p className="text-xs font-semibold text-neutral-500 mt-1">
            Comparte tu obra con la comunidad artística
          </p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-4 space-y-4">
          {/* Photo upload */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setHasPhoto(true)}
            className={`w-full rounded-3xl border-4 border-dashed border-black p-8 flex flex-col items-center gap-3 transition-all ${hasPhoto ? "bg-[#D6FFE8] border-solid" : "bg-gradient-to-br from-pink-100 to-cyan-100"}`}
          >
            {hasPhoto ? (
              <>
                <span className="text-5xl">✅</span>
                <p className="font-black">Foto lista</p>
                <p className="text-xs text-neutral-500 font-semibold">Toca para cambiar</p>
              </>
            ) : (
              <>
                <span className="text-5xl">📷</span>
                <p className="font-black">Foto de tu dibujo</p>
                <p className="text-xs text-neutral-500 font-semibold">Toca para agregar</p>
              </>
            )}
          </motion.button>

          {/* Prompt summary */}
          {currentIdea && (
            <div className="rounded-2xl border-2 border-black bg-[#FFFDF3] p-4">
              <p className="text-xs font-black text-neutral-400 mb-1 uppercase tracking-wider">Tu reto</p>
              <p className="font-black text-sm leading-snug">
                {currentIdea.map(v => v.value).join(" + ")}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {currentIdea.map(v => (
                  <span key={v.value} className="text-xs font-black bg-[#DFFF23] border border-black px-2 py-0.5 rounded-full">
                    {v.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Technique */}
          <div>
            <p className="font-black mb-2">Técnica usada</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {TECHNIQUES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTechnique(t.id)}
                  className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-black font-black text-xs transition-all ${technique === t.id ? "sticker-shadow" : ""}`}
                  style={{ backgroundColor: technique === t.id ? t.color : "white" }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="font-black mb-2">Descripción (opcional)</p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Cuéntanos sobre tu proceso creativo..."
              rows={3}
              className="w-full rounded-2xl border-2 border-black bg-white px-4 py-3 font-semibold text-sm resize-none outline-none"
            />
          </div>

          {/* Video */}
          <div>
            <p className="font-black mb-2">Video de proceso (10s)</p>
            {canUploadVideo ? (
              <button className="w-full h-14 rounded-2xl border-2 border-black bg-white font-black flex items-center justify-center gap-2 sticker-shadow">
                🎥 Agregar video
              </button>
            ) : (
              <div className="rounded-2xl border-2 border-black bg-[#F0F0F0] p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="font-black text-sm">Video bloqueado</p>
                    <p className="text-xs font-semibold text-neutral-500">
                      Completa {nextVideoUnlock} reto{nextVideoUnlock !== 1 ? "s" : ""} más para desbloquearlo.
                      ({profile.completedChallenges}/10)
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-2 rounded-full border border-black bg-white">
                  <div
                    className="h-full rounded-full bg-[#DFFF23]"
                    style={{ width: `${(profile.completedChallenges / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Social */}
          <div className="rounded-2xl border-2 border-black bg-[#EFE8FF] p-4">
            <p className="font-black text-sm mb-2">🔗 Compartir en</p>
            <div className="flex gap-2">
              {["Instagram", "TikTok", "Pinterest"].map(s => (
                <button key={s} className="flex-1 py-2 rounded-xl border-2 border-black bg-white text-xs font-black">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Publish */}
        <div className="pb-6 shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            className="w-full h-14 rounded-2xl border-2 border-black bg-[#DFFF23] font-black sticker-shadow-md active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all"
          >
            🚀 Publicar en la comunidad
          </motion.button>
        </div>
      </div>
    </Phone>
  );
}
