import { useState, useEffect, useRef } from "react";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { useApp } from "../data/store";
import { useT } from "../i18n";
import { fetchArtworks, IS_LOGGED_IN, WP_USER_ID, WP_TRIES_LEFT, WP_TRIES_LIMIT } from "../utils/api";
import { IFlame, IGrid, IList, IX, IBell } from "../components/Icons";
import { PostCard } from "../components/ArtworkModal";

/* Internal filter keys (language-independent) */
const FILTER_KEYS = ["forYou", "following", "legendary", "thisWeek"];

function filterToParams(f) {
  if (f === "legendary") return { rarity: "Legendario" };
  if (f === "following")  return { following: 1 };
  if (f === "thisWeek")   return { period: "week" };
  return {};
}

function triesKey() { return "musai_tries_" + new Date().toDateString(); }
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

const COL_CYCLE = ["var(--rose)", "var(--lilac)", "var(--sky)", "var(--mint)", "var(--butter)", "var(--acid)"];

/* ── Gallery modal overlay ── */
function GalleryModal({ post, idx, onClose, triesLeft, onTryUsed, onRemove, onUpdate, onViewAuthor }) {
  const backdropRef = useRef(null);
  const handleBackdrop = (e) => { if (e.target === backdropRef.current) onClose(); };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(20,17,15,.82)",
        overflowY: "auto", padding: "16px 16px 40px",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}
    >
      <button
        onClick={onClose}
        style={{
          alignSelf: "flex-end", marginBottom: 10,
          width: 36, height: 36, borderRadius: 999,
          background: "rgba(255,255,255,.15)", border: "2px solid rgba(255,255,255,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", cursor: "pointer", flexShrink: 0,
        }}
      >
        <IX s={16} stroke="#fff"/>
      </button>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <PostCard
          post={post}
          idx={idx}
          onRemove={(id) => { onRemove(id); onClose(); }}
          onUpdate={onUpdate}
          triesLeft={triesLeft}
          onTryUsed={onTryUsed}
          onViewAuthor={onViewAuthor}
          commentsOpen
        />
      </div>
    </div>
  );
}

/* ── Gallery grid ── */
function GalleryGrid({ posts, onOpen }) {
  if (posts.length === 0) return null;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
      padding: "8px 14px 90px",
    }}>
      {posts.map((post, i) => {
        const images = post.images?.length ? post.images : (post.image ? [post.image] : []);
        return (
          <div
            key={post.id ?? i}
            onClick={() => onOpen(post, i)}
            style={{
              borderRadius: 14, border: "2px solid var(--ink)",
              overflow: "hidden", cursor: "pointer",
              aspectRatio: "3/4", position: "relative",
              background: images.length ? "var(--ink)" : COL_CYCLE[i % COL_CYCLE.length],
              boxShadow: "3px 3px 0 var(--ink)",
            }}
          >
            {images.length > 0 ? (
              <img
                src={images[0]} alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 28, opacity: 0.3 }}>🖼</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FeedScreen() {
  const { state, dispatch } = useApp();
  const t = useT();
  const unreadNotifs = state.unreadNotifs;
  const [filter, setFilter]         = useState("forYou");
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [triesLeft, setTriesLeft]   = useState(() => Math.min(WP_TRIES_LEFT, localTriesLeft()));
  const [view, setView]             = useState(() => localStorage.getItem("musai_feed_view") || "list");
  const [galleryPost, setGalleryPost] = useState(null);
  const countdown = useCountdown();

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    fetchArtworks(filterToParams(filter))
      .then(data => { if (data?.artworks) setPosts(data.artworks); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const changeView = (v) => {
    setView(v);
    localStorage.setItem("musai_feed_view", v);
  };

  const removePost  = (id) => { setPosts(ps => ps.filter(p => p.id !== id)); };
  const updatePost  = (updated) => setPosts(ps => ps.map(p => p.id === updated.id ? { ...p, ...updated } : p));

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
            <h2 className="serif" style={{ fontSize: 32, lineHeight: 1 }}>{t("feed.title")}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Bell */}
              <button
                onClick={() => dispatch({ type: "SET_SCREEN", screen: "notifications" })}
                style={{ width: 34, height: 34, borderRadius: 999, border: "2px solid var(--ink)", background: unreadNotifs > 0 ? "var(--butter)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", flexShrink: 0 }}
              >
                <IBell s={15}/>
                {unreadNotifs > 0 && (
                  <span style={{ position: "absolute", top: -5, right: -5, minWidth: 15, height: 15, borderRadius: 999, background: "var(--coral, #e55)", color: "#fff", border: "1.5px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, padding: "0 2px" }}>
                    {unreadNotifs > 99 ? "99+" : unreadNotifs}
                  </span>
                )}
              </button>
              {/* View toggle */}
              <div style={{ display: "flex", border: "2px solid var(--ink)", borderRadius: 10, overflow: "hidden" }}>
                {[
                  { id: "list", Icon: IList,  label: t("feed.view.list") },
                  { id: "grid", Icon: IGrid,  label: t("feed.view.grid") },
                ].map(({ id, Icon, label }) => (
                  <button
                    key={id}
                    title={label}
                    onClick={() => changeView(id)}
                    style={{
                      width: 34, height: 30,
                      background: view === id ? "var(--ink)" : "var(--paper-2)",
                      color:      view === id ? "var(--acid)" : "var(--ink)",
                      border: "none", borderRight: id === "list" ? "1.5px solid var(--ink)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Icon s={15}/>
                  </button>
                ))}
              </div>

              {/* Tries counter */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: triesLeft === 0 ? "rgba(20,17,15,.08)" : "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 999, padding: "4px 10px" }}>
                <IFlame s={13}/>
                <span style={{ fontWeight: 800, fontSize: 12, color: triesLeft === 0 ? "rgba(20,17,15,.4)" : "var(--ink)" }}>{triesLeft}</span>
                <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.5)" }}>/{WP_TRIES_LIMIT}</span>
              </div>
            </div>
          </div>

          {triesLeft === 0 && (
            <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.45)", marginTop: 3 }}>
              {t("feed.tries.reset", { countdown })}
            </p>
          )}

          {/* Filters */}
          <div className="scroll" style={{ display: "flex", gap: 8, marginTop: 10, paddingBottom: 4 }}>
            {FILTER_KEYS.map(key => (
              <button key={key} onClick={() => setFilter(key)} style={{
                flexShrink: 0, padding: "5px 12px", borderRadius: 999,
                border: "2px solid var(--ink)",
                background: filter === key ? "var(--ink)" : "var(--paper-2)",
                color: filter === key ? "var(--acid)" : "var(--ink)",
                fontWeight: 700, fontSize: 11,
                boxShadow: filter === key ? "3px 3px 0 var(--ink)" : "none",
                cursor: "pointer",
              }}>{t(`feed.filter.${key}`)}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading && (
          <p className="mono" style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.4)", padding: "40px 0" }}>
            {t("feed.loading")}
          </p>
        )}
        {!loading && posts.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <p className="serif" style={{ fontSize: 28, lineHeight: 1 }}>{t("feed.empty.title")}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(20,17,15,.5)", marginTop: 8 }}>
              {filter === "following" ? t("feed.empty.following") : t("feed.empty.generic")}
            </p>
          </div>
        )}

        {/* List view */}
        {!loading && view === "list" && posts.length > 0 && (
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 18px 90px" }}>
            {posts.map((post, i) => (
              <PostCard
                key={post.id ?? i}
                post={post}
                idx={i}
                onRemove={removePost}
                onUpdate={updatePost}
                triesLeft={triesLeft}
                onTryUsed={(serverLeft) => setTriesLeft(t => typeof serverLeft === "number" ? serverLeft : Math.max(0, t - 1))}
                onViewAuthor={viewAuthorOf(post)}
              />
            ))}
          </div>
        )}

        {/* Gallery view */}
        {!loading && view === "grid" && posts.length > 0 && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <GalleryGrid
              posts={posts}
              onOpen={(post, idx) => setGalleryPost({ post, idx })}
            />
          </div>
        )}

        <BottomNav current="feed"/>
      </div>

      {/* Gallery modal */}
      {galleryPost && (
        <GalleryModal
          post={galleryPost.post}
          idx={galleryPost.idx}
          onClose={() => setGalleryPost(null)}
          triesLeft={triesLeft}
          onTryUsed={(serverLeft) => setTriesLeft(t => typeof serverLeft === "number" ? serverLeft : Math.max(0, t - 1))}
          onRemove={(id) => { removePost(id); setGalleryPost(null); }}
          onUpdate={updatePost}
          onViewAuthor={viewAuthorOf(galleryPost.post)}
        />
      )}
    </Phone>
  );
}
