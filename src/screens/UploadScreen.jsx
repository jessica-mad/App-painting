import { useState, useRef, useCallback } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { TECHNIQUES, getUserLevel } from "../data/parameters";
import { createArtwork, IS_LOGGED_IN } from "../utils/api";
import { IArrowL, IArrowR, IBrush, ICam, ILock, IShare } from "../components/Icons";
import { useT } from "../i18n";

const TECH_COLORS = {
  acuarela: "var(--sky)", tinta: "var(--paper-2)", lapiz: "var(--paper-2)",
  carbon: "var(--lilac)", pastel: "var(--rose)", oleo: "var(--mint)",
  digital: "var(--butter)", gouache: "var(--coral)", marcador: "var(--paper-2)",
};

const MAX_PHOTOS = 5;
/* Output resolution of the cropped image */
const CROP_OUT_W = 900;
const CROP_OUT_H = 1200;

/* ── Crop modal ─────────────────────────────────────────────────────────── */
function CropModal({ src, naturalW, naturalH, onConfirm, onCancel, t }) {
  /* Container display size – 3:4, as wide as screen allows */
  const CONT_W = Math.min(300, (typeof window !== "undefined" ? window.innerWidth : 390) - 48);
  const CONT_H = Math.round(CONT_W * 4 / 3);

  /* Scale so the image fully covers the container (like object-fit: cover) */
  const baseScale = Math.max(CONT_W / naturalW, CONT_H / naturalH);

  const [offset, setOffset] = useState(() => ({
    x: (CONT_W - naturalW * baseScale) / 2,
    y: (CONT_H - naturalH * baseScale) / 2,
  }));
  const [userScale, setUserScale] = useState(1);

  const dragRef  = useRef(null);
  const pinchRef = useRef(null);

  /* Keep image clamped so it always covers the crop frame */
  const clamp = useCallback((ox, oy, us) => {
    const imgW = naturalW * baseScale * us;
    const imgH = naturalH * baseScale * us;
    return {
      x: Math.max(CONT_W - imgW, Math.min(0, ox)),
      y: Math.max(CONT_H - imgH, Math.min(0, oy)),
    };
  }, [naturalW, naturalH, baseScale, CONT_W, CONT_H]);

  /* Mouse events (desktop) */
  const onMouseDown = (e) => {
    e.preventDefault();
    dragRef.current = { sx: e.clientX - offset.x, sy: e.clientY - offset.y };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    setOffset(clamp(e.clientX - dragRef.current.sx, e.clientY - dragRef.current.sy, userScale));
  };
  const onMouseUp = () => { dragRef.current = null; };

  /* Touch events (mobile) */
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      dragRef.current = { sx: e.touches[0].clientX - offset.x, sy: e.touches[0].clientY - offset.y };
    } else if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      pinchRef.current = { d, scale: userScale };
    }
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragRef.current) {
      const nx = e.touches[0].clientX - dragRef.current.sx;
      const ny = e.touches[0].clientY - dragRef.current.sy;
      setOffset(clamp(nx, ny, userScale));
    } else if (e.touches.length === 2 && pinchRef.current) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const ns = Math.max(1, Math.min(4, pinchRef.current.scale * (d / pinchRef.current.d)));
      setUserScale(ns);
      setOffset(prev => clamp(prev.x, prev.y, ns));
    }
  };
  const onTouchEnd = (e) => {
    if (e.touches.length === 0) { dragRef.current = null; pinchRef.current = null; }
  };

  /* Render crop to canvas */
  const confirm = () => {
    const canvas = document.createElement("canvas");
    canvas.width  = CROP_OUT_W;
    canvas.height = CROP_OUT_H;
    const ctx = canvas.getContext("2d");
    const totalScale = baseScale * userScale;
    /* Translate display offset → source image coordinates */
    const srcX = -offset.x / totalScale;
    const srcY = -offset.y / totalScale;
    const srcW = CONT_W  / totalScale;
    const srcH = CONT_H  / totalScale;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, CROP_OUT_W, CROP_OUT_H);
      onConfirm(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.src = src;
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(20,17,15,.94)", zIndex: 600, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}
    >
      <p className="serif" style={{ color: "#fff", fontSize: 22, lineHeight: 1, marginBottom: 16 }}>{t("upload.adjust.title")}</p>

      {/* Crop frame */}
      <div
        style={{ width: CONT_W, height: CONT_H, overflow: "hidden", position: "relative", border: "3px solid var(--acid)", borderRadius: 14, cursor: "grab", touchAction: "none", userSelect: "none" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            width:  naturalW * baseScale * userScale,
            height: naturalH * baseScale * userScale,
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: "0 0",
            display: "block",
            pointerEvents: "none",
          }}
        />
        {/* Rule-of-thirds overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
          backgroundSize: `${CONT_W / 3}px ${CONT_H / 3}px`,
        }}/>
        {/* Corner marks */}
        {[["0 0","top","left"],["0 0","top","right"],["0 0","bottom","left"],["0 0","bottom","right"]].map(([,v,h],i) => (
          <div key={i} style={{ position:"absolute", [v]: 0, [h]: 0, width: 22, height: 22, borderTop: v==="top" ? "3px solid var(--acid)" : "none", borderBottom: v==="bottom" ? "3px solid var(--acid)" : "none", borderLeft: h==="left" ? "3px solid var(--acid)" : "none", borderRight: h==="right" ? "3px solid var(--acid)" : "none", pointerEvents:"none" }}/>
        ))}
      </div>

      <p className="mono" style={{ color: "rgba(255,255,255,.38)", fontSize: 9, fontWeight: 700, marginTop: 10, letterSpacing: "0.06em" }}>
        {t("upload.adjust.hint")}
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <button
          onClick={onCancel}
          style={{ padding: "12px 26px", borderRadius: 14, border: "2px solid rgba(255,255,255,.25)", background: "transparent", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
        >{t("upload.adjust.cancel")}</button>
        <button
          onClick={confirm}
          className="stk"
          style={{ padding: "12px 26px", borderRadius: 14, border: "2px solid var(--acid)", background: "var(--acid)", color: "var(--ink)", fontWeight: 800, fontSize: 14, cursor: "pointer" }}
        >{t("upload.adjust.confirm")}</button>
      </div>
    </div>
  );
}

/* ── Photo carousel ─────────────────────────────────────────────────────── */
function PhotoCarousel({ images, onRemove }) {
  const [idx, setIdx] = useState(0);
  const cur = Math.min(idx, images.length - 1);

  return (
    <div style={{ position: "relative", width: "100%", maxHeight: 260, aspectRatio: "3/4", borderRadius: 18, border: "2px solid var(--ink)", overflow: "hidden", background: "var(--ink)" }}>
      <img src={images[cur]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>

      <div style={{ position: "absolute", top: 10, left: 10, background: "var(--ink)", color: "var(--acid)", borderRadius: 999, padding: "3px 8px", fontSize: 11, fontWeight: 800 }}>
        {cur + 1}/{images.length}
      </div>

      <button
        onClick={() => { onRemove(cur); setIdx(Math.max(0, cur - 1)); }}
        style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 999, background: "var(--rose)", border: "2px solid var(--ink)", fontWeight: 900, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
      >×</button>

      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            disabled={cur === 0}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: 999, background: "var(--paper-2)", border: "2px solid var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: cur === 0 ? 0.3 : 1 }}
          ><IArrowL s={16}/></button>
          <button
            onClick={() => setIdx(i => Math.min(images.length - 1, i + 1))}
            disabled={cur === images.length - 1}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: 999, background: "var(--paper-2)", border: "2px solid var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: cur === images.length - 1 ? 0.3 : 1 }}
          ><IArrowR s={16}/></button>
          <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} style={{ width: i === cur ? 16 : 6, height: 6, borderRadius: 999, border: "1.5px solid var(--ink)", background: i === cur ? "var(--acid)" : "rgba(255,255,255,.6)", cursor: "pointer", padding: 0, transition: "width .15s" }}/>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main screen ────────────────────────────────────────────────────────── */
export function UploadScreen() {
  const { state, dispatch } = useApp();
  const t = useT();
  const { profile, currentIdea } = state;
  const [technique,   setTechnique]   = useState(TECHNIQUES[0].id);
  const [description, setDescription] = useState("");
  const [images,      setImages]      = useState([]);
  const [cropQueue,   setCropQueue]   = useState([]); /* [{src, naturalW, naturalH}] */
  const [saving,      setSaving]      = useState(false);
  const [done,        setDone]        = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileRef = useRef(null);

  const level       = getUserLevel(profile.completedChallenges);
  const canVideo    = profile.completedChallenges >= 10;
  const videoNeeded = Math.max(0, 10 - profile.completedChallenges);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_PHOTOS - images.length - cropQueue.length;
    const toProcess = files.slice(0, remaining);

    /* Load each file to get natural dimensions, then queue for cropping */
    toProcess.forEach(file => {
      const src = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setCropQueue(q => [...q, { src, naturalW: img.naturalWidth, naturalH: img.naturalHeight }]);
      };
      img.src = src;
    });
    e.target.value = "";
  };

  const handleCropConfirm = (croppedB64) => {
    setImages(prev => [...prev, croppedB64]);
    setCropQueue(q => { URL.revokeObjectURL(q[0].src); return q.slice(1); });
  };

  const handleCropCancel = () => {
    setCropQueue(q => { URL.revokeObjectURL(q[0].src); return q.slice(1); });
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const publish = async () => {
    setSaving(true);
    setUploadError(null);
    try {
      if (IS_LOGGED_IN && currentIdea) {
        await createArtwork({
          prompt:      currentIdea.variables.map(v => v.value).join(" + "),
          variables:   currentIdea.variables.map(v => v.value),
          params:      currentIdea.params,
          rarity:      currentIdea.variables[0]?.rarity ?? "Común",
          technique:   TECHNIQUES.find(tech => tech.id === technique)?.label ?? technique,
          description,
          images,
        });
      }
      setDone(true);
      setTimeout(() => dispatch({ type: "SET_SCREEN", screen: "feed" }), 1600);
    } catch (err) {
      setSaving(false);
      setUploadError(err?.message || t("upload.error"));
    }
  };

  /* Success screen */
  if (done) {
    return (
      <Phone>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 22px" }}>
          <div className="stk-lg" style={{ background: "var(--acid)", padding: "36px 24px", textAlign: "center", position: "relative", overflow: "hidden", width: "100%" }}>
            <div className="stripes-y" style={{ position: "absolute", inset: 0, opacity: 0.4 }}/>
            <div style={{ position: "relative" }}>
              <p className="serif" style={{ fontSize: 72, lineHeight: 1 }}>🚀</p>
              <h2 className="serif" style={{ fontSize: 36, lineHeight: 1, marginTop: 12 }}>{t("upload.success.title")}</h2>
              <p style={{ fontSize: 13, fontWeight: 600, marginTop: 12, color: "rgba(20,17,15,.65)" }}>{t("upload.success.sub")}</p>
              <div className="perforated" style={{ margin: "20px 0 16px" }}/>
              <button
                onClick={() => dispatch({ type: "SET_SCREEN", screen: "feed" })}
                className="stk"
                style={{ width: "100%", height: 52, background: "var(--ink)", color: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}
              >
                {t("upload.success.feed")} <IArrowR s={18} stroke="var(--acid)"/>
              </button>
            </div>
          </div>
        </div>
      </Phone>
    );
  }

  return (
    <Phone>
      {/* Crop modal rendered over the Phone */}
      {cropQueue.length > 0 && (
        <CropModal
          src={cropQueue[0].src}
          naturalW={cropQueue[0].naturalW}
          naturalH={cropQueue[0].naturalH}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          t={t}
        />
      )}

      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles}/>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "8px 22px 22px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "timer" })}
            style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, padding: 0, cursor: "pointer" }}
          >
            <IArrowL s={16}/> {t("upload.back")}
          </button>
          <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IBrush s={12} stroke="var(--acid)"/> {t(`level.${level.id}`)}
          </span>
        </div>

        <h2 className="serif" style={{ fontSize: 30, marginTop: 8, lineHeight: 1 }}>{t("upload.title")}</h2>
        <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>{t("upload.subtitle")}</p>

        <div className="scroll" style={{ flex: 1, marginTop: 14 }}>
          {/* Photo zone */}
          {images.length > 0 ? (
            <div>
              <PhotoCarousel images={images} onRemove={removeImage}/>
              {images.length < MAX_PHOTOS && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="stk-sm"
                  style={{ width: "100%", height: 44, marginTop: 10, border: "2px dashed var(--ink)", background: "var(--paper-2)", borderRadius: 12, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                >
                  <ICam s={16}/> {t("upload.add.photo", { n: images.length, max: MAX_PHOTOS })}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="stk"
              style={{ width: "100%", height: 220, border: "3px dashed var(--ink)", background: "var(--rose)", borderRadius: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", overflow: "hidden", cursor: "pointer" }}
            >
              <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.2 }}/>
              <div style={{ width: 56, height: 56, borderRadius: 14, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <ICam s={28}/>
              </div>
              <p style={{ fontWeight: 800, fontSize: 13, position: "relative" }}>{t("upload.tap.hint")}</p>
              <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>{t("upload.formats")}</p>
            </button>
          )}

          {/* Prompt tags */}
          {currentIdea && (
            <div className="stk-sm" style={{ background: "var(--paper-2)", padding: 12, marginTop: 14 }}>
              <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>{t("upload.challenge.done")}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {currentIdea.variables.map(v => (
                  <span key={v.value} style={{ background: "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>
                    {v.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Technique */}
          <p style={{ fontWeight: 800, fontSize: 12, marginTop: 16, marginBottom: 8 }}>{t("upload.technique.label")}</p>
          <div className="scroll" style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
            {TECHNIQUES.map(tech => (
              <button
                key={tech.id}
                onClick={() => setTechnique(tech.id)}
                style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 12, border: "2px solid var(--ink)", background: technique === tech.id ? (TECH_COLORS[tech.id] || "var(--acid)") : "var(--paper-2)", fontSize: 11, fontWeight: 700, boxShadow: technique === tech.id ? "3px 3px 0 var(--ink)" : "none", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
              >
                <IBrush s={13}/> {tech.label}
              </button>
            ))}
          </div>

          {/* Description */}
          <p style={{ fontWeight: 800, fontSize: 12, marginTop: 16, marginBottom: 6 }}>
            {t("upload.desc.label")} <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.45)" }}>{t("upload.desc.optional")}</span>
          </p>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t("upload.desc.placeholder")}
            style={{ width: "100%", height: 84, border: "2px solid var(--ink)", borderRadius: 14, padding: 12, fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 12, resize: "none", outline: "none", background: "var(--paper-2)" }}
          />

          {/* Video */}
          <p style={{ fontWeight: 800, fontSize: 12, marginTop: 12, marginBottom: 8 }}>{t("timer.setup.video")}</p>
          {canVideo ? (
            <button className="stk-sm" style={{ width: "100%", height: 48, background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 12, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
              <ICam s={18}/> {t("timer.setup.video.add")}
            </button>
          ) : (
            <div className="stk-sm" style={{ background: "#EFEAD8", padding: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ILock s={18}/>
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 12 }}>{t("timer.setup.video.locked")}</p>
                  <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.55)" }}>{t("timer.setup.video.unlock", { n: videoNeeded, s: videoNeeded !== 1 ? "S" : "" })}</p>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 999, border: "1.5px solid var(--ink)", background: "var(--paper-2)", overflow: "hidden" }}>
                <div style={{ width: `${(profile.completedChallenges / 10) * 100}%`, height: "100%", background: "var(--acid)" }}/>
              </div>
              <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)", marginTop: 4 }}>{profile.completedChallenges}/10 {t("upload.challenge.done").replace("// ", "").toUpperCase()}</p>
            </div>
          )}
        </div>

        {uploadError && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--rose)", border: "2px solid var(--ink)", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4 }}>
            ⚠ {uploadError}
          </div>
        )}
        <button
          onClick={publish}
          disabled={saving || images.length === 0}
          className="stk"
          style={{ marginTop: 10, height: 54, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", cursor: saving || images.length === 0 ? "not-allowed" : "pointer", opacity: saving || images.length === 0 ? 0.45 : 1 }}
        >
          <IShare s={18}/> {saving ? t("upload.publishing") : t("upload.publish")}
        </button>
        <button
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "feed" })}
          disabled={saving}
          style={{ marginTop: 8, height: 44, background: "transparent", border: "2px solid rgba(20,17,15,.25)", borderRadius: 14, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.4 : 1 }}
        >
          {t("common.cancel")}
        </button>
      </div>
    </Phone>
  );
}
