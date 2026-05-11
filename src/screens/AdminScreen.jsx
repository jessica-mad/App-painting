import { useState, useEffect } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { PARAMETERS, PARAM_CATEGORIES, RARITY, RARITY_COLORS, SEASONS, MUSIC_TRACKS } from "../data/parameters";
import { RarityBadge } from "../components/RarityBadge";
import { fetchReports, republishArtwork, deleteArtwork, saveMusicSrcs } from "../utils/api";
import { IArrowL, IBrush, IStar, IFlag, ITrash, ICheck, IMusic } from "../components/Icons";

const RARITY_OPTIONS = [RARITY.COMUN, RARITY.RARO, RARITY.EPICO, RARITY.LEGENDARIO];

function VariableTag({ variable, onRemove }) {
  const colors = RARITY_COLORS[variable.rarity];
  return (
    <div
      className="stk-sm"
      style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 999, border: "2px solid var(--ink)", background: colors.bg, color: colors.text, fontSize: 11, fontWeight: 700 }}
    >
      <span style={{ textTransform: "capitalize" }}>{variable.value}</span>
      <RarityBadge rarity={variable.rarity}/>
      {onRemove && (
        <button onClick={onRemove} style={{ width: 16, height: 16, borderRadius: 999, background: "rgba(20,17,15,.2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, cursor: "pointer" }}>✕</button>
      )}
    </div>
  );
}

function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports()
      .then(data => setReports(data?.reports ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRepublish = async (id) => {
    try {
      await republishArtwork(id);
      setReports(rs => rs.filter(r => r.id !== id));
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await deleteArtwork(id);
      setReports(rs => rs.filter(r => r.id !== id));
    } catch {}
  };

  if (loading) {
    return <p className="mono" style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.4)", padding: "40px 0" }}>// CARGANDO REPORTES...</p>;
  }

  if (reports.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <p className="serif" style={{ fontSize: 26, lineHeight: 1 }}>Sin reportes</p>
        <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.4)", marginTop: 8 }}>// TODO LIMPIO</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {reports.map(r => (
        <div key={r.id} className="stk-sm" style={{ background: "var(--paper-2)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 12, padding: "12px 14px" }}>
            {r.image && (
              <img src={r.image} alt="" style={{ width: 60, aspectRatio: "3/4", objectFit: "cover", borderRadius: 8, border: "2px solid var(--ink)", flexShrink: 0 }}/>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{r.prompt}</p>
              <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 4 }}>por {r.author}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                <span style={{ background: r.reports >= 5 ? "var(--rose)" : "var(--butter)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                  <IFlag s={10}/> {r.reports} reporte{r.reports !== 1 ? "s" : ""}
                </span>
                {r.hidden && (
                  <span style={{ background: "var(--ink)", color: "var(--acid)", borderRadius: 999, padding: "2px 8px", fontSize: 9, fontWeight: 800 }}>OCULTA</span>
                )}
              </div>
              {r.detail?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {r.detail.slice(-3).map((d, i) => (
                    <p key={i} className="mono" style={{ fontSize: 8, fontWeight: 600, color: "rgba(20,17,15,.5)", lineHeight: 1.4 }}>
                      • {d.reason === "no_cumple" ? "No cumple el reto" : "Denuncia"} — uid:{d.uid}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", borderTop: "1.5px solid rgba(20,17,15,.1)" }}>
            <button
              onClick={() => handleRepublish(r.id)}
              style={{ flex: 1, height: 40, border: "none", borderRight: "1.5px solid rgba(20,17,15,.1)", background: "var(--mint)", fontWeight: 800, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <ICheck s={13}/> Aprobar
            </button>
            <button
              onClick={() => handleDelete(r.id)}
              style={{ flex: 1, height: 40, border: "none", background: "var(--rose)", fontWeight: 800, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <ITrash s={13}/> Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const ADMIN_TABS = ["Variables", "Música", "Reportes"];

function MusicTab() {
  const { state, dispatch } = useApp();
  const [srcs, setSrcs] = useState(() =>
    MUSIC_TRACKS.reduce((acc, t) => ({ ...acc, [t.id]: state.musicSrcs[t.id] ?? "" }), {})
  );
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveMusicSrcs(srcs);
      dispatch({ type: "SET_MUSIC_SRCS", srcs });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.message || "Error al guardar. Revisa tu conexión.");
    } finally {
      setSaving(false);
    }
  };

  const configured = Object.values(srcs).filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Status banner */}
      <div className="stk-sm" style={{ background: configured === MUSIC_TRACKS.length ? "var(--mint)" : "var(--butter)", padding: "10px 14px", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <IMusic s={16}/>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 12 }}>
            {configured}/{MUSIC_TRACKS.length} tracks configurados
          </p>
          <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)", marginTop: 2 }}>
            // URLs DE AUDIO · MP3, OGG O STREAM COMPATIBLE
          </p>
        </div>
      </div>

      {/* Track rows */}
      {MUSIC_TRACKS.map(track => {
        const hasUrl = !!srcs[track.id];
        return (
          <div key={track.id} className="stk-sm" style={{ background: "var(--paper-2)", borderRadius: 14, overflow: "hidden" }}>
            {/* Track header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px 8px" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, border: "2px solid var(--ink)", background: track.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {track.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: 13, lineHeight: 1 }}>{track.title}</p>
                <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 2 }}>
                  {track.mood?.toUpperCase()}
                </p>
              </div>
              <span style={{
                padding: "2px 8px", borderRadius: 999, fontSize: 9, fontWeight: 800,
                background: hasUrl ? "var(--mint)" : "var(--paper)",
                border: "1.5px solid var(--ink)",
              }}>
                {hasUrl ? "✓ OK" : "Sin URL"}
              </span>
            </div>

            {/* URL input */}
            <div style={{ padding: "0 14px 12px", display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="url"
                value={srcs[track.id]}
                onChange={e => setSrcs(s => ({ ...s, [track.id]: e.target.value }))}
                placeholder="https://... · mp3, ogg, stream"
                style={{
                  flex: 1, height: 38, borderRadius: 10, border: "2px solid var(--ink)",
                  background: hasUrl ? "var(--paper-2)" : "#FFFDF3",
                  padding: "0 10px", fontFamily: "JetBrains Mono", fontSize: 10,
                  fontWeight: 600, outline: "none", color: "var(--ink)",
                }}
              />
              {hasUrl && (
                <button
                  onClick={() => setSrcs(s => ({ ...s, [track.id]: "" }))}
                  title="Limpiar URL"
                  style={{ width: 36, height: 36, borderRadius: 10, border: "2px solid var(--ink)", background: "var(--rose)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontWeight: 900, fontSize: 14 }}
                >×</button>
              )}
            </div>
          </div>
        );
      })}

      {/* Error */}
      {error && (
        <div style={{ padding: "10px 14px", background: "var(--rose)", border: "2px solid var(--ink)", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
          ⚠ {error}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="stk"
        style={{ height: 52, background: saved ? "var(--mint)" : "var(--acid)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}
      >
        <IMusic s={18}/>
        {saved ? "✓ Guardado en WordPress" : saving ? "Guardando..." : "Guardar URLs de música"}
      </button>

      {/* Info box */}
      <div className="stk-sm" style={{ background: "var(--ink)", color: "#fff", padding: 14, borderRadius: 14 }}>
        <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 8, color: "var(--acid)" }}>// FORMATOS COMPATIBLES</p>
        {[
          "MP3, OGG, AAC, WAV (HTML5 Audio)",
          "Streams: SoundCloud embed, Mixcloud, etc.",
          "Ruta relativa al plugin: /wp-content/plugins/inkrush-app/assets/music/lofi.mp3",
          "Las URLs se guardan en wp_options y se inyectan en InkRushConfig.musicSrcs",
        ].map((t, i) => (
          <p key={i} className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,.6)", lineHeight: 1.6 }}>• {t}</p>
        ))}
      </div>
    </div>
  );
}

export function AdminScreen() {
  const { dispatch } = useApp();
  const [adminTab, setAdminTab] = useState("Variables");
  const [selectedCategory, setSelectedCategory] = useState(PARAM_CATEGORIES[0].id);
  const [editMode, setEditMode] = useState(false);
  const [newVar, setNewVar] = useState("");
  const [newRarity, setNewRarity] = useState(RARITY.COMUN);
  const [newSeason, setNewSeason] = useState(null);
  const [filterRarity, setFilterRarity] = useState("all");
  const [filterSeason, setFilterSeason] = useState("all");

  const currentParams = PARAMETERS[selectedCategory] || [];
  const filtered = currentParams.filter(v => {
    if (filterRarity !== "all" && v.rarity !== filterRarity) return false;
    if (filterSeason !== "all") {
      if (filterSeason === "none" && v.season) return false;
      if (filterSeason !== "none" && v.season !== filterSeason) return false;
    }
    return true;
  });

  const rarityCount = RARITY_OPTIONS.reduce((acc, r) => {
    acc[r] = currentParams.filter(v => v.rarity === r).length;
    return acc;
  }, {});

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "var(--ink)", padding: "10px 22px 12px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <button
              onClick={() => dispatch({ type: "SET_SCREEN", screen: "home" })}
              style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, color: "var(--acid)", cursor: "pointer", padding: 0 }}
            >
              <IArrowL s={16} stroke="var(--acid)"/> Salir
            </button>
            <span className="stk-sm" style={{ background: "var(--acid)", color: "var(--ink)", padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IBrush s={12}/> Panel Admin
            </span>
          </div>
          <h2 className="serif" style={{ fontSize: 28, lineHeight: 1, color: "#fff" }}>Administración</h2>
        </div>

        {/* Admin tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--ink)", flexShrink: 0 }}>
          {ADMIN_TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setAdminTab(t)}
              style={{
                flex: 1, padding: "10px 0", border: "none",
                borderRight: i < ADMIN_TABS.length - 1 ? "2px solid var(--ink)" : "none",
                background: adminTab === t ? "var(--acid)" : "var(--paper-2)",
                fontWeight: 800, fontSize: 11, fontFamily: "JetBrains Mono",
                textTransform: "uppercase", letterSpacing: "0.03em", cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="scroll" style={{ flex: 1, padding: "14px 22px 22px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          {adminTab === "Reportes" && <ReportsTab/>}
          {adminTab === "Música"   && <MusicTab/>}

          {adminTab === "Variables" && (
            <>
              {/* Category selector */}
              <div className="scroll" style={{ display: "flex", gap: 8, marginBottom: 2 }}>
                {PARAM_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 12,
                      border: "2px solid var(--ink)",
                      background: selectedCategory === cat.id ? (cat.color || "var(--acid)") : "var(--paper-2)",
                      fontWeight: 800, fontSize: 11,
                      boxShadow: selectedCategory === cat.id ? "3px 3px 0 var(--ink)" : "none",
                      cursor: "pointer",
                    }}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              {/* Stats row */}
              <div className="scroll" style={{ display: "flex", gap: 8 }}>
                <div className="stk-sm" style={{ background: "var(--paper-2)", padding: "10px 14px", borderRadius: 12, textAlign: "center", flexShrink: 0 }}>
                  <p className="serif" style={{ fontSize: 22 }}>{currentParams.length}</p>
                  <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.5)" }}>TOTAL</p>
                </div>
                {RARITY_OPTIONS.map(r => (
                  <div key={r} className="stk-sm" style={{ background: RARITY_COLORS[r].bg, padding: "10px 14px", borderRadius: 12, textAlign: "center", flexShrink: 0 }}>
                    <p className="serif" style={{ fontSize: 22, color: RARITY_COLORS[r].text }}>{rarityCount[r] || 0}</p>
                    <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: RARITY_COLORS[r].text }}>{r.toUpperCase()}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={filterRarity}
                  onChange={e => setFilterRarity(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", fontWeight: 800, fontSize: 11, fontFamily: "JetBrains Mono", outline: "none" }}
                >
                  <option value="all">Rareza: todas</option>
                  {RARITY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select
                  value={filterSeason}
                  onChange={e => setFilterSeason(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", fontWeight: 800, fontSize: 11, fontFamily: "JetBrains Mono", outline: "none" }}
                >
                  <option value="all">Temporada: todas</option>
                  <option value="none">Sin temporada</option>
                  {Object.values(SEASONS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Add new variable */}
              <div className="stk-sm" style={{ background: "var(--lilac)", padding: 14, borderRadius: 14 }}>
                <p className="mono" style={{ fontSize: 10, fontWeight: 700, marginBottom: 10 }}>// NUEVA VARIABLE</p>
                <input
                  type="text"
                  value={newVar}
                  onChange={e => setNewVar(e.target.value)}
                  placeholder="Nombre de la variable..."
                  style={{ width: "100%", height: 42, borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", padding: "0 12px", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 12, outline: "none", marginBottom: 8, boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <select
                    value={newRarity}
                    onChange={e => setNewRarity(e.target.value)}
                    style={{ flex: 1, height: 38, borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", fontWeight: 800, fontSize: 11, fontFamily: "JetBrains Mono", outline: "none", padding: "0 8px" }}
                  >
                    {RARITY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select
                    value={newSeason || ""}
                    onChange={e => setNewSeason(e.target.value || null)}
                    style={{ flex: 1, height: 38, borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", fontWeight: 800, fontSize: 11, fontFamily: "JetBrains Mono", outline: "none", padding: "0 8px" }}
                  >
                    <option value="">Sin temporada</option>
                    {Object.values(SEASONS).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button
                  className="stk"
                  disabled={!newVar.trim()}
                  onClick={() => {
                    alert(`Variable "${newVar}" (${newRarity}${newSeason ? " · " + newSeason : ""}) sería guardada via WordPress REST API.`);
                    setNewVar("");
                  }}
                  style={{ width: "100%", height: 44, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: newVar.trim() ? "pointer" : "not-allowed", opacity: newVar.trim() ? 1 : 0.5 }}
                >
                  Guardar (→ WordPress API)
                </button>
              </div>

              {/* Variable list */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>// {filtered.length} VARIABLES</p>
                  <button
                    onClick={() => setEditMode(e => !e)}
                    style={{ padding: "4px 10px", borderRadius: 999, border: "2px solid var(--ink)", background: editMode ? "var(--coral)" : "var(--paper-2)", fontSize: 10, fontWeight: 800, cursor: "pointer" }}
                  >
                    {editMode ? "✓ Listo" : "Editar"}
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {filtered.map((v, i) => (
                    <VariableTag
                      key={`${v.value}-${i}`}
                      variable={v}
                      onRemove={editMode ? () => alert(`"${v.value}" eliminada (demo).`) : null}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <p className="mono" style={{ fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.4)", padding: "24px 0" }}>
                      No hay variables con estos filtros
                    </p>
                  )}
                </div>
              </div>

              {/* Season manager */}
              <div className="stk-sm" style={{ background: "var(--mint)", padding: 14, borderRadius: 14 }}>
                <p className="mono" style={{ fontSize: 10, fontWeight: 700, marginBottom: 10 }}>// TEMPORADAS</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(SEASONS).map(([key, name]) => (
                    <button
                      key={key}
                      onClick={() => alert(`Activar temporada: ${name} (se haría via WordPress admin)`)}
                      className="stk-sm"
                      style={{ padding: "5px 12px", borderRadius: 999, border: "2px solid var(--ink)", background: "var(--paper-2)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* WP info */}
              <div className="stk-sm" style={{ background: "var(--ink)", color: "#fff", padding: 14, borderRadius: 14 }}>
                <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <IStar s={14} stroke="var(--acid)"/> Plugin WordPress
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    "REST API: /wp-json/inkrush/v1/parameters",
                    "Roles: subscriber → Ilustrador",
                    "Custom Post Type: inkrush_artwork",
                    "Auto-ocultado al llegar a 5 reportes",
                  ].map((t, i) => (
                    <p key={i} className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,.6)" }}>• {t}</p>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Phone>
  );
}
