import { useState } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { PARAMETERS, PARAM_CATEGORIES, RARITY, RARITY_COLORS, SEASONS } from "../data/parameters";
import { RarityBadge } from "../components/RarityBadge";
import { IArrowL, IBrush, IStar, ILock } from "../components/Icons";

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

export function AdminScreen() {
  const { dispatch } = useApp();
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ background: "var(--ink)", padding: "10px 22px 12px" }}>
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
          <h2 className="serif" style={{ fontSize: 28, lineHeight: 1, color: "#fff" }}>Gestión de Variables</h2>
          <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.5)", marginTop: 4 }}>WordPress Plugin · InkRush v1.0</p>
        </div>

        {/* Category selector */}
        <div className="scroll" style={{ display: "flex", gap: 8, padding: "10px 22px", borderBottom: "2px solid var(--ink)", background: "var(--paper-2)" }}>
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

        <div className="scroll" style={{ flex: 1, padding: "14px 22px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
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
                "Custom Post Type: inkrush_variable",
                "Taxonomías: rareza, temporada, categoría",
              ].map((t, i) => (
                <p key={i} className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,.6)" }}>• {t}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Phone>
  );
}
