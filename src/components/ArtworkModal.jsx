import { useState, useEffect, useRef } from "react";
import { RarityBadge } from "./RarityBadge";
import { useApp } from "../data/store";
import { useT } from "../i18n";
import { addReaction, useTryAPI, deleteArtwork, hideArtwork, reportArtwork, updateArtwork, fetchComments, postComment, deleteComment, translateText, IS_LOGGED_IN, WP_USER_ID } from "../utils/api";
import { IHeart, IInspire, IFlame, IUser, IBrush, IEyeOff, ITrash, IFlag, IArrowL, IArrowR, IComment, ITrash as ITrashIcon, IX } from "./Icons";

function decodeTag(t) {
  const raw = typeof t === "string" ? t : (t.value ?? "");
  return raw
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/u([0-9a-fA-F]{2}[89a-fA-F][0-9a-fA-F])/g, (match, h) => {
      const code = parseInt(h, 16);
      return code >= 0x80 ? String.fromCharCode(code) : match;
    });
}

function timeAgoFromT(dateStr, t) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return t("time.today");
  if (d === 1) return t("time.yesterday");
  if (d < 7)  return t("time.days", { n: d });
  const w = Math.floor(d / 7);
  if (w < 5)  return t("time.weeks", { n: w });
  const m = Math.floor(d / 30);
  if (m === 1) return t("time.month");
  return t("time.months", { n: m });
}

function timeAgoCommentFromT(dateStr, t) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr + "Z").getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return t("time.c.now");
  if (m < 60) return t("time.c.m", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("time.c.h", { n: h });
  return t("time.c.d", { n: Math.floor(h / 24) });
}

function triesKey() { return "inkrush_tries_" + new Date().toDateString(); }
function markLocalTry() {
  const used = parseInt(localStorage.getItem(triesKey()) || "0");
  localStorage.setItem(triesKey(), String(used + 1));
}

const COL_CYCLE = ["var(--rose)", "var(--lilac)", "var(--sky)", "var(--mint)", "var(--butter)", "var(--acid)"];

function IDotsH({ s = 20, color = "#fff" }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
      <circle cx="5" cy="12" r="2"/>
      <circle cx="12" cy="12" r="2"/>
      <circle cx="19" cy="12" r="2"/>
    </svg>
  );
}

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
          <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(20,17,15,.75)", color: "#fff", fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 10, letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 999, border: "1.5px solid var(--ink)", zIndex: 11 }}>
            {cur + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

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

function renderWithHashtags(text) {
  if (!text) return null;
  return text.split(/(#\w+)/g).map((part, i) =>
    part.startsWith("#")
      ? <span key={i} style={{ color: "var(--mint)", fontWeight: 700 }}>{part}</span>
      : part
  );
}

/* ── Translate button — shown when app language !== "es" ── */
function TranslateBtn({ text, lang }) {
  const t = useT();
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const handleTranslate = async () => {
    if (translation) {
      setShowTranslation(v => !v);
      return;
    }
    setLoading(true);
    try {
      const res = await translateText(text, lang);
      if (res?.translation) {
        setTranslation(res.translation);
        setShowTranslation(true);
      }
    } catch {}
    setLoading(false);
  };

  if (!text) return null;

  return (
    <div style={{ padding: "0 14px 10px" }}>
      {showTranslation && translation && (
        <div style={{ borderLeft: "3px solid var(--mint)", paddingLeft: 10, marginBottom: 8, fontSize: 13, lineHeight: 1.45, fontStyle: "italic", color: "rgba(20,17,15,.8)", fontWeight: 500 }}>
          {translation}
        </div>
      )}
      <button
        onClick={handleTranslate}
        disabled={loading}
        style={{ all: "unset", cursor: loading ? "default" : "pointer", fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 9, color: "rgba(20,17,15,.5)", letterSpacing: "0.04em", opacity: loading ? 0.5 : 1 }}
      >
        🌐 {loading ? t("translate.loading") : showTranslation ? t("translate.showOriginal") : t("translate.btn")}
      </button>
    </div>
  );
}

function ExpandableCaption({ username, text }) {
  const t = useT();
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
        {expanded && <>{" "}<button onClick={() => setExpanded(false)} style={linkStyle}>{t("post.caption.less")}</button></>}
      </p>
      {!expanded && overflows && (
        <button onClick={() => setExpanded(true)} style={{ ...linkStyle, marginTop: 2, display: "block" }}>{t("post.caption.more")}</button>
      )}
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel }) {
  const t = useT();
  return (
    <div onClick={onCancel} style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(20,17,15,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div onClick={e => e.stopPropagation()} className="stk" style={{ background: "var(--paper-2)", borderRadius: 18, padding: "18px 18px 14px", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ width: 34, height: 34, borderRadius: 999, background: "var(--coral)", border: "2px solid var(--ink)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, flexShrink: 0 }}>!</span>
          <p className="serif" style={{ fontSize: 22, lineHeight: 1, margin: 0 }}>{t("delete.title")}</p>
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.45, marginTop: 6, marginBottom: 14, color: "rgba(20,17,15,.7)", fontWeight: 600 }}>
          {t("delete.warning")}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 40, borderRadius: 12, border: "2px solid var(--ink)", background: "var(--paper-2)", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "Space Grotesk" }}>
            {t("delete.cancel")}
          </button>
          <button onClick={onConfirm} style={{ flex: 1, height: 40, borderRadius: 12, border: "2px solid var(--ink)", background: "var(--coral)", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer", boxShadow: "3px 3px 0 var(--ink)", fontFamily: "Space Grotesk" }}>
            {t("delete.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ postId, onClose }) {
  const t = useT();
  const REPORT_REASONS = [
    { key: "offensive",  label: t("report.reason.offensive") },
    { key: "spam",       label: t("report.reason.spam") },
    { key: "copy",       label: t("report.reason.copy") },
    { key: "harassment", label: t("report.reason.harassment") },
    { key: "other",      label: t("report.reason.other") },
  ];
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
            <p className="serif" style={{ fontSize: 22, lineHeight: 1 }}>{t("report.sent.title")}</p>
            <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 8 }}>{t("report.sent.sub")}</p>
          </div>
        ) : (
          <>
            <p className="serif" style={{ fontSize: 22, lineHeight: 1, marginBottom: 14 }}>{t("report.title")}</p>

            <p style={{ fontWeight: 800, fontSize: 11, marginBottom: 8 }}>{t("report.reason.label")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {REPORT_REASONS.map(r => (
                <label key={r.key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                  <input type="radio" name="reason" value={r.key} checked={reason === r.key} onChange={() => setReason(r.key)}
                    style={{ accentColor: "var(--ink)", width: 16, height: 16, cursor: "pointer" }}/>
                  {r.label}
                </label>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <p style={{ fontWeight: 800, fontSize: 11 }}>{t("report.details.label")} <span style={{ fontWeight: 600, color: "rgba(20,17,15,.45)" }}>{t("report.details.optional")}</span></p>
                <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: overLimit ? "var(--coral)" : "rgba(20,17,15,.4)" }}>{t("report.words", { n: wordCount })}</span>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={t("report.details.placeholder")}
                style={{ width: "100%", height: 72, border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, resize: "none", outline: "none", background: "var(--paper-2)", boxSizing: "border-box", color: overLimit ? "var(--coral)" : "inherit" }}
              />
            </div>

            <button
              onClick={send}
              disabled={!reason || overLimit || sending}
              style={{ width: "100%", height: 44, borderRadius: 12, border: "2px solid var(--ink)", background: "var(--coral)", color: "#fff", fontWeight: 800, fontSize: 13, cursor: !reason || overLimit ? "not-allowed" : "pointer", opacity: !reason || overLimit || sending ? 0.55 : 1, boxShadow: "3px 3px 0 var(--ink)", fontFamily: "Space Grotesk" }}>
              {sending ? t("report.sending") : t("report.send")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function EditModal({ post, onClose, onSaved }) {
  const t = useT();
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
        <p className="serif" style={{ fontSize: 22, lineHeight: 1, marginBottom: 14 }}>{t("post.edit.title")}</p>
        <label style={{ fontWeight: 800, fontSize: 11, display: "block", marginBottom: 6 }}>{t("post.edit.desc")}</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          style={{ width: "100%", height: 80, border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, resize: "none", outline: "none", background: "var(--paper-2)", boxSizing: "border-box", marginBottom: 14 }}/>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, height: 40, border: "2px solid var(--ink)", borderRadius: 12, background: "var(--paper-2)", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "Space Grotesk" }}>{t("post.edit.cancel")}</button>
          <button onClick={save} disabled={saving} style={{ flex: 1, height: 40, border: "2px solid var(--ink)", borderRadius: 12, background: "var(--acid)", fontWeight: 800, fontSize: 12, cursor: "pointer", opacity: saving ? 0.6 : 1, fontFamily: "Space Grotesk" }}>{saving ? t("post.edit.saving") : t("post.edit.save")}</button>
        </div>
      </div>
    </div>
  );
}

function PostMenu({ isOwn, hidden, onEdit, onHide, onDelete, onFlag, onReport, onClose }) {
  const t = useT();
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
            <MenuRow icon={<IBrush s={15}/>} label={t("post.menu.edit")} onClick={onEdit}/>
            <MenuRow icon={<IEyeOff s={15}/>} label={hidden ? t("post.menu.show") : t("post.menu.hide")} onClick={onHide}/>
            <MenuRow icon={<ITrash s={15}/>} label={t("post.menu.delete")} danger onClick={onDelete} last/>
          </>
        ) : (
          <>
            <MenuRow icon={<IFlag s={15}/>} label={t("post.menu.flag")} onClick={onFlag}/>
            <MenuRow icon={<IFlag s={15}/>} label={t("post.menu.report")} danger onClick={onReport} last/>
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

function CommentItem({ comment, artworkId, onDeleted, onViewUser }) {
  const t = useT();
  const [deleting, setDeleting] = useState(false);
  const [gone,     setGone]     = useState(false);

  if (gone) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteComment(artworkId, comment.id);
      setGone(true);
      onDeleted?.(comment.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <div style={{ width: 30, height: 30, borderRadius: 999, border: "1.5px solid var(--ink)", background: "var(--lilac)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {comment.avatar
          ? <img src={comment.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          : <IUser s={14}/>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span
            style={{ fontWeight: 800, fontSize: 12, cursor: onViewUser && comment.author_id ? "pointer" : "default", textDecoration: onViewUser && comment.author_id ? "underline" : "none" }}
            onClick={onViewUser && comment.author_id ? () => onViewUser(comment.author_id) : undefined}
          >{comment.author}</span>
          <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>{timeAgoCommentFromT(comment.date, t)}</span>
        </div>
        <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 500, lineHeight: 1.4, wordBreak: "break-word" }}>{comment.text}</p>
      </div>
      {comment.isOwn && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          title={t("delete.confirm")}
          style={{ all: "unset", cursor: "pointer", opacity: deleting ? 0.4 : 0.5, padding: "2px 4px", flexShrink: 0 }}>
          <ITrashIcon s={13}/>
        </button>
      )}
    </div>
  );
}

function CommentsSection({ artworkId, initialCount = 0, defaultOpen = false, onViewUser }) {
  const t = useT();
  const { state } = useApp();
  const [open,     setOpen]     = useState(defaultOpen);
  const [comments, setComments] = useState([]);
  const [count,    setCount]    = useState(initialCount);
  const [loaded,   setLoaded]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [text,     setText]     = useState("");
  const [posting,  setPosting]  = useState(false);
  const inputRef = useRef(null);

  const load = async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const res = await fetchComments(artworkId);
      if (res?.comments) {
        setComments(res.comments);
        setCount(res.comments.length);
        setLoaded(true);
      }
    } catch {}
    setLoading(false);
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  useEffect(() => {
    if (defaultOpen) load();
  }, []);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      const c = await postComment(artworkId, trimmed);
      if (c?.id) {
        setComments(cs => [...cs, c]);
        setCount(n => n + 1);
        setText("");
      }
    } catch {}
    setPosting(false);
  };

  const onDeleted = () => {
    setCount(n => Math.max(0, n - 1));
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const toggleLabel = count === 0
    ? t("comments.toggle.zero")
    : count === 1
    ? t("comments.toggle.one")
    : t("comments.toggle.many", { n: count });

  return (
    <div style={{ borderTop: "1.5px solid rgba(20,17,15,.1)", marginTop: 2 }}>
      <button
        onClick={toggle}
        style={{
          all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          padding: "10px 14px", width: "100%", boxSizing: "border-box",
        }}>
        <IComment s={14}/>
        <span style={{ fontWeight: 700, fontSize: 12 }}>{toggleLabel}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(20,17,15,.45)", fontWeight: 700 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          {loading && (
            <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.4)", marginBottom: 10 }}>{t("comments.loading")}</p>
          )}

          {loaded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: comments.length > 0 ? 14 : 0 }}>
              {comments.map(c => (
                <CommentItem key={c.id} comment={c} artworkId={artworkId} onDeleted={onDeleted} onViewUser={onViewUser}/>
              ))}
              {comments.length === 0 && (
                <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.35)", textAlign: "center", margin: "4px 0 12px" }}>
                  {t("comments.empty")}
                </p>
              )}
            </div>
          )}

          {IS_LOGGED_IN && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
                placeholder={t("comments.placeholder")}
                rows={1}
                style={{
                  flex: 1, border: "2px solid var(--ink)", borderRadius: 12, padding: "8px 12px",
                  fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, resize: "none",
                  outline: "none", background: "var(--paper-2)", boxSizing: "border-box",
                  lineHeight: 1.4, minHeight: 38, maxHeight: 90, overflowY: "auto",
                }}
              />
              <button
                onClick={submit}
                disabled={!text.trim() || posting}
                style={{
                  height: 38, padding: "0 14px", borderRadius: 12, border: "2px solid var(--ink)",
                  background: text.trim() ? "var(--ink)" : "var(--paper-2)",
                  color: text.trim() ? "var(--acid)" : "rgba(20,17,15,.3)",
                  fontWeight: 800, fontSize: 12, cursor: text.trim() ? "pointer" : "not-allowed",
                  flexShrink: 0, fontFamily: "Space Grotesk",
                  transition: "background .15s",
                }}>
                {posting ? "…" : t("comments.submit")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PostCard({ post, idx = 0, isOwn: isOwnProp, onRemove, onUpdate, triesLeft, onTryUsed, onViewAuthor, commentsOpen = false }) {
  const { state, dispatch } = useApp();
  const t = useT();
  const isOwn = isOwnProp ?? (IS_LOGGED_IN && parseInt(post.author_id) === WP_USER_ID);
  const showTranslate = state.lang !== "es";

  const viewUser = (userId) => {
    if (!userId) return;
    const uid = parseInt(userId);
    if (IS_LOGGED_IN && uid === WP_USER_ID) {
      dispatch({ type: "SET_SCREEN", screen: "profile" });
    } else {
      dispatch({ type: "VIEW_USER", userId: uid });
    }
  };

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
    if (type === "try" && isOwn) return;
    if (type === "try" && !was && triesLeft !== undefined && triesLeft <= 0) return;
    if (post.id) addReaction(post.id, type).catch(() => {});
    if (type === "like")    setLikes(n    => was ? n - 1 : n + 1);
    if (type === "inspire") setInspires(n => was ? n - 1 : n + 1);
    if (type === "try") {
      setTries(n => was ? n - 1 : n + 1);
      if (!was) {
        markLocalTry();
        onTryUsed?.();
        if (IS_LOGGED_IN) {
          const variables = tags.map(t => ({ value: decodeTag(t), rarity: typeof t === "object" && t.rarity ? t.rarity : "Común" }));
          dispatch({ type: "SAVE_IDEA", idea: { variables, params: post.params ?? [] } });
          useTryAPI(variables)
            .then(res => { if (typeof res?.left === "number") onTryUsed?.(res.left); })
            .catch(() => {});
        }
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
        <p className="serif" style={{ fontSize: 22, margin: 0 }}>{t("post.deleted.title")}</p>
        <p className="mono" style={{ fontSize: 10, marginTop: 6, opacity: 0.5 }}>{t("post.deleted.sub")}</p>
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

      {isOwn && hidden && (
        <div style={{ background: "var(--coral)", color: "#fff", borderBottom: "2px solid var(--ink)", padding: "5px 14px", fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
          <IEyeOff s={12} stroke="#fff"/> {t("post.hidden.label")}
        </div>
      )}

      <div style={{ position: "relative" }}>
        {images.length > 0 ? (
          <PostImages images={images} slide={slide} onSlide={setSlide}/>
        ) : (
          <div style={{ width: "100%", aspectRatio: "3/4", background: "var(--lilac)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 40, opacity: 0.3 }}>🖼</span>
          </div>
        )}

        <div aria-hidden style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "55%",
          background: "linear-gradient(to bottom, rgba(20,17,15,.85) 0%, rgba(20,17,15,.5) 40%, rgba(20,17,15,0) 100%)",
          mixBlendMode: "multiply", pointerEvents: "none",
        }}/>

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
              {[tech, timeAgoFromT(post.date, t)].filter(Boolean).join(" · ").toUpperCase()}
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

        {tags.length > 0 && (
          <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", flexWrap: "wrap", gap: 6, zIndex: 10 }}>
            {tags.map((tag, i) => (
              <span key={i} style={{ background: "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 700, boxShadow: "2px 2px 0 var(--ink)" }}>
                {decodeTag(tag)}
              </span>
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <CarouselDots count={images.length} current={slide} onSelect={setSlide}/>
      )}

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
              title={b.disabled ? t("post.noTryOwn") : undefined}
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
              <b.Ico s={15}/> {saved ? t("post.reactions.saved") : b.count}
            </button>
          );
        })}
      </div>

      <ExpandableCaption username={user} text={caption}/>

      {showTranslate && caption && (
        <TranslateBtn text={caption} lang={state.lang}/>
      )}

      {post.id && (
        <CommentsSection
          artworkId={post.id}
          initialCount={post.comment_count ?? 0}
          defaultOpen={commentsOpen}
          onViewUser={viewUser}
        />
      )}

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

export function ArtworkModal({ post, onClose, col, triesLeft, onTryUsed, onViewAuthor }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const idx = col ? COL_CYCLE.indexOf(col) : (parseInt(post.author_id) || 0) % COL_CYCLE.length;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
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
          idx={Math.max(0, idx)}
          triesLeft={triesLeft}
          onTryUsed={onTryUsed}
          onViewAuthor={onViewAuthor}
          commentsOpen
        />
      </div>
    </div>
  );
}
