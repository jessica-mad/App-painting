import { useState } from "react";
import { motion } from "framer-motion";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { TECHNIQUES, getUserLevel } from "../data/parameters";
import { createArtwork, IS_LOGGED_IN } from "../utils/api";

export function UploadScreen() {
  const { state, dispatch } = useApp();
  const { profile, currentIdea } = state;
  const [technique, setTechnique] = useState(TECHNIQUES[0].id);
  const [description, setDescription] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const level = getUserLevel(profile.completedChallenges);
  const canVideo = profile.completedChallenges >= 10;
  const videoMissing = 10 - profile.completedChallenges;

  const publish = async () => {
    setSaving(true);
    try {
      if (IS_LOGGED_IN && currentIdea) {
        await createArtwork({
          prompt:      currentIdea.variables.map(v => v.value).join(" + "),
          variables:   currentIdea.variables.map(v => v.value),
          params:      currentIdea.params,
          rarity:      currentIdea.variables[0]?.rarity ?? "Común",
          technique:   TECHNIQUES.find(t => t.id === technique)?.label ?? technique,
          description,
        });
      }
      setDone(true);
      setTimeout(() => dispatch({ type: "SET_SCREEN", screen: "feed" }), 1800);
    } catch {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Phone bg="bg-[#DFFF23]">
        <div className="flex flex-col items-center justify-center h-full px-6 gap-5">
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
            transition={{ type:"spring", stiffness:260, damping:18 }} className="text-8xl">🚀</motion.div>
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} className="text-center">
            <h2 className="text-3xl font-black">¡Publicado!</h2>
            <p className="text-sm font-semibold text-neutral-600 mt-2">Tu obra ya está en la comunidad InkRush ✨</p>
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
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => dispatch({ type:"SET_SCREEN", screen:"timer" })}
              className="text-sm font-black">← Volver</button>
            <span className="text-xs font-black bg-black text-[#DFFF23] px-3 py-1 rounded-full">
              {level.emoji} {level.name}
            </span>
          </div>
          <h2 className="text-2xl font-black">Sube tu resultado 🎨</h2>
          <p className="text-xs font-semibold text-neutral-500 mt-0.5">Comparte tu obra con la comunidad</p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-4 space-y-4">
          {/* Foto */}
          <motion.button whileTap={{ scale:0.98 }} onClick={() => setHasPhoto(true)}
            className={`w-full rounded-3xl border-4 border-dashed border-black py-8 flex flex-col items-center gap-2.5 transition-all ${hasPhoto ? "bg-[#D6FFE8] border-solid" : "bg-gradient-to-br from-pink-100 to-cyan-100"}`}
          >
            <span className="text-5xl">{hasPhoto ? "✅" : "📷"}</span>
            <p className="font-black text-sm">{hasPhoto ? "Foto lista · toca para cambiar" : "Toca para añadir foto"}</p>
          </motion.button>

          {/* Prompt */}
          {currentIdea && (
            <div className="rounded-2xl border-2 border-black bg-[#FFFDF3] p-4">
              <p className="text-[10px] font-black text-neutral-400 mb-1.5 uppercase tracking-wider">Reto completado</p>
              <div className="flex flex-wrap gap-1">
                {currentIdea.variables.map(v => (
                  <span key={v.value} className="text-xs font-black bg-[#DFFF23] border border-black px-2 py-0.5 rounded-full capitalize">
                    {v.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Técnica */}
          <div>
            <p className="font-black text-sm mb-2">Técnica usada</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {TECHNIQUES.map(t => (
                <button key={t.id} onClick={() => setTechnique(t.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-black font-black text-xs transition-all ${technique===t.id ? "sticker-shadow" : ""}`}
                  style={{ backgroundColor: technique===t.id ? t.color : "white" }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <p className="font-black text-sm mb-2">Descripción <span className="text-neutral-400 font-semibold">(opcional)</span></p>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Cuéntanos sobre tu proceso creativo..."
              rows={3}
              className="w-full rounded-2xl border-2 border-black bg-white px-4 py-3 font-semibold text-sm resize-none outline-none"
            />
          </div>

          {/* Video */}
          <div>
            <p className="font-black text-sm mb-2">Video de proceso (10s)</p>
            {canVideo ? (
              <button className="w-full h-12 rounded-2xl border-2 border-black bg-white font-black text-sm flex items-center justify-center gap-2 sticker-shadow">
                🎥 Añadir video
              </button>
            ) : (
              <div className="rounded-2xl border-2 border-black bg-neutral-100 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="font-black text-sm">Video bloqueado</p>
                    <p className="text-xs font-semibold text-neutral-500">
                      Faltan {videoMissing} reto{videoMissing!==1?"s":""} para desbloquearlo
                    </p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full border border-black bg-white">
                  <div className="h-full rounded-full bg-[#DFFF23]"
                    style={{ width:`${(profile.completedChallenges/10)*100}%` }} />
                </div>
                <p className="text-[10px] font-black text-neutral-400 mt-1">
                  {profile.completedChallenges}/10 retos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Publicar */}
        <div className="pb-5 shrink-0">
          <motion.button whileTap={{ scale:0.97 }} onClick={publish}
            disabled={saving}
            className="w-full h-13 py-3 rounded-2xl border-2 border-black bg-[#DFFF23] font-black sticker-shadow-md active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all disabled:opacity-60"
          >
            {saving ? "Publicando..." : "🚀 Publicar en la comunidad"}
          </motion.button>
        </div>
      </div>
    </Phone>
  );
}
