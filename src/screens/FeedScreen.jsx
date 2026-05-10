import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { RarityBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { SAMPLE_POSTS } from "../data/parameters";

function ReactionButton({ icon, count, onClick, active, color }) {
  const [popped, setPopped] = useState(false);

  const tap = () => {
    setPopped(true);
    onClick();
    setTimeout(() => setPopped(false), 400);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={tap}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-black font-black text-xs relative overflow-hidden transition-all ${active ? "sticker-shadow" : ""}`}
      style={{ backgroundColor: active ? color : "white" }}
    >
      <AnimatePresence>
        {popped && (
          <motion.span
            key="pop"
            className="absolute -top-6 text-lg pointer-events-none"
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -20, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {icon}
          </motion.span>
        )}
      </AnimatePresence>
      {icon} {count}
    </motion.button>
  );
}

function ArtCard({ post }) {
  const [likes, setLikes] = useState(post.likes);
  const [inspires, setInspires] = useState(post.inspires);
  const [tries, setTries] = useState(post.tries);
  const [reacted, setReacted] = useState({ like: false, inspire: false, try: false });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border-2 border-black bg-white overflow-hidden sticker-shadow-md mb-5"
    >
      {/* User header */}
      <div className="p-4 pb-0 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-black bg-gradient-to-br from-cyan-200 to-pink-200 flex items-center justify-center text-xl">
          {post.avatar}
        </div>
        <div className="flex-1">
          <p className="font-black text-sm">{post.username}</p>
          <p className="text-xs text-neutral-400 font-semibold">{post.technique} · {post.duration}</p>
        </div>
        <RarityBadge rarity={post.rarity} size="sm" />
      </div>

      {/* Tags */}
      <div className="flex gap-2 px-4 py-2 flex-wrap">
        {post.variables.map(v => (
          <span key={v} className="text-xs font-black bg-[#DFFF23] border border-black px-2 py-0.5 rounded-full">
            {v}
          </span>
        ))}
      </div>

      {/* Art canvas */}
      <div className={`relative h-64 bg-gradient-to-br ${post.gradient} flex items-center justify-center`}>
        <span className="text-9xl opacity-80 float-1">{post.avatar}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur rounded-xl px-3 py-1">
          <p className="text-xs font-black text-white">{post.prompt}</p>
        </div>
      </div>

      {/* Reactions */}
      <div className="flex gap-2 p-3">
        <ReactionButton
          icon="❤️" count={likes} color="#FFD6E7"
          active={reacted.like}
          onClick={() => {
            if (!reacted.like) setLikes(l => l + 1);
            else setLikes(l => l - 1);
            setReacted(r => ({ ...r, like: !r.like }));
          }}
        />
        <ReactionButton
          icon="✨" count={inspires} color="#EFE8FF"
          active={reacted.inspire}
          onClick={() => {
            if (!reacted.inspire) setInspires(i => i + 1);
            else setInspires(i => i - 1);
            setReacted(r => ({ ...r, inspire: !r.inspire }));
          }}
        />
        <ReactionButton
          icon="🔥" count={tries} color="#FFE8D6"
          active={reacted.try}
          onClick={() => {
            if (!reacted.try) setTries(t => t + 1);
            else setTries(t => t - 1);
            setReacted(r => ({ ...r, try: !r.try }));
          }}
        />
      </div>
    </motion.div>
  );
}

const FILTERS = ["Para ti", "Siguiendo", "Legendarios", "🌸 Primavera"];

export function FeedScreen() {
  const [activeFilter, setActiveFilter] = useState("Para ti");

  return (
    <Phone>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <h2 className="text-2xl font-black">Feed ✦</h2>
          {/* Filter pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 px-3 py-1.5 rounded-full border-2 border-black font-black text-xs transition-all ${activeFilter === f ? "bg-black text-[#DFFF23] sticker-shadow" : "bg-white"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-20 pt-2">
          {SAMPLE_POSTS.map(post => (
            <ArtCard key={post.id} post={post} />
          ))}
        </div>

        <BottomNav current="feed" />
      </div>
    </Phone>
  );
}
