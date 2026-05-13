import { useState, useEffect } from "react";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { useApp } from "../data/store";
import { fetchArtworks, IS_LOGGED_IN, WP_USER_ID, WP_TRIES_LEFT, WP_TRIES_LIMIT } from "../utils/api";
import { IFlame } from "../components/Icons";
import { PostCard } from "../components/ArtworkModal";

function filterToParams(f) {
  if (f === "Legendarios") return { rarity: "Legendario" };
  if (f === "Siguiendo")   return { following: 1 };
  if (f === "Esta semana") return { period: "week" };
  return {};
}

function triesKey() { return "inkrush_tries_" + new Date().toDateString(); }
function localTriesLeft() {
  const used = parseInt(localStorage.getItem(triesKey()) || "0");
  return Math.max(0, WP_TRIES_LIMIT - used);
}

function useCountdown() {
  const [label, setLabel] = useState("0h 00m");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLabel(`${h}h ${m.toString().padStart(2, "0")}m`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);
  return label;
}

const FILTERS = ["Para ti", "Siguiendo", "Legendarios", "Esta semana"];

export function FeedScreen() {
  const { dispatch } = useApp();
  const [filter, setFilter]     = useState("Para ti");
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [triesLeft, setTriesLeft] = useState(() => IS_LOGGED_IN ? WP_TRIES_LEFT : localTriesLeft());
  const countdown = useCountdown();

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    fetchArtworks(filterToParams(filter))
      .then(data => { if (data?.artworks) setPosts(data.artworks); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const removePost = (id) => setPosts(ps => ps.filter(p => p.id !== id));
  const updatePost = (updated) => setPosts(ps => ps.map(p => p.id === updated.id ? { ...p, ...updated } : p));

  const viewAuthorOf = (post) => {
    if (!post.author_id) return undefined;
    return () => {
      if (IS_LOGGED_IN && parseInt(post.author_id) === WP_USER_ID) {
        dispatch({ type: "SET_SCREEN", screen: "profile" });
      } else {
        dispatch({ type: "VIEW_USER", userId: post.author_id });
      }
    };
  };

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "8px 22px 6px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="serif" style={{ fontSize: 32, lineHeight: 1 }}>Feed</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {triesLeft === 0 && (
                <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.45)" }}>
                  reset {countdown}
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: triesLeft === 0 ? "rgba(20,17,15,.08)" : "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 999, padding: "4px 12px" }}>
                <IFlame s={14}/>
                <span style={{ fontWeight: 800, fontSize: 13, color: triesLeft === 0 ? "rgba(20,17,15,.4)" : "var(--ink)" }}>{triesLeft}</span>
                <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.5)" }}>/{WP_TRIES_LIMIT}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="scroll" style={{ display: "flex", gap: 8, marginTop: 10, paddingBottom: 4 }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                flexShrink: 0, padding: "5px 12px", borderRadius: 999,
                border: "2px solid var(--ink)",
                background: filter === f ? "var(--ink)" : "var(--paper-2)",
                color: filter === f ? "var(--acid)" : "var(--ink)",
                fontWeight: 700, fontSize: 11,
                boxShadow: filter === f ? "3px 3px 0 var(--ink)" : "none",
                cursor: "pointer",
              }}>{f}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 18px 90px" }}>
          {loading && (
            <p className="mono" style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.4)", padding: "40px 0" }}>// CARGANDO...</p>
          )}
          {!loading && posts.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 24px" }}>
              <p className="serif" style={{ fontSize: 28, lineHeight: 1 }}>Sin obras aún</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(20,17,15,.5)", marginTop: 8 }}>
                {filter === "Siguiendo" ? "Sigue a otros artistas para ver sus obras aquí." : "Aún no hay nada aquí. Eso tiene solución fácil."}
              </p>
            </div>
          )}
          {posts.map((post, i) => (
            <PostCard
              key={post.id ?? i}
              post={post}
              idx={i}
              onRemove={removePost}
              onUpdate={updatePost}
              triesLeft={triesLeft}
              onTryUsed={() => setTriesLeft(t => Math.max(0, t - 1))}
              onViewAuthor={viewAuthorOf(post)}
            />
          ))}
        </div>

        <BottomNav current="feed"/>
      </div>
    </Phone>
  );
}
