import { useState, useEffect, useRef } from "react";
import { RarityBadge } from "./RarityBadge";
import { useApp } from "../data/store";
import { addReaction, useTryAPI, deleteArtwork, hideArtwork, reportArtwork, updateArtwork, IS_LOGGED_IN, WP_USER_ID } from "../utils/api";
import { IHeart, IInspire, IFlame, IUser, IBrush, IEyeOff, ITrash, IFlag, IArrowL, IArrowR } from "./Icons";

function decodeTag(t) {
  const raw = typeof t === "string" ? t : (t.value ?? "");
  try { return decodeURIComponent(raw); } catch { return raw; }
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d} días`;
  const w = Math.floor(d / 7);
  if (w < 5) return `hace ${w} sem.`;
  const m = Math.floor(d / 30);
  return `hace ${m} mes${m > 1 ? "es" : ""}`;
}

function triesKey() { return "inkrush_tries_" + new Date().toDateString(); }
function markLocalTry() {
  const used = parseInt(localStorage.getItem(triesKey()) || "0");
  localStorage.setItem(triesKey(), String(used + 1));
}

const COL_CYCLE = ["var(--rose)", "var(--lilac)", "var(--sky)", "var(--mint)", "var(--butter)", "var(--acid)"];

/* ── Horizontal three-dot icon ── */
function IDotsH({ s = 20, color = "#fff" }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
      <circle cx="5" cy="12" r="2"/>
      <circle cx="12" cy="12" r="2"/>
      <circle cx="19" cy="12" r="2"/>
    </svg>
  );
}

/* ── Image carousel — arrows + counter inside, dots rendered outside ── */
export function PostImages({ images, aspectRatio = "3/4", slide, onSlide }) {
  const [internal, setInternal] = useState(0);
  const cur = slide !== undefined ? Math.min(slide, images.length - 1) : Math.min(internal, images.length - 1);
  const go = (i) => { onSlide ? onSlide(i) : setInternal(i); };

  if (!images?.length) return null;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio, background: "var(--ink)", overflow: "hidden" }}>
      <img src={images[cur]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
      {images.length > 1 && (
        <>
          <button onClick={() => go(Math.max(0, cur - 1))} disabled={cur === 0}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: 999, background: "var(--paper-2)", border: "2px solid var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: cur === 0 ? 0.3 : 1 }}>
            <IArrowL s={13}/>
          </button>
          <button onClick={() => go(Math.min(images.length - 1, cur + 1))} disabled={cur === images.length - 1}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: 999, background: "var(--paper-2)", border: "2px solid var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: cur === images.length - 1 ? 0.3 : 1 }}>
            <IArrowR s={13}/>
          </button>
          {/* Counter pill bottom-right */}
          <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(20,17,15,.75)", color: "#fff", fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 10, letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 999, border: "1.5px solid var(--ink)", zIndex: 11 }}>
            {cur + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Carousel dots (rendered below the image, outside it) ── */
function CarouselDots({ count, current, onSelect }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "10px 0 4px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <button key={i} onClick={() => onSelect?.(i)}
          style={{ all: "unset", cursor: "pointer", width: i === current ? 8 : 6, height: i === current ? 8 : 6, borderRadius: 999, background: i === current ? "var(--ink)" : "rgba(20,17,15,.25)", transition: "all .15s ease" }}/>
      ))}
    </div>
  );
}

/* ── Renderiza texto con #hashtags resaltados en verde ── */
function renderWithHashtags(text) {
  if (!text) return null;
  return text.split(/(#\w+)/g).map((part, i) =>
    part.startsWith("#")
      ? <span key={i} style={{ color: "var(--mint)", fontWeight: 700 }}>{part}</span>
      : part
  );
}

/* ── Expandable caption: username (bold) + text, 2-line clamp with más/menos ── */
function ExpandableCaption({ username, text }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    setOverflows(ref.current.scrollHeight > ref.current.clientHeight + 2);
  }, [text, username]);

  if (!text) return null;

  const linkStyle = { cursor: "pointer", textDecoration: "underline", fontWeight: 700, fontSize: 13, color: "rgba(20,17,15,.6)", background: "none", border: "none", padding: 0, fontFamily: "Space Grotesk" };

  return (
    <div style={{ padding: "0 14px 14px", fontSize: 13, lineHeight: 1.45, color: "var(--ink)", fontWeight: 500 }}>
      <p ref={ref} style={{ margin: 0, display: expanded ? "block" : "-webkit-box", WebkitLineClamp: expanded ? "unset" : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        <b style={{ marginRight: 4 }}>{username}</b>{renderWithHashtags(text)}
        {expanded && <>{" "}<button onClick={() => setExpanded(false)} style={linkStyle}>menos</button></>}
      </p>
      {!expanded && overflows && (
        <button onClick={() => setExpanded(true)} style={{ ...linkStyle, marginTop: 2, display: "block" }}>... más</button>
      )}
    </div>
  );
}

/* ── Delete confirmation modal ── */
function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(20,17,15,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div onClick={e => e.stopPropagation()} className="stk" style={{ background: "var(--paper-2)", borderRadius: 18, padding: "18px 18px 14px", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ width: 34, height: 34, borderRadius: 999, background: "var(--coral)", border: "2px solid var(--ink)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, flexShrink: 0 }}>!</span>
          <p className="serif" style={{ fontSize: 22, lineHeight: 1, margin: 0 }}>¿Eliminar post?</p>
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.45, marginTop: 6, marginBottom: 14, color: "rgba(20,17,15,.7)", fontWeight: 600 }}>
          Esta acción es <b>permanente</b>. Perderás los likes, inspiras y comentarios asociados.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 40, borderRadius: 12, border: "2px solid var(--ink)", background: "var(--paper-2)", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "Space Grotesk" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{ flex: 1, height: 40, borderRadius: 12, border: "2px solid var(--ink)", background: "var(--coral)", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer", boxShadow: "3px 3px 0 var(--ink)", fontFamily: "Space Grotesk" }}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Report form modal ── */
const REPORT_REASONS = [
  "Contenido ofensivo o violento",
  "Spam o publicidad",
  "Copia / plagio",
  "Acoso o discurso de odio",
  "Otro",
];

function ReportModal({ postId, onClose }) {
  const [reason, setReason]   = useState("");
  const [text, setText]       = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > 150;

  const send = async () => {
    if (!reason || sending) return;
    setSending(true);
    try {
      await reportArtwork(postId, reason, text.trim());
      setDone(true);
      setTimeout(onClose, 1400);
    } catch {
      setSending(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(20,17,15,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div onClick={e => e.stopPropagation()} className="stk" style={{ background: "var(--paper-2)", borderRadius: 18, padding: "18px 18px 14px", width: "100%" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <p className="serif" style={{ fontSize: 22, lineHeight: 1 }}>Denuncia enviada</p>
            <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 8 }}>// gracias por ayudar a mantener la comunidad</p>
          </div>
        ) : (
          <>
            <p className="serif" style={{ fontSize: 22, lineHeight: 1, marginBottom: 14 }}>Denunciar post</p>

            <p style={{ fontWeight: 800, fontSize: 11, marginBottom: 8 }}>Motivo</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {REPORT_REASONS.map(r => (
                <label key={r} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)}
                    style={{ accentColor: "var(--ink)", width: 16, height: 16, cursor: "pointer" }}/>
                  {r}
                </label>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <p style={{ fontWeight: 800, fontSize: 11 }}>Detalles <span style={{ fontWeight: 600, color: "rgba(20,17,15,.45)" }}>(opcional)</span></p>
                <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: overLimit ? "var(--coral)" : "rgba(20,17,15,.4)" }}>{wordCount} / 150 palabras</span>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Cuéntanos qué está mal con este post…"
                style={{ width: "100%", height: 72, border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, resize: "none", outline: "none", background: "var(--paper-2)", boxSizing: "border-box", color: overLimit ? "var(--coral)" : "inherit" }}
              />
            </div>

            <button
              onClick={send}
              disabled={!reason || overLimit || sending}
              style={{ width: "100%", height: 44, borderRadius: 12, border: "2px solid var(--ink)", background: "var(--coral)", color: "#fff", fontWeight: 800, fontSize: 13, cursor: !reason || overLimit ? "not-allowed" : "pointer", opacity: !reason || overLimit || sending ? 0.55 : 1, boxShadow: "3px 3px 0 var(--ink)", fontFamily: "Space Grotesk" }}>
              {sending ? "Enviando…" : "Enviar denuncia"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Edit modal ── */
function EditModal({ post, onClose, onSaved }) {
  const [prompt, setPrompt] = useState(post.prompt ?? "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await updateArtwork(post.id, { prompt }); onSaved({ ...post, prompt }); } catch {}
    setSaving(false);
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(20,17,15,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div onClick={e => e.stopPropagation()} className="stk" style={{ background: "var(--paper-2)", borderRadius: 18, padding: "20px 18px", width: "100%" }}>
        <p className="serif" style={{ fontSize: 22, lineHeight: 1, marginBottom: 14 }}>Editar obra</p>
        <label style={{ fontWeight: 800, fontSize: 11, display: "block", marginBottom: 6 }}>Descripción / reto</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          style={{ width: "100%", height: 80, border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, resize: "none", outline: "none", background: "var(--paper-2)", boxSizing: "border-box", marginBottom: 14 }}/>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, height: 40, border: "2px solid var(--ink)", borderRadius: 12, background: "var(--paper-2)", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "Space Grotesk" }}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{ flex: 1, height: 40, border: "2px solid var(--ink)", borderRadius: 12, background: "var(--acid)", fontWeight: 800, fontSize: 12, cursor: "pointer", opacity: saving ? 0.6 : 1, fontFamily: "Space Grotesk" }}>{saving ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Context menu ── */
function PostMenu({ isOwn, hidden, onEdit, onHide, onDelete, onFlag, onReport, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 20 }}/>
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", top: 32, right: 0, zIndex: 21,
        width: "fit-content", background: "var(--paper-2)",
        border: "2px solid var(--ink)", borderRadius: 14,
        boxShadow: "4px 4px 0 var(--ink)", overflow: "hidden",
      }}>
        {isOwn ? (
          <>
            <MenuRow icon={<IBrush s={15}/>} label="Editar" onClick={onEdit}/>
            <MenuRow icon={<IEyeOff s={15}/>} label={hidden ? "Mostrar" : "Ocultar"} onClick={onHide}/>
            <MenuRow icon={<ITrash s={15}/>} label="Eliminar" danger onClick={onDelete} last/>
          </>
        ) : (
          <>
            <MenuRow icon={<IFlag s={15}/>} label="No cumple el reto" onClick={onFlag}/>
            <MenuRow icon={<IFlag s={15}/>} label="Denunciar" danger onClick={onReport} last/>
          </>
        )}
      </div>
    </>
  );
}

function MenuRow({ icon, label, danger, onClick, last }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 16px",
        border: "none", borderBottom: last ? "none" : "1.5px solid rgba(20,17,15,.08)",
        background: hover ? "rgba(20,17,15,.04)" : "transparent",
        fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left",
        color: danger ? "var(--coral)" : "var(--ink)", whiteSpace: "nowrap",
        fontFamily: "Space Grotesk",
      }}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ── Main PostCard ──
   Used in feed (inline) and from profile grids (inside ArtworkModal bottom-sheet).
   isOwn, onRemove, onUpdate are optional — omit them in read-only contexts.        */
export function PostCard({ post, idx = 0, isOwn: isOwnProp, onRemove, onUpdate, triesLeft, onTryUsed, onViewAuthor }) {
  const { dispatch } = useApp();
  const isOwn = isOwnProp ?? (IS_LOGGED_IN && parseInt(post.author_id) === WP_USER_ID);

  const [likes,    setLikes]    = useState(post.likes    ?? 0);
  const [inspires, setInspires] = useState(post.inspires ?? 0);
  const [tries,    setTries]    = useState(post.tries    ?? 0);
  const [reacted,  setReacted]  = useState({
    like:    post.userReacted?.like    ?? false,
    inspire: post.userReacted?.inspire ?? false,
    try:     post.userReacted?.try     ?? false,
  });
  const [trySaved,      setTrySaved]      = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [confirmDel,    setConfirmDel]    = useState(false);
  const [editOpen,      setEditOpen]      = useState(false);
  const [reportOpen,    setReportOpen]    = useState(false);
  const [hidden,        setHidden]        = useState(post.hidden ?? false);
  const [deleted,       setDeleted]       = useState(false);
  const [localPrompt,   setLocalPrompt]   = useState(post.prompt ?? "");
  const caption = post.description ?? "";
  const [slide,         setSlide]         = useState(0);
  const menuRef = useRef(null);

  const tags   = post.variables ?? post.tags ?? [];
  const user   = post.username ?? post.user ?? "Artista";
  const tech   = post.technique ?? "";
  const rarity = post.rarity ?? "Común";
  const images = post.images?.length ? post.images : (post.image ? [post.image] : []);
  const col    = COL_CYCLE[idx % COL_CYCLE.length];
  const hasAuthor = !!post.author_id && !!onViewAuthor;

  const react = (type) => {
    const was = reacted[type];
    if (type === "try" && isOwn) return; // no auto-intentaré
    if (type === "try" && !was && triesLeft !== undefined && triesLeft <= 0) return;
    if (post.id) addReaction(post.id, type).catch(() => {});
    if (type === "like")    setLikes(n    => was ? n - 1 : n + 1);
    if (type === "inspire") setInspires(n => was ? n - 1 : n + 1);
    if (type === "try") {
      setTries(n => was ? n - 1 : n + 1);
      if (!was && IS_LOGGED_IN) {
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

  const handleDelete = async () => {
    try { await deleteArtwork(post.id); setDeleted(true); onRemove?.(post.id); } catch {}
    setConfirmDel(false);
  };

  const handleHide = async () => {
    try {
      const res = await hideArtwork(post.id);
      setHidden(res?.hidden ?? !hidden);
    } catch {}
    setMenuOpen(false);
  };

  if (deleted) {
    return (
      <div className="stk" style={{ background: "var(--paper-2)", borderRadius: 18, padding: "22px 18px", textAlign: "center", marginBottom: 14 }}>
        <p className="serif" style={{ fontSize: 22, margin: 0 }}>Post eliminado</p>
        <p className="mono" style={{ fontSize: 10, marginTop: 6, opacity: 0.5 }}>// removido permanentemente</p>
      </div>
    );
  }

  const reactions = [
    { Ico: IHeart,   count: likes,    type: "like",    bg: "var(--rose)",   active: reacted.like },
    { Ico: IInspire, count: inspires, type: "inspire", bg: "var(--lilac)",  active: reacted.inspire },
    { Ico: IFlame,   count: tries,    type: "try",     bg: "var(--butter)", active: reacted.try, disabled: isOwn },
  ];

  return (
    <div className="stk" style={{ background: "var(--paper-2)", padding: 0, borderRadius: 18, overflow: "hidden", marginBottom: 14, boxShadow: "var(--shadow-lg)", position: "relative" }}>

      {/* Hidden band — only owner sees this */}
      {isOwn && hidden && (
        <div style={{ background: "var(--coral)", color: "#fff", borderBottom: "2px solid var(--ink)", padding: "5px 14px", fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
          <IEyeOff s={12} stroke="#fff"/> Oculto · sólo tú lo ves
        </div>
      )}

      {/* Image area — full bleed */}
      <div style={{ position: "relative" }}>
        {images.length > 0 ? (
          <PostImages images={images} slide={slide} onSlide={setSlide}/>
        ) : (
          <div style={{ width: "100%", aspectRatio: "3/4", background: "var(--lilac)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 40, opacity: 0.3 }}>🖼</span>
          </div>
        )}

        {/* Gradient overlay — multiply dark-to-transparent */}
        <div aria-hidden style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "55%",
          background: "linear-gradient(to bottom, rgba(20,17,15,.85) 0%, rgba(20,17,15,.5) 40%, rgba(20,17,15,0) 100%)",
          mixBlendMode: "multiply", pointerEvents: "none",
        }}/>

        {/* Absolute header: avatar · user · tech/date · rarity · menu */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10, zIndex: 10 }}>
          <div
            onClick={hasAuthor ? onViewAuthor : undefined}
            style={{ width: 40, height: 40, borderRadius: 999, border: "2px solid rgba(255,255,255,.5)", background: col, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: hasAuthor ? "pointer" : "default", boxShadow: "2px 2px 0 rgba(0,0,0,.25)", overflow: "hidden" }}>
            {post.avatar_url
              ? <img src={post.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
              : <IUser s={20} stroke="#fff"/>
            }
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingTop: 1, cursor: hasAuthor ? "pointer" : "default" }} onClick={hasAuthor ? onViewAuthor : undefined}>
            <p style={{ fontWeight: 800, fontSize: 13, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,.4)", margin: 0 }}>{user}</p>
            <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.75)", margin: "2px 0 0", letterSpacing: "0.04em" }}>
              {[tech, timeAgo(post.date)].filter(Boolean).join(" · ").toUpperCase()}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
            <RarityBadge rarity={rarity}/>
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
                style={{ all: "unset", cursor: "pointer", width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <IDotsH s={20}/>
              </button>
              {menuOpen && (
                <PostMenu
                  isOwn={isOwn}
                  hidden={hidden}
                  onEdit={() => { setMenuOpen(false); setEditOpen(true); }}
                  onHide={handleHide}
                  onDelete={() => { setMenuOpen(false); setConfirmDel(true); }}
                  onFlag={() => { setMenuOpen(false); reportArtwork(post.id, "no_cumple").catch(() => {}); }}
                  onReport={() => { setMenuOpen(false); setReportOpen(true); }}
                  onClose={() => setMenuOpen(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Tags anchored at bottom of image */}
        {tags.length > 0 && (
          <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", flexWrap: "wrap", gap: 6, zIndex: 10 }}>
            {tags.map((t, i) => (
              <span key={i} style={{ background: "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 700, boxShadow: "2px 2px 0 var(--ink)" }}>
                {decodeTag(t)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Carousel dots — between image and reactions */}
      {images.length > 1 && (
        <CarouselDots count={images.length} current={slide} onSelect={setSlide}/>
      )}

      {/* Reactions */}
      <div style={{ display: "flex", gap: 8, padding: 12 }}>
        {reactions.map((b, j) => {
          const isTry = b.type === "try";
          const saved = isTry && trySaved;
          const blocked = (isTry && !reacted.try && triesLeft !== undefined && triesLeft <= 0) || b.disabled;
          return (
            <button
              key={j}
              onClick={() => react(b.type)}
              disabled={blocked}
              title={b.disabled ? "No puedes intentar tu propio reto" : undefined}
              style={{
                flex: 1, height: 38, borderRadius: 12, border: "2px solid var(--ink)",
                background: saved ? "var(--mint)" : b.active ? b.bg : "var(--paper-2)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontWeight: 800, fontSize: 12,
                boxShadow: b.active ? "3px 3px 0 var(--ink)" : "none",
                cursor: blocked ? "not-allowed" : "pointer",
                opacity: blocked ? 0.4 : 1,
                transition: "background .2s",
                fontFamily: "Space Grotesk",
              }}>
              <b.Ico s={15}/> {saved ? "Guardado" : b.count}
            </button>
          );
        })}
      </div>

      {/* Caption expandible debajo de las reacciones */}
      <ExpandableCaption username={user} text={caption}/>

      {/* Modals (scoped inside card so backdrop is card-sized) */}
      {confirmDel && <DeleteConfirm onConfirm={handleDelete} onCancel={() => setConfirmDel(false)}/>}
      {editOpen && (
        <EditModal
          post={{ ...post, prompt: localPrompt }}
          onClose={() => setEditOpen(false)}
          onSaved={updated => { setLocalPrompt(updated.prompt ?? ""); onUpdate?.(updated); }}
        />
      )}
      {reportOpen && <ReportModal postId={post.id} onClose={() => setReportOpen(false)}/>}
    </div>
  );
}

/* ── Bottom-sheet modal wrapper (used from profile grids) ── */
export function ArtworkModal({ post, onClose, col, triesLeft, onTryUsed, onViewAuthor }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const idx = col ? COL_CYCLE.indexOf(col) : (parseInt(post.author_id) || 0) % COL_CYCLE.length;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(20,17,15,.72)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, maxHeight: "94vh", overflowY: "auto", borderRadius: "22px 22px 0 0" }}>
        {/* Drag handle */}
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "rgba(255,255,255,.4)" }}/>
        </div>
        <PostCard
          post={post}
          idx={Math.max(0, idx)}
          triesLeft={triesLeft}
          onTryUsed={onTryUsed}
          onViewAuthor={onViewAuthor}
        />
      </div>
    </div>
  );
}
