import { useState, useRef } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { submitBugReport } from "../utils/api";
import { IArrowL, ICheck, IX } from "../components/Icons";

const MAX_FILES = 5;
const ACCEPT = "image/*,video/*";

function deviceInfo() {
  return {
    userAgent: navigator.userAgent,
    screen: `${screen.width}×${screen.height}`,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    url: window.location.href,
    platform: navigator.platform ?? "",
  };
}

function FilePreview({ file, onRemove }) {
  const isVideo = file.type.startsWith("video/");
  const url = URL.createObjectURL(file);
  return (
    <div style={{ position: "relative", width: 72, height: 72, borderRadius: 10, border: "2px solid var(--ink)", overflow: "hidden", flexShrink: 0 }}>
      {isVideo ? (
        <div style={{ width: "100%", height: "100%", background: "var(--ink)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
          <span style={{ fontSize: 22 }}>🎥</span>
          <span style={{ fontSize: 8, color: "var(--acid)", fontWeight: 700, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 4px" }}>{file.name}</span>
        </div>
      ) : (
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
      )}
      <button
        onClick={onRemove}
        style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: 999, background: "var(--ink)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <IX s={10} stroke="var(--acid)"/>
      </button>
    </div>
  );
}

export function BugReportScreen() {
  const { dispatch } = useApp();
  const fileRef = useRef(null);

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [expected,    setExpected]    = useState("");
  const [files,       setFiles]       = useState([]);
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState(null);

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f =>
      f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    setFiles(prev => {
      const merged = [...prev, ...valid];
      return merged.slice(0, MAX_FILES);
    });
  };

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitBugReport({ title, description, expected, files, deviceInfo: deviceInfo() });
      setDone(true);
    } catch (e) {
      setError(e.message || "Error al enviar el reporte");
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => dispatch({ type: "SET_SCREEN", screen: "home" });

  if (done) {
    return (
      <Phone>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", gap: 18, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: "var(--mint)", border: "3px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "4px 4px 0 var(--ink)" }}>
            <ICheck s={34}/>
          </div>
          <div>
            <h2 className="serif" style={{ fontSize: 30, lineHeight: 1 }}>¡Gracias!</h2>
            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 8, lineHeight: 1.5 }}>Tu reporte ha sido enviado.<br/>Lo revisaremos lo antes posible.</p>
          </div>
          <button
            onClick={back}
            className="stk"
            style={{ height: 50, padding: "0 28px", background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: "pointer" }}
          >
            Volver al inicio
          </button>
        </div>
      </Phone>
    );
  }

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "10px 22px 8px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={back}
            style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, background: "transparent", border: "none", cursor: "pointer" }}
          >
            <IArrowL s={16}/> Volver
          </button>
        </div>

        <div className="scroll" style={{ flex: 1, padding: "0 22px 32px" }}>
          <div style={{ marginBottom: 20 }}>
            <h2 className="serif" style={{ fontSize: 30, lineHeight: 1 }}>Reportar un bug</h2>
            <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.45)", marginTop: 4 }}>
              // tu feedback nos ayuda a mejorar
            </p>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>
              ¿Qué pasó? <span style={{ color: "var(--coral)" }}>*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título breve del bug"
              maxLength={120}
              style={{ width: "100%", height: 44, padding: "0 14px", border: "2px solid var(--ink)", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "var(--paper-2)", boxSizing: "border-box" }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>
              Descripción <span style={{ color: "var(--coral)" }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe qué estabas haciendo y qué salió mal…"
              rows={4}
              style={{ width: "100%", padding: "12px 14px", border: "2px solid var(--ink)", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "var(--paper-2)", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }}
            />
          </div>

          {/* Expected */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>
              ¿Qué esperabas que pasara?
            </label>
            <textarea
              value={expected}
              onChange={e => setExpected(e.target.value)}
              placeholder="Comportamiento esperado (opcional)"
              rows={3}
              style={{ width: "100%", padding: "12px 14px", border: "2px solid var(--ink)", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "var(--paper-2)", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }}
            />
          </div>

          {/* File upload */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>
              Capturas / vídeos ({files.length}/{MAX_FILES})
            </label>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              multiple
              style={{ display: "none" }}
              onChange={e => { addFiles(e.target.files); e.target.value = ""; }}
            />
            {files.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {files.map((f, i) => (
                  <FilePreview key={i} file={f} onRemove={() => removeFile(i)}/>
                ))}
              </div>
            )}
            {files.length < MAX_FILES && (
              <button
                onClick={() => fileRef.current?.click()}
                style={{ height: 44, padding: "0 18px", border: "2px dashed rgba(20,17,15,.35)", borderRadius: 12, background: "transparent", fontWeight: 700, fontSize: 12, cursor: "pointer", color: "rgba(20,17,15,.6)" }}
              >
                + Añadir imagen o vídeo
              </button>
            )}
            <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.35)", marginTop: 6 }}>
              Máx. {MAX_FILES} archivos · imágenes o vídeos
            </p>
          </div>

          {/* Device info (collapsed label) */}
          <div style={{ marginBottom: 20, padding: "10px 14px", background: "var(--paper-2)", border: "2px solid rgba(20,17,15,.15)", borderRadius: 12 }}>
            <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.4)", marginBottom: 4 }}>// info de dispositivo adjunta automáticamente</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.5)", lineHeight: 1.6 }}>
              Pantalla: {screen.width}×{screen.height} · Viewport: {window.innerWidth}×{window.innerHeight}
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--rose)", border: "2px solid var(--ink)", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !description.trim()}
            className="stk"
            style={{ width: "100%", height: 52, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 15, cursor: submitting || !title.trim() || !description.trim() ? "not-allowed" : "pointer", opacity: !title.trim() || !description.trim() ? 0.5 : 1, boxShadow: "var(--shadow-lg)" }}
          >
            {submitting ? "Enviando..." : "Enviar reporte 🐛"}
          </button>
        </div>

      </div>
    </Phone>
  );
}
