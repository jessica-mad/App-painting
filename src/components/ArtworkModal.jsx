import { useState, useEffect } from "react";
import { RarityBadge } from "./RarityBadge";
import { useApp } from "../data/store";
import { addReaction, useTryAPI, IS_LOGGED_IN } from "../utils/api";
import { IHeart, IInspire, IFlame, IUser, IArrowL, IArrowR } from "./Icons";

function decodeTag(t) {
  const raw = typeof t === "string" ? t : (t.value ?? "");
  try { return decodeURIComponent(raw); } catch { return raw; }
}

function triesKey() { return "inkrush_tries_" + new Date().toDateString(); }
function markLocalTry() {
  const used = parseInt(localStorage.getItem(triesKey()) || "0");
  localStorage.setItem(triesKey(), String(used + 1));
}

const COL_CYCLE = ["var(--rose)", "var(--lilac)", "var(--sky)", "var(--mint)", "var(--butter)", "var(--acid)"];

export function PostImages({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return null;
  const cur = Math.min(idx, images.length - 1);

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", background: "var(--ink)", overflow: "hidden" }}>
      <img src={images[cur]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            disabled={cur === 0}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: 999, background: "var(--paper-2)", border: "2px solid var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: cur === 0 ? 0.3 : 1 }}
          ><IArrowL s={13}/></button>
          <button
            onClick={() => setIdx(i => Math.min(images.length - 1, i + 1))}
            disabled={cur === images.length - 1}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: 999, background: "var(--paper-2)", border: "2px solid var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: cur === images.length - 1 ? 0.3 : 1 }}
          ><IArrowR s={13}/></button>
          <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} style={{ width: i === cur ? 14 : 5, height: 5, borderRadius: 999, border: "1.5px solid var(--ink)", background: i === cur ? "var(--acid)" : "rgba(255,255,255,.6)", cursor: "pointer", padding: 0, transition: "width .15s" }}/>
            ))}
          </div>
          <div style={{ position: "absolute", top: 8, right: 8, background: "var(--ink)", color: "var(--acid)", borderRadius: 999, padding: "2px 7px", fontSize: 10, fontWeight: 800 }}>
            {cur + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}

/* Self-contained artwork detail bottom-sheet modal.
   Manages its own reaction state seeded from post data.
   triesLeft/onTryUsed are optional — omit to skip try-limit enforcement. */
export function ArtworkModal({ post, onClose, col, triesLeft, onTryUsed, onViewAuthor }) {
  const { dispatch } = useApp();
  const [likes,    setLikes]    = useState(post.likes    ?? 0);
  const [inspires, setInspires] = useState(post.inspires ?? 0);
  const [tries,    setTries]    = useState(post.tries    ?? 0);
  const [reacted,  setReacted]  = useState({
    like:    post.userReacted?.like    ?? false,
    inspire: post.userReacted?.inspire ?? false,
    try:     post.userReacted?.try     ?? false,
  });
  const [trySaved, setTrySaved] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const react = (type) => {
    const was = reacted[type];
    if (type === "try" && !was && triesLeft !== undefined && triesLeft <= 0) return;
    if (post.id) addReaction(post.id, type).catch(() => {});
    if (type === "like")    setLikes(n    => was ? n - 1 : n + 1);
    if (type === "inspire") setInspires(n => was ? n - 1 : n + 1);
    if (type === "try") {
      setTries(n => was ? n - 1 : n + 1);
      if (!was && IS_LOGGED_IN) {
        const tags = post.variables ?? post.tags ?? [];
        const variables = tags.map(t => ({ value: decodeTag(t), rarity: typeof t === "object" && t.rarity ? t.rarity : "Común" }));
        dispatch({ type: "SAVE_IDEA", idea: { variables, params: post.params ?? [] } });
        useTryAPI().catch(() => {});
        markLocalTry();
        onTryUsed?.();
        setTrySaved(true);
        setTimeout(() => setTrySaved(false), 1800);
      }
    }
    setReacted(r => ({ ...r, [type]: !was }));
  };

  const tags    = post.variables ?? post.tags ?? [];
  const images  = post.images?.length ? post.images : (post.image ? [post.image] : []);
  const avatarBg = col ?? COL_CYCLE[(parseInt(post.author_id) || 0) % COL_CYCLE.length];
  const hasAuthor = !!post.author_id && !!onViewAuthor;
  const dateStr = post.date ? new Date(post.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "";

  const reactions = [
    { Ico: IHeart,   count: likes,    type: "like",    bg: "var(--rose)",   active: reacted.like },
    { Ico: IInspire, count: inspires, type: "inspire", bg: "var(--lilac)",  active: reacted.inspire },
    { Ico: IFlame,   count: tries,    type: "try",     bg: "var(--butter)", active: reacted.try },
  ];

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(20,17,15,.72)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, maxHeight: "94vh", overflowY: "auto", background: "var(--paper-2)", borderRadius: "22px 22px 0 0", border: "2px solid var(--ink)", borderBottom: "none" }}
      >
        {/* Handle */}
        <div style={{ padding: "12px 16px 8px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "rgba(20,17,15,.2)", margin: "0 auto" }}/>
        </div>

        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 10px" }}>
          <div
            onClick={hasAuthor ? onViewAuthor : undefined}
            style={{ width: 38, height: 38, borderRadius: 999, border: "2px solid var(--ink)", background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: hasAuthor ? "pointer" : "default" }}
          >
            {post.avatar_url
              ? <img src={post.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 999 }}/>
              : <IUser s={18}/>
            }
          </div>
          <div style={{ flex: 1, cursor: hasAuthor ? "pointer" : "default" }} onClick={hasAuthor ? onViewAuthor : undefined}>
            <p style={{ fontWeight: 800, fontSize: 14 }}>{post.username ?? "Artista"}</p>
            <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.5)" }}>
              {post.technique ? post.technique.toUpperCase() : ""}
              {dateStr ? `  ·  ${dateStr}` : ""}
            </p>
          </div>
          <RarityBadge rarity={post.rarity ?? "Común"}/>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid rgba(20,17,15,.2)", background: "transparent", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >✕</button>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, padding: "0 16px 10px", flexWrap: "wrap" }}>
            {tags.map((t, i) => (
              <span key={i} style={{ background: "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                {decodeTag(t)}
              </span>
            ))}
          </div>
        )}

        {/* Image */}
        {images.length > 0 ? (
          <PostImages images={images}/>
        ) : (
          <div style={{ width: "100%", aspectRatio: "3/4", background: "var(--lilac)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ fontSize: 40, opacity: 0.4 }}>🖼</span>
            <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>// sin obra todavía</p>
            {post.prompt && <p className="serif" style={{ fontSize: 15, padding: "0 20px", textAlign: "center", lineHeight: 1.3, opacity: 0.7 }}>{post.prompt}</p>}
          </div>
        )}

        {/* Reactions */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px 16px" }}>
          {reactions.map((b, j) => {
            const isTry = b.type === "try";
            const saved = isTry && trySaved;
            const blocked = isTry && !reacted.try && triesLeft !== undefined && triesLeft <= 0;
            return (
              <button
                key={j}
                onClick={() => react(b.type)}
                disabled={blocked}
                style={{
                  flex: 1, height: 44, borderRadius: 14, border: "2px solid var(--ink)",
                  background: saved ? "var(--mint)" : b.active ? b.bg : "var(--paper-2)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontWeight: 800, fontSize: 13,
                  boxShadow: b.active ? "3px 3px 0 var(--ink)" : "none",
                  cursor: blocked ? "not-allowed" : "pointer",
                  opacity: blocked ? 0.45 : 1,
                  transition: "background .2s",
                }}
              >
                <b.Ico s={16}/> {saved ? "Guardado" : b.count}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
