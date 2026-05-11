import { useState, useEffect, useRef } from "react";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { RarityBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { fetchArtworks, addReaction, deleteArtwork, hideArtwork, reportArtwork, IS_LOGGED_IN, WP_USER_ID, IS_ADMIN } from "../utils/api";

const TRIES_LIMIT = 5;
function triesKey() { return "inkrush_tries_" + new Date().toDateString(); }
function triesLeft() { return Math.max(0, TRIES_LIMIT - parseInt(localStorage.getItem(triesKey()) || "0")); }
function useTry()    { localStorage.setItem(triesKey(), String(TRIES_LIMIT - triesLeft() + 1)); }
import { IHeart, IInspire, IFlame, ISpark, IBookmark, IUser, IArrowL, IArrowR, IDotsV, ITrash, IEyeOff, IFlag, IX } from "../components/Icons";

const FILTERS = ["Para ti", "Siguiendo", "Legendarios", "Temporada"];
const COL_CYCLE = ["var(--rose)", "var(--lilac)", "var(--sky)", "var(--mint)", "var(--butter)", "var(--acid)"];

function PostImages({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return null;
  const cur = Math.min(idx, images.length - 1);

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", background: "var(--ink)", overflow: "hidden" }}>
      <img
        src={images[cur]}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
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
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{ width: i === cur ? 14 : 5, height: 5, borderRadius: 999, border: "1.5px solid var(--ink)", background: i === cur ? "var(--acid)" : "rgba(255,255,255,.6)", cursor: "pointer", padding: 0, transition: "width .15s" }}
              />
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

function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, background: "rgba(20,17,15,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="stk"
        style={{ background: "var(--paper-2)", borderRadius: 20, padding: "24px 20px", width: "100%", maxWidth: 340 }}
      >
        <p className="serif" style={{ fontSize: 22, lineHeight: 1, marginBottom: 8 }}>¿Eliminar obra?</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(20,17,15,.6)", marginBottom: 20, lineHeight: 1.4 }}>
          Esta acción no se puede deshacer. La obra se eliminará permanentemente.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, height: 44, border: "2px solid var(--ink)", borderRadius: 12, background: "var(--paper-2)", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, height: 44, border: "2px solid var(--ink)", borderRadius: 12, background: "var(--rose)", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function PostMenu({ isOwn, hidden, onDelete, onHide, onReport, onFlag, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 150 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute", top: 48, right: 14,
          background: "var(--paper-2)", border: "2px solid var(--ink)",
          borderRadius: 14, overflow: "hidden", minWidth: 180,
          boxShadow: "4px 4px 0 var(--ink)",
        }}
      >
        {isOwn ? (
          <>
            <button
              onClick={onHide}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 16px", border: "none", borderBottom: "1.5px solid rgba(20,17,15,.1)", background: "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left" }}
            >
              <IEyeOff s={16}/> {hidden ? "Mostrar" : "Ocultar"}
            </button>
            <button
              onClick={onDelete}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 16px", border: "none", background: "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "var(--rose)", textAlign: "left" }}
            >
              <ITrash s={16}/> Eliminar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onFlag}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 16px", border: "none", borderBottom: "1.5px solid rgba(20,17,15,.1)", background: "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left" }}
            >
              <IFlag s={16}/> No cumple el reto
            </button>
            <button
              onClick={onReport}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 16px", border: "none", background: "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "var(--rose)", textAlign: "left" }}
            >
              <IFlag s={16}/> Denunciar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ArtCard({ post, idx, onRemove }) {
  const { dispatch } = useApp();
  const [likes,    setLikes]    = useState(post.likes    ?? 0);
  const [inspires, setInspires] = useState(post.inspires ?? 0);
  const [tries,    setTries]    = useState(post.tries    ?? 0);
  const [reacted,  setReacted]  = useState({
    like:    post.userReacted?.like    ?? false,
    inspire: post.userReacted?.inspire ?? false,
    try:     post.userReacted?.try     ?? false,
  });
  const [trySaved,   setTrySaved]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [hidden,     setHidden]     = useState(post.hidden ?? false);
  const [reported,   setReported]   = useState(false);
  const menuRef = useRef(null);

  const isOwn = IS_LOGGED_IN && parseInt(post.author_id) === WP_USER_ID;

  const react = (type) => {
    if (post.id) addReaction(post.id, type).catch(() => {});
    const was = reacted[type];
    if (type === "like")    setLikes(n    => was ? n - 1 : n + 1);
    if (type === "inspire") setInspires(n => was ? n - 1 : n + 1);
    if (type === "try") {
      setTries(n => was ? n - 1 : n + 1);
      if (!was && IS_LOGGED_IN && triesLeft() > 0) {
        const tags = post.variables ?? post.tags ?? [];
        const variables = tags.map(t => ({
          value: typeof t === "string" ? t : (t.value ?? t),
          rarity: typeof t === "object" && t.rarity ? t.rarity : "Común",
        }));
        dispatch({ type: "SAVE_IDEA", idea: { variables, params: post.params ?? [] } });
        useTry();
        setTrySaved(true);
        setTimeout(() => setTrySaved(false), 1800);
      }
    }
    setReacted(r => ({ ...r, [type]: !was }));
  };

  const viewAuthor = () => {
    if (post.author_id) dispatch({ type: "VIEW_USER", userId: post.author_id });
  };

  const handleDelete = async () => {
    try { await deleteArtwork(post.id); onRemove(post.id); } catch {}
    setConfirmDel(false);
    setMenuOpen(false);
  };

  const handleHide = async () => {
    try {
      const res = await hideArtwork(post.id);
      setHidden(res?.hidden ?? !hidden);
    } catch {}
    setMenuOpen(false);
  };

  const handleReport = async (reason) => {
    if (reported) { setMenuOpen(false); return; }
    try { await reportArtwork(post.id, reason); setReported(true); } catch {}
    setMenuOpen(false);
  };

  const tags   = post.variables ?? post.tags ?? [];
  const user   = post.username ?? post.user ?? "Artista";
  const tech   = post.technique ?? "—";
  const rarity = post.rarity ?? "Común";
  const prompt = post.prompt ?? tags.join(" + ");
  const col    = COL_CYCLE[idx % COL_CYCLE.length];
  const images = post.images?.length ? post.images : (post.image ? [post.image] : []);
  const hasAuthor = !!post.author_id;

  const reactions = [
    { Ico: IHeart,   count: likes,    type: "like",    col: "var(--rose)",   active: reacted.like },
    { Ico: IInspire, count: inspires, type: "inspire", col: "var(--lilac)",  active: reacted.inspire },
    { Ico: IFlame,   count: tries,    type: "try",     col: "var(--butter)", active: reacted.try },
  ];

  return (
    <>
      {confirmDel && <DeleteConfirm onConfirm={handleDelete} onCancel={() => setConfirmDel(false)}/>}
      {menuOpen && (
        <PostMenu
          isOwn={isOwn}
          hidden={hidden}
          onDelete={() => { setMenuOpen(false); setConfirmDel(true); }}
          onHide={handleHide}
          onReport={() => handleReport("denuncia")}
          onFlag={() => handleReport("no_cumple")}
          onClose={() => setMenuOpen(false)}
        />
      )}
      <div
        className="stk"
        style={{
          background: hidden ? "rgba(20,17,15,.06)" : "var(--paper-2)",
          padding: 0, marginBottom: 14, borderRadius: 18, overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
          opacity: hidden ? 0.55 : 1,
        }}
      >
        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 8px", position: "relative" }}>
          <div
            onClick={hasAuthor ? viewAuthor : undefined}
            style={{ width: 36, height: 36, borderRadius: 999, border: "2px solid var(--ink)", background: col, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: hasAuthor ? "pointer" : "default" }}
          >
            {post.avatar_url
              ? <img src={post.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 999 }}/>
              : <IUser s={18}/>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0, cursor: hasAuthor ? "pointer" : "default" }} onClick={hasAuthor ? viewAuthor : undefined}>
            <p style={{ fontWeight: 800, fontSize: 13 }}>{user}</p>
            <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.5)" }}>{tech.toUpperCase()}</p>
          </div>
          <RarityBadge rarity={rarity}/>
          {IS_LOGGED_IN && (
            <button
              ref={menuRef}
              onClick={() => setMenuOpen(o => !o)}
              style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
            >
              <IDotsV s={18}/>
            </button>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, padding: "0 14px 10px", flexWrap: "wrap" }}>
            {tags.map((t, i) => (
              <span key={i} style={{ background: "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
                {typeof t === "string" ? t : t.value}
              </span>
            ))}
          </div>
        )}

        {/* Artwork */}
        {images.length > 0 ? (
          <PostImages images={images}/>
        ) : (
          <div style={{ width: "100%", aspectRatio: "3/4", background: "var(--lilac)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {prompt && (
              <p className="serif" style={{ fontSize: 16, padding: "12px 16px", textAlign: "center", lineHeight: 1.3 }}>{prompt}</p>
            )}
          </div>
        )}

        {/* Reactions */}
        <div style={{ display: "flex", gap: 8, padding: 12 }}>
          {reactions.map((b, j) => {
            const isTry = b.type === "try";
            const saved = isTry && trySaved;
            return (
              <button
                key={j}
                onClick={() => react(b.type)}
                style={{
                  flex: 1, height: 38, borderRadius: 12, border: "2px solid var(--ink)",
                  background: saved ? "var(--mint)" : b.active ? b.col : "var(--paper-2)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontWeight: 800, fontSize: 12,
                  boxShadow: b.active ? "3px 3px 0 var(--ink)" : "none",
                  cursor: "pointer", transition: "background .2s",
                }}
              >
                <b.Ico s={15}/> {saved ? "Guardado" : b.count}
              </button>
            );
          })}
        </div>

        {hidden && isOwn && (
          <div style={{ padding: "0 12px 12px" }}>
            <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.45)", textAlign: "center" }}>// OBRA OCULTA — SOLO VISIBLE PARA TI</p>
          </div>
        )}
        {reported && (
          <div style={{ padding: "0 12px 12px" }}>
            <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "var(--rose)", textAlign: "center" }}>// REPORTE ENVIADO</p>
          </div>
        )}
      </div>
    </>
  );
}

export function FeedScreen() {
  const [filter, setFilter] = useState("Para ti");
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtworks()
      .then(data => { if (data?.artworks) setPosts(data.artworks); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const removePost = (id) => setPosts(ps => ps.filter(p => p.id !== id));

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "8px 22px 6px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="serif" style={{ fontSize: 32, lineHeight: 1 }}>Feed</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <span className="stk-sm" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--paper-2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <ISpark s={18}/>
              </span>
              <span className="stk-sm" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--paper-2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <IBookmark s={18}/>
              </span>
            </div>
          </div>
          {/* Filters */}
          <div className="scroll" style={{ display: "flex", gap: 8, marginTop: 10, paddingBottom: 4 }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flexShrink: 0, padding: "5px 12px", borderRadius: 999,
                  border: "2px solid var(--ink)",
                  background: filter === f ? "var(--ink)" : "var(--paper-2)",
                  color: filter === f ? "var(--acid)" : "var(--ink)",
                  fontWeight: 700, fontSize: 11,
                  boxShadow: filter === f ? "3px 3px 0 var(--ink)" : "none",
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
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
              <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(20,17,15,.5)", marginTop: 8 }}>Completa tu primer reto y sube tu obra.</p>
            </div>
          )}
          {posts.map((post, i) => (
            <ArtCard key={post.id ?? i} post={post} idx={i} onRemove={removePost}/>
          ))}
        </div>

        <BottomNav current="feed"/>
      </div>
    </Phone>
  );
}
