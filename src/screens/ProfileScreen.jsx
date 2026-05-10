import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { useApp } from "../data/store";
import { getUserLevel, LEVELS, TECHNIQUES } from "../data/parameters";

function StatCard({ icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-black bg-white p-3 sticker-shadow">
      <span className="text-xl">{icon}</span>
      <span className="font-black text-lg leading-none">{value}</span>
      <span className="text-[10px] font-black text-neutral-400">{label}</span>
    </div>
  );
}

function LevelRoadmap({ current }) {
  return (
    <div className="space-y-2">
      {LEVELS.map(level => {
        const isUnlocked = current.id >= level.id;
        const isCurrent = current.id === level.id;
        return (
          <div
            key={level.id}
            className={`flex items-center gap-3 rounded-2xl border-2 border-black p-3 transition-all ${isCurrent ? "sticker-shadow" : ""}`}
            style={{ backgroundColor: isUnlocked ? level.color : "#F0F0F0", opacity: isUnlocked ? 1 : 0.5 }}
          >
            <span className="text-2xl">{level.emoji}</span>
            <div className="flex-1">
              <p className={`font-black text-sm ${isCurrent ? "" : "text-neutral-400"}`}>{level.name}</p>
              <p className="text-xs font-semibold text-neutral-500">{level.minChallenges}+ retos</p>
            </div>
            {isUnlocked ? (
              <span className="text-xs font-black bg-black text-white px-2 py-0.5 rounded-full">
                {isCurrent ? "Actual" : "✓"}
              </span>
            ) : (
              <span className="text-xs font-black text-neutral-400">🔒</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const TABS = ["Perfil", "Logros", "Estadísticas"];

export function ProfileScreen() {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const level = getUserLevel(profile.completedChallenges);
  const [tab, setTab] = useState("Perfil");
  const [editingSocials, setEditingSocials] = useState(false);
  const [socials, setSocials] = useState(profile.socials);

  const favTechs = TECHNIQUES.filter(t => state.favoriteTechniques.includes(t.id));

  return (
    <Phone>
      <div className="flex flex-col h-full">
        {/* Hero header */}
        <div className="px-5 pt-4 pb-3 bg-gradient-to-b from-[#EFE8FF] to-[#FFFDF3] border-b-2 border-black shrink-0">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-black bg-gradient-to-br from-cyan-200 to-pink-200 flex items-center justify-center text-4xl sticker-shadow-md">
                {profile.avatar}
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-sm font-black"
                style={{ backgroundColor: level.color }}
              >
                {level.emoji}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-black text-xl leading-none">{profile.displayName}</h3>
              <p className="text-xs font-semibold text-neutral-500">@{profile.username}</p>
              <p className="text-xs font-semibold mt-1">{profile.bio}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-black bg-black text-[#DFFF23] px-2 py-0.5 rounded-full">
                  {level.name}
                </span>
                <span className="text-xs font-black text-neutral-400">
                  🔥 {profile.streak} días
                </span>
              </div>
            </div>
          </div>

          {/* Share link */}
          <div className="flex items-center gap-2 mt-3 rounded-xl border-2 border-black bg-white px-3 py-2">
            <span className="text-xs font-black text-neutral-400 flex-1 truncate">
              🔗 {profile.shareLink}
            </span>
            <button className="text-xs font-black bg-[#DFFF23] border border-black px-2 py-1 rounded-lg">
              Copiar
            </button>
          </div>

          {/* Social links */}
          <div className="flex gap-2 mt-3">
            {[
              { key: "instagram", icon: "📸", color: "#FFD6E7" },
              { key: "tiktok", icon: "🎵", color: "#D6F5FF" },
              { key: "pinterest", icon: "📌", color: "#FFE8D6" },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setEditingSocials(true)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border-2 border-black font-black text-xs"
                style={{ backgroundColor: socials[s.key] ? s.color : "white" }}
              >
                {s.icon} {socials[s.key] ? `@${socials[s.key].split(".")[0]}` : "+"}
              </button>
            ))}
          </div>

          {/* Follower stats */}
          <div className="flex justify-around mt-3">
            {[
              { label: "Retos", val: profile.completedChallenges },
              { label: "Seguidores", val: profile.followers > 999 ? `${(profile.followers / 1000).toFixed(1)}K` : profile.followers },
              { label: "Siguiendo", val: profile.following },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="font-black text-lg leading-none">{s.val}</p>
                <p className="text-xs font-semibold text-neutral-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-black shrink-0">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 font-black text-xs border-r-2 border-black last:border-r-0 transition-colors ${tab === t ? "bg-[#DFFF23]" : "bg-white"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 pb-20">
          <AnimatePresence mode="wait">
            {tab === "Perfil" && (
              <motion.div key="perfil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Fav techniques */}
                {favTechs.length > 0 && (
                  <div>
                    <p className="font-black mb-2">Mis técnicas</p>
                    <div className="flex gap-2 flex-wrap">
                      {favTechs.map(t => (
                        <span key={t.id} className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-black font-black text-xs" style={{ backgroundColor: t.color }}>
                          {t.icon} {t.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent works placeholder */}
                <div>
                  <p className="font-black mb-2">Mis obras</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["from-purple-300 to-pink-300", "from-cyan-200 to-blue-300", "from-yellow-200 to-orange-300", "from-green-200 to-teal-300"].map((g, i) => (
                      <div key={i} className={`h-28 rounded-2xl border-2 border-black bg-gradient-to-br ${g} flex items-center justify-center text-3xl sticker-shadow`}>
                        {["🐦‍⬛", "🌙", "🦊", "🔮"][i]}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "Logros" && (
              <motion.div key="logros" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="font-black mb-3">Tu camino de artista</p>
                <LevelRoadmap current={level} />
              </motion.div>
            )}

            {tab === "Estadísticas" && (
              <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <StatCard icon="❤️" label="Likes" value={profile.totalLikes} />
                  <StatCard icon="✨" label="Inspiras" value={profile.totalInspires} />
                  <StatCard icon="🔥" label="Lo intentaré" value={profile.totalTries} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon="⏱️" label="Pomodoros" value={profile.pomodorosCompleted} />
                  <StatCard icon="🎯" label="Retos" value={profile.completedChallenges} />
                </div>

                <div className="mt-4 rounded-2xl border-2 border-black bg-[#DFFF23] p-4 sticker-shadow">
                  <p className="font-black">Impacto en la comunidad</p>
                  <p className="text-xs font-semibold text-neutral-600 mt-1">
                    Has inspirado a {profile.totalInspires} artistas. ¡Sigue así!
                  </p>
                  <div className="mt-2 h-2 rounded-full border border-black bg-white/50">
                    <div className="h-full rounded-full bg-black" style={{ width: "65%" }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <BottomNav current="profile" />
      </div>

      {/* Edit socials modal */}
      <AnimatePresence>
        {editingSocials && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-50 flex items-end"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full bg-[#FFFDF3] rounded-t-3xl border-t-4 border-black p-6"
            >
              <h3 className="font-black text-lg mb-4">Mis redes sociales</h3>
              {[
                { key: "instagram", icon: "📸", label: "Instagram" },
                { key: "tiktok", icon: "🎵", label: "TikTok" },
                { key: "pinterest", icon: "📌", label: "Pinterest" },
              ].map(s => (
                <div key={s.key} className="mb-3">
                  <label className="text-xs font-black mb-1 block">{s.icon} {s.label}</label>
                  <input
                    type="text"
                    value={socials[s.key]}
                    onChange={e => setSocials(prev => ({ ...prev, [s.key]: e.target.value }))}
                    placeholder={`usuario.${s.key.toLowerCase()}`}
                    className="w-full h-12 rounded-xl border-2 border-black bg-white px-4 font-semibold text-sm outline-none"
                  />
                </div>
              ))}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setEditingSocials(false)} className="flex-1 h-12 rounded-xl border-2 border-black bg-white font-black">
                  Cancelar
                </button>
                <button
                  onClick={() => { dispatch({ type: "UPDATE_PROFILE", data: { socials } }); setEditingSocials(false); }}
                  className="flex-1 h-12 rounded-xl border-2 border-black bg-[#DFFF23] font-black sticker-shadow"
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Phone>
  );
}
