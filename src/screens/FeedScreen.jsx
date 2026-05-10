import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { RarityBadge } from "../components/RarityBadge";
import { fetchArtworks, addReaction } from "../utils/api";
import { SAMPLE_POSTS } from "../data/parameters";

function ReactionBtn({ icon, count, active, color, onTap }) {
  const [popped, setPopped] = useState(false);
  const tap = () => { setPopped(true); onTap(); setTimeout(() => setPopped(false), 380); };
  return (
    <motion.button whileTap={{ scale:0.85 }} onClick={tap}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-black font-black text-xs relative overflow-hidden transition-all ${active?"sticker-shadow":""}`}
      style={{ backgroundColor: active ? color : "white" }}
    >
      <AnimatePresence>
        {popped && (
          <motion.span key="pop" className="absolute -top-6 pointer-events-none text-base"
            initial={{ y:0, opacity:1 }} animate={{ y:-18, opacity:0 }} exit={{}} transition={{ duration:0.35 }}>
            {icon}
          </motion.span>
        )}
      </AnimatePresence>
      {icon} {count}
    </motion.button>
  );
}

function ArtCard({ post }) {
  const [likes,    setLikes]    = useState(post.likes ?? post.meta?.likes ?? 0);
  const [inspires, setInspires] = useState(post.inspires ?? post.meta?.inspires ?? 0);
  const [tries,    setTries]    = useState(post.tries ?? post.meta?.tries ?? 0);
  const [reacted,  setReacted]  = useState({ like:false, inspire:false, try:false });

  const react = (type) => {
    if (post.id) addReaction(post.id, type).catch(() => {});
    const map = { like: [setLikes, "like"], inspire: [setInspires, "inspire"], try: [setTries, "try"] };
    const [setter] = map[type];
    const was = reacted[type];
    setter(n => was ? n-1 : n+1);
    setReacted(r => ({ ...r, [type]: !was }));
  };

  const tags    = post.variables ?? post.tags ?? [];
  const avatar  = post.avatar ?? "🎨";
  const user    = post.username ?? post.user ?? "Artista";
  const tech    = post.technique ?? "—";
  const dur     = post.duration ?? "";
  const rarity  = post.rarity ?? "Común";
  const prompt  = post.prompt ?? tags.join(" + ");
  const grad    = post.gradient ?? "from-purple-300 via-pink-300 to-slate-600";

  return (
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
      className="rounded-3xl border-2 border-black bg-white overflow-hidden sticker-shadow-md mb-4"
    >
      <div className="p-3.5 pb-0 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-black bg-gradient-to-br from-cyan-200 to-pink-200 flex items-center justify-center text-xl shrink-0">
          {avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm truncate">{user}</p>
          <p className="text-xs text-neutral-400 font-semibold">{tech}{dur ? ` · ${dur}` : ""}</p>
        </div>
        <RarityBadge rarity={rarity} size="sm" />
      </div>

      <div className="flex gap-1.5 px-3.5 pt-2 flex-wrap">
        {tags.map(t => (
          <span key={t} className="text-[10px] font-black bg-[#DFFF23] border border-black px-2 py-0.5 rounded-full capitalize">
            {t}
          </span>
        ))}
      </div>

      <div className={`relative mt-2 h-56 bg-gradient-to-br ${grad} flex items-center justify-center`}>
        <span className="text-9xl drop-shadow-xl opacity-80 float-1">{avatar}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {prompt && (
          <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <p className="text-xs font-black text-white leading-snug line-clamp-2">{prompt}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 p-3">
        <ReactionBtn icon="❤️" count={likes}    active={reacted.like}    color="#FFD6E7" onTap={() => react("like")} />
        <ReactionBtn icon="✨" count={inspires} active={reacted.inspire} color="#EFE8FF" onTap={() => react("inspire")} />
        <ReactionBtn icon="🔥" count={tries}    active={reacted.try}     color="#FFE8D6" onTap={() => react("try")} />
      </div>
    </motion.div>
  );
}

const FILTERS = ["Para ti", "Siguiendo", "Legendarios", "🌸 Temporada"];

export function FeedScreen() {
  const [filter, setFilter]   = useState("Para ti");
  const [posts, setPosts]     = useState(SAMPLE_POSTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchArtworks()
      .then(data => { if (data?.artworks?.length) setPosts(data.artworks); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Phone>
      <div className="flex flex-col h-full">
        <div className="px-5 pt-4 pb-2 shrink-0">
          <h2 className="text-2xl font-black">Feed ✦</h2>
          <div className="flex gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-1">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`shrink-0 px-3 py-1.5 rounded-full border-2 border-black font-black text-xs transition-all ${filter===f ? "bg-black text-[#DFFF23] sticker-shadow" : "bg-white"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-20 pt-2">
          {loading && (
            <div className="flex justify-center py-10 text-2xl">
              <span className="spin-slow inline-block">⟳</span>
            </div>
          )}
          {!loading && posts.map(p => <ArtCard key={p.id} post={p} />)}
        </div>

        <BottomNav current="feed" />
      </div>
    </Phone>
  );
}
