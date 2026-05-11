import { useState, useEffect, useRef } from "react";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { RarityBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { fetchArtworks, addReaction, deleteArtwork, hideArtwork, reportArtwork, updateArtwork, useTryAPI, IS_LOGGED_IN, WP_USER_ID, WP_TRIES_LEFT, WP_TRIES_LIMIT } from "../utils/api";
import { IHeart, IInspire, IFlame, IUser, IDotsV, ITrash, IEyeOff, IFlag, IBrush } from "../components/Icons";
import { ArtworkModal, PostImages } from "../components/ArtworkModal";

function decodeTag(t) {
  const raw = typeof t === "string" ? t : (t.value ?? "");
  try { return decodeURIComponent(raw); } catch { return raw; }
}

/* Daily "lo intentaré" tries — seeded from WP config, fallback localStorage */
function triesKey() { return "inkrush_tries_" + new Date().toDateString(); }
function localTriesLeft() {
  const used = parseInt(localStorage.getItem(triesKey()) || "0");
  return Math.max(0, WP_TRIES_LIMIT - used);
}
function markLocalTry() {
  const used = parseInt(localStorage.getItem(triesKey()) || "0");
  localStorage.setItem(triesKey(), String(used + 1));
}

function filterToParams(f) {
  if (f === "Legendarios") return { rarity: "Legendario" };
  if (f === "Siguiendo")   return { following: 1 };
  if (f === "Esta semana") return { period: "week" };
  return {};
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
const COL_CYCLE = ["var(--rose)", "var(--lilac)", "var(--sky)", "var(--mint)", "var(--butter)", "var(--acid)"];

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

function EditArtworkModal({ post, onClose, onSaved }) {
  const [prompt, setPrompt] = useState(post.prompt ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateArtwork(post.id, { prompt });
      onSaved({ ...post, prompt });
    } catch {}
    setSaving(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(20,17,15,.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="stk"
        style={{ background: "var(--paper-2)", borderRadius: 20, padding: "24px 20px", width: "100%", maxWidth: 340 }}
      >
        <p className="serif" style={{ fontSize: 22, lineHeight: 1, marginBottom: 16 }}>Editar obra</p>
        <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>Descripción / reto</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          style={{ width: "100%", height: 80, border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, resize: "none", outline: "none", background: "var(--paper-2)", marginBottom: 16 }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, height: 44, border: "2px solid var(--ink)", borderRadius: 12, background: "var(--paper-2)", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
          >Cancelar</button>
          <button
            onClick={save}
            disabled={saving}
            style={{ flex: 1, height: 44, border: "2px solid var(--ink)", borderRadius: 12, background: "var(--acid)", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >{saving ? "Guardando..." : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

function PostMenu({ isOwn, hidden, onEdit, onDelete, onHide, onReport, onFlag, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200 }}/>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute", top: 44, right: 12, zIndex: 201,
          background: "var(--paper-2)", border: "2px solid var(--ink)",
          borderRadius: 14, overflow: "hidden", minWidth: 190,
          boxShadow: "4px 4px 0 var(--ink)",
        }}
      >
        {isOwn ? (
          <>
            <button onClick={onEdit}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 16px", border: "none", borderBottom: "1.5px solid rgba(20,17,15,.1)", background: "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
              <IBrush s={16}/> Editar obra
            </button>
            <button onClick={onHide}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 16px", border: "none", borderBottom: "1.5px solid rgba(20,17,15,.1)", background: "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
              <IEyeOff s={16}/> {hidden ? "Mostrar obra" : "Ocultar obra"}
            </button>
            <button onClick={onDelete}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 16px", border: "none", background: "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#c0392b", textAlign: "left" }}>
              <ITrash s={16}/> Eliminar obra
            </button>
          </>
        ) : (
          <>
            <button onClick={onFlag}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 16px", border: "none", borderBottom: "1.5px solid rgba(20,17,15,.1)", background: "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
              <IFlag s={16}/> No cumple el reto
            </button>
            <button onClick={onReport}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 16px", border: "none", background: "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#c0392b", textAlign: "left" }}>
              <IFlag s={16}/> Denunciar
            </button>
          </>
        )}
      </div>
    </>
  );
}

function ArtCard({ post, idx, onRemove, onUpdate, triesLeft, onTryUsed, countdown }) {
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
  const [editOpen,   setEditOpen]   = useState(false);
  const [hidden,     setHidden]     = useState(post.hidden ?? false);
  const [reported,   setReported]   = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(post.prompt ?? "");
  const menuRef = useRef(null);

  const isOwn = IS_LOGGED_IN && parseInt(post.author_id) === WP_USER_ID;

  const react = (type) => {
    const was = reacted[type];
    /* Block adding a "try" when exhausted */
    if (type === "try" && !was && triesLeft <= 0) return;

    if (post.id) addReaction(post.id, type).catch(() => {});
    if (type === "like")    setLikes(n    => was ? n - 1 : n + 1);
    if (type === "inspire") setInspires(n => was ? n - 1 : n + 1);
    if (type === "try") {
      setTries(n => was ? n - 1 : n + 1);
      if (!was && IS_LOGGED_IN) {
        const tags = post.variables ?? post.tags ?? [];
        const variables = tags.map(t => ({
          value: decodeTag(t),
          rarity: typeof t === "object" && t.rarity ? t.rarity : "Común",
        }));
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

  const viewAuthor = () => {
    if (!post.author_id) return;
    if (IS_LOGGED_IN && parseInt(post.author_id) === WP_USER_ID) {
      dispatch({ type: "SET_SCREEN", screen: "profile" });
    } else {
      dispatch({ type: "VIEW_USER", userId: post.author_id });
    }
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
  const prompt = localPrompt || tags.join(" + ");
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
      {editOpen && (
        <EditArtworkModal
          post={{ ...post, prompt: localPrompt }}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => { setLocalPrompt(updated.prompt ?? ""); onUpdate?.(updated); }}
        />
      )}
      {detailOpen && (
        <ArtworkModal
          post={{ ...post, prompt }}
          col={col}
          onClose={() => setDetailOpen(false)}
          triesLeft={triesLeft}
          onTryUsed={onTryUsed}
          onViewAuthor={() => { setDetailOpen(false); viewAuthor(); }}
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
          {menuOpen && (
            <PostMenu
              isOwn={isOwn}
              hidden={hidden}
              onEdit={() => { setMenuOpen(false); setEditOpen(true); }}
              onDelete={() => { setMenuOpen(false); setConfirmDel(true); }}
              onHide={handleHide}
              onReport={() => handleReport("denuncia")}
              onFlag={() => handleReport("no_cumple")}
              onClose={() => setMenuOpen(false)}
            />
          )}
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
          <button
            ref={menuRef}
            onClick={() => setMenuOpen(o => !o)}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid rgba(20,17,15,.15)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <IDotsV s={20}/>
          </button>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, padding: "0 14px 10px", flexWrap: "wrap" }}>
            {tags.map((t, i) => (
              <span key={i} style={{ background: "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
                {decodeTag(t)}
              </span>
            ))}
          </div>
        )}

        {/* Artwork — click opens detail modal */}
        <div onClick={() => setDetailOpen(true)} style={{ cursor: "pointer" }}>
          {images.length > 0 ? (
            <PostImages images={images}/>
          ) : (
            <div style={{ width: "100%", aspectRatio: "3/4", background: "var(--lilac)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 36, opacity: 0.35 }}>🖼</span>
              <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>// sin obra todavía</p>
              {prompt && <p className="serif" style={{ fontSize: 14, padding: "0 16px", textAlign: "center", lineHeight: 1.3, opacity: 0.65 }}>{prompt}</p>}
            </div>
          )}
        </div>

        {/* Reactions */}
        <div style={{ display: "flex", gap: 8, padding: 12 }}>
          {reactions.map((b, j) => {
            const isTry = b.type === "try";
            const saved = isTry && trySaved;
            const blocked = isTry && !reacted.try && triesLeft <= 0;
            return (
              <button
                key={j}
                onClick={() => react(b.type)}
                disabled={blocked}
                title={blocked ? `Sin intentos · se reinician en ${countdown}` : undefined}
                style={{
                  flex: 1, height: 38, borderRadius: 12, border: "2px solid var(--ink)",
                  background: saved ? "var(--mint)" : b.active ? b.col : "var(--paper-2)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontWeight: 800, fontSize: 12,
                  boxShadow: b.active ? "3px 3px 0 var(--ink)" : "none",
                  cursor: blocked ? "not-allowed" : "pointer",
                  opacity: blocked ? 0.45 : 1,
                  transition: "background .2s, opacity .2s",
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
  const [filter, setFilter]   = useState("Para ti");
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
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

  const removePost   = (id) => setPosts(ps => ps.filter(p => p.id !== id));
  const updatePost   = (updated) => setPosts(ps => ps.map(p => p.id === updated.id ? { ...p, ...updated } : p));

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
              <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(20,17,15,.5)", marginTop: 8 }}>
                {filter === "Siguiendo" ? "Sigue a otros artistas para ver sus obras aquí." : "Aún no hay nada aquí. Eso tiene solución fácil."}
              </p>
            </div>
          )}
          {posts.map((post, i) => (
            <ArtCard
              key={post.id ?? i} post={post} idx={i}
              onRemove={removePost}
              onUpdate={updatePost}
              triesLeft={triesLeft}
              onTryUsed={() => setTriesLeft(t => Math.max(0, t - 1))}
              countdown={countdown}
            />
          ))}
        </div>

        <BottomNav current="feed"/>
      </div>
    </Phone>
  );
}
