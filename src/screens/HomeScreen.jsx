import { motion } from "framer-motion";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { useApp } from "../data/store";
import { getUserLevel, SAMPLE_POSTS, RARITY_COLORS } from "../data/parameters";

function DoodleBackground() {
  const doodles = ["✦", "○", "△", "◇", "★", "☆", "◉", "▲"];
  return (
    <>
      {doodles.map((d, i) => (
        <span
          key={i}
          className="absolute text-black/5 font-black select-none pointer-events-none"
          style={{
            fontSize: `${20 + (i * 8)}px`,
            top: `${10 + i * 11}%`,
            left: i % 2 === 0 ? `${5 + i * 8}%` : undefined,
            right: i % 2 !== 0 ? `${5 + i * 5}%` : undefined,
            animation: `float${(i % 2) + 1} ${4 + i * 0.5}s ease-in-out infinite`,
          }}
        >
          {d}
        </span>
      ))}
    </>
  );
}

export function HomeScreen() {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const level = getUserLevel(profile.completedChallenges);

  return (
    <Phone>
      <div className="relative flex flex-col h-full overflow-hidden">
        <DoodleBackground />

        {/* Header */}
        <div className="px-5 pt-3 pb-2 shrink-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-neutral-400">Hola de nuevo 👋</p>
              <h1 className="text-2xl font-black leading-none">
                Ink<span className="bg-black text-[#DFFF23] px-1.5 rounded-lg">Rush</span>
              </h1>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => dispatch({ type: "SET_SCREEN", screen: "profile" })}
              className="w-12 h-12 rounded-full border-2 border-black bg-gradient-to-br from-cyan-200 to-pink-200 flex items-center justify-center text-2xl sticker-shadow"
            >
              {profile.avatar}
            </motion.button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-20 z-10">
          {/* Level card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 border-black p-4 mb-4 relative overflow-hidden sticker-shadow"
            style={{ backgroundColor: level.color }}
          >
            <div className="absolute top-2 right-4 text-5xl opacity-20 float-1">{level.emoji}</div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{level.emoji}</span>
              <div>
                <p className="font-black text-sm">{level.name}</p>
                <p className="text-xs font-semibold text-neutral-600">
                  {profile.completedChallenges} retos completados · Racha de {profile.streak} días 🔥
                </p>
              </div>
            </div>
            {/* Progress to next level */}
            {level.id < 5 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs font-black mb-1">
                  <span>Nivel {level.id}</span>
                  <span>Nivel {level.id + 1}</span>
                </div>
                <div className="h-2 rounded-full border border-black bg-white/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (profile.completedChallenges / (level.id * 10)) * 100)}%` }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="h-full rounded-full bg-black"
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Main CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full rounded-3xl border-2 border-black bg-[#DFFF23] p-5 mb-4 sticker-shadow-lg relative overflow-hidden"
          >
            <div className="text-left">
              <div className="text-3xl mb-2">🎰</div>
              <h3 className="text-xl font-black leading-tight">¡Genera tu reto de hoy!</h3>
              <p className="text-xs font-semibold text-neutral-600 mt-1">
                Tienes {state.rollsLeft} intento{state.rollsLeft !== 1 ? "s" : ""} disponible{state.rollsLeft !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="absolute bottom-0 right-0 text-8xl opacity-10 translate-x-4 translate-y-4">🎨</div>
          </motion.button>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-3 mb-4"
          >
            {[
              { icon: "❤️", label: "Likes", val: profile.totalLikes },
              { icon: "✨", label: "Inspiras", val: profile.totalInspires },
              { icon: "🔥", label: "Lo intentaré", val: profile.totalTries },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border-2 border-black bg-white p-3 text-center sticker-shadow">
                <div className="text-xl">{stat.icon}</div>
                <div className="font-black text-lg">{stat.val}</div>
                <div className="text-[10px] font-black text-neutral-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Recent from feed */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black">En la comunidad</h3>
              <button
                onClick={() => dispatch({ type: "SET_SCREEN", screen: "feed" })}
                className="text-xs font-black underline"
              >
                Ver todo
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {SAMPLE_POSTS.slice(0, 3).map(post => (
                <motion.div
                  key={post.id}
                  whileTap={{ scale: 0.97 }}
                  className="min-w-[140px] rounded-2xl border-2 border-black overflow-hidden sticker-shadow shrink-0"
                >
                  <div className={`h-24 bg-gradient-to-br ${post.gradient} flex items-center justify-center text-4xl`}>
                    {post.avatar}
                  </div>
                  <div className="bg-white p-2">
                    <p className="text-xs font-black truncate">{post.username}</p>
                    <p className="text-[10px] text-neutral-400 font-semibold">{post.technique}</p>
                    <div className="flex gap-2 mt-1 text-[10px] font-black">
                      <span>❤️ {post.likes}</span>
                      <span>✨ {post.inspires}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Season banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl border-2 border-black bg-gradient-to-r from-[#D6FFE8] to-[#D6F5FF] p-4 sticker-shadow"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌸</span>
              <div>
                <p className="font-black text-sm">Temporada {state.activeSeason}</p>
                <p className="text-xs font-semibold text-neutral-600">
                  Variables especiales de primavera activas. ¡Consigue combinaciones únicas!
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <BottomNav current="home" />
      </div>
    </Phone>
  );
}
