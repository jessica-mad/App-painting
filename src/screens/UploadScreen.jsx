import { useState, useRef } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { TECHNIQUES, getUserLevel } from "../data/parameters";
import { createArtwork, IS_LOGGED_IN } from "../utils/api";
import { compressImages } from "../utils/imageUtils";
import { IArrowL, IArrowR, IBrush, ICam, ILock, IShare } from "../components/Icons";

const TECH_COLORS = {
  acuarela: "var(--sky)", tinta: "var(--paper-2)", lapiz: "var(--paper-2)",
  carbon: "var(--lilac)", pastel: "var(--rose)", oleo: "var(--mint)",
  digital: "var(--butter)", gouache: "var(--coral)", marcador: "var(--paper-2)",
};

const MAX_PHOTOS = 5;

function PhotoCarousel({ images, onRemove }) {
  const [idx, setIdx] = useState(0);
  const cur = Math.min(idx, images.length - 1);

  return (
    <div style={{ position: "relative", width: "100%", maxHeight: 260, aspectRatio: "3/4", borderRadius: 18, border: "2px solid var(--ink)", overflow: "hidden", background: "var(--ink)" }}>
      {/* Image */}
      <img
        src={images[cur]}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />

      {/* Counter badge */}
      <div style={{ position: "absolute", top: 10, left: 10, background: "var(--ink)", color: "var(--acid)", borderRadius: 999, padding: "3px 8px", fontSize: 11, fontWeight: 800 }}>
        {cur + 1}/{images.length}
      </div>

      {/* Remove button */}
      <button
        onClick={() => { onRemove(cur); setIdx(Math.max(0, cur - 1)); }}
        style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 999, background: "var(--rose)", border: "2px solid var(--ink)", fontWeight: 900, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
      >×</button>

      {/* Arrows */}
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
        </>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{ width: i === cur ? 16 : 6, height: 6, borderRadius: 999, border: "1.5px solid var(--ink)", background: i === cur ? "var(--acid)" : "rgba(255,255,255,.6)", cursor: "pointer", padding: 0, transition: "width .15s" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function UploadScreen() {
  const { state, dispatch } = useApp();
  const { profile, currentIdea } = state;
  const [technique, setTechnique] = useState(TECHNIQUES[0].id);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const level       = getUserLevel(profile.completedChallenges);
  const canVideo    = profile.completedChallenges >= 10;
  const videoNeeded = Math.max(0, 10 - profile.completedChallenges);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setCompressing(true);
    const remaining = MAX_PHOTOS - images.length;
    const toProcess = files.slice(0, remaining);
    const compressed = await compressImages(toProcess);
    setImages(prev => [...prev, ...compressed]);
    setCompressing(false);
    e.target.value = "";
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const publish = async () => {
    setSaving(true);
    try {
      if (IS_LOGGED_IN && currentIdea) {
        await createArtwork({
          prompt:      currentIdea.variables.map(v => v.value).join(" + "),
          variables:   currentIdea.variables.map(v => v.value),
          params:      currentIdea.params,
          rarity:      currentIdea.variables[0]?.rarity ?? "Común",
          technique:   TECHNIQUES.find(t => t.id === technique)?.label ?? technique,
          description,
          images,
        });
      }
      setDone(true);
      setTimeout(() => dispatch({ type: "SET_SCREEN", screen: "feed" }), 1600);
    } catch {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Phone>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 22px" }}>
          <div className="stk-lg" style={{ background: "var(--acid)", padding: "36px 24px", textAlign: "center", position: "relative", overflow: "hidden", width: "100%" }}>
            <div className="stripes-y" style={{ position: "absolute", inset: 0, opacity: 0.4 }}/>
            <div style={{ position: "relative" }}>
              <p className="serif" style={{ fontSize: 72, lineHeight: 1 }}>🚀</p>
              <h2 className="serif" style={{ fontSize: 36, lineHeight: 1, marginTop: 12 }}>¡Publicado!</h2>
              <p style={{ fontSize: 13, fontWeight: 600, marginTop: 12, color: "rgba(20,17,15,.65)" }}>Tu obra ya está en la comunidad InkRush.</p>
              <div className="perforated" style={{ margin: "20px 0 16px" }}/>
              <button onClick={() => dispatch({ type: "SET_SCREEN", screen: "feed" })} className="stk" style={{ width: "100%", height: 52, background: "var(--ink)", color: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
                Ver en el Feed <IArrowR s={18} stroke="var(--acid)"/>
              </button>
            </div>
          </div>
        </div>
      </Phone>
    );
  }

  return (
    <Phone>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFiles}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "8px 22px 22px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "timer" })}
            style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, padding: 0, cursor: "pointer" }}
          >
            <IArrowL s={16}/> Volver
          </button>
          <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IBrush s={12} stroke="var(--acid)"/> {level.name}
          </span>
        </div>

        <h2 className="serif" style={{ fontSize: 30, marginTop: 8, lineHeight: 1 }}>Sube tu resultado</h2>
        <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>// COMPARTE TU OBRA CON LA COMUNIDAD</p>

        <div className="scroll" style={{ flex: 1, marginTop: 14 }}>
          {/* Photo zone */}
          {images.length > 0 ? (
            <div>
              <PhotoCarousel images={images} onRemove={removeImage}/>
              {images.length < MAX_PHOTOS && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={compressing}
                  className="stk-sm"
                  style={{ width: "100%", height: 44, marginTop: 10, border: "2px dashed var(--ink)", background: "var(--paper-2)", borderRadius: 12, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                >
                  <ICam s={16}/> {compressing ? "Procesando..." : `Añadir foto (${images.length}/${MAX_PHOTOS})`}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={compressing}
              className="stk"
              style={{
                width: "100%", height: 220,
                border: "3px dashed var(--ink)",
                background: "var(--rose)",
                borderRadius: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", overflow: "hidden", cursor: "pointer",
              }}
            >
              <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.2 }}/>
              <div style={{ width: 56, height: 56, borderRadius: 14, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <ICam s={28}/>
              </div>
              <p style={{ fontWeight: 800, fontSize: 13, position: "relative" }}>
                {compressing ? "Procesando..." : "Toca para añadir foto"}
              </p>
              <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>JPG · PNG · MÁXIMO 5 FOTOS</p>
            </button>
          )}

          {/* Prompt tags */}
          {currentIdea && (
            <div className="stk-sm" style={{ background: "var(--paper-2)", padding: 12, marginTop: 14 }}>
              <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>// RETO COMPLETADO</p>
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
          <p style={{ fontWeight: 800, fontSize: 12, marginTop: 16, marginBottom: 8 }}>Técnica usada</p>
          <div className="scroll" style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
            {TECHNIQUES.map(t => (
              <button
                key={t.id}
                onClick={() => setTechnique(t.id)}
                style={{
                  flexShrink: 0, padding: "6px 12px", borderRadius: 12,
                  border: "2px solid var(--ink)",
                  background: technique === t.id ? (TECH_COLORS[t.id] || "var(--acid)") : "var(--paper-2)",
                  fontSize: 11, fontWeight: 700,
                  boxShadow: technique === t.id ? "3px 3px 0 var(--ink)" : "none",
                  display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
                }}
              >
                <IBrush s={13}/> {t.label}
              </button>
            ))}
          </div>

          {/* Description */}
          <p style={{ fontWeight: 800, fontSize: 12, marginTop: 16, marginBottom: 6 }}>
            Descripción <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.45)" }}>(OPCIONAL)</span>
          </p>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Cuéntanos sobre tu proceso creativo..."
            style={{ width: "100%", height: 84, border: "2px solid var(--ink)", borderRadius: 14, padding: 12, fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 12, resize: "none", outline: "none", background: "var(--paper-2)" }}
          />

          {/* Video */}
          <p style={{ fontWeight: 800, fontSize: 12, marginTop: 12, marginBottom: 8 }}>Video de proceso (10s)</p>
          {canVideo ? (
            <button className="stk-sm" style={{ width: "100%", height: 48, background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 12, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
              <ICam s={18}/> Añadir video
            </button>
          ) : (
            <div className="stk-sm" style={{ background: "#EFEAD8", padding: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ILock s={18}/>
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 12 }}>Video bloqueado</p>
                  <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.55)" }}>FALTAN {videoNeeded} RETO{videoNeeded !== 1 ? "S" : ""} PARA DESBLOQUEAR</p>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 999, border: "1.5px solid var(--ink)", background: "var(--paper-2)", overflow: "hidden" }}>
                <div style={{ width: `${(profile.completedChallenges / 10) * 100}%`, height: "100%", background: "var(--acid)" }}/>
              </div>
              <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)", marginTop: 4 }}>{profile.completedChallenges}/10 RETOS</p>
            </div>
          )}
        </div>

        <button
          onClick={publish}
          disabled={saving || compressing}
          className="stk"
          style={{ marginTop: 14, height: 54, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", cursor: "pointer", opacity: (saving || compressing) ? 0.6 : 1 }}
        >
          <IShare s={18}/> {saving ? "Publicando..." : "Publicar en la comunidad"}
        </button>
      </div>
    </Phone>
  );
}
