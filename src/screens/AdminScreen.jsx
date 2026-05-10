import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { PARAMETERS, PARAM_CATEGORIES, RARITY, RARITY_COLORS, SEASONS } from "../data/parameters";
import { RarityBadge, SeasonBadge } from "../components/RarityBadge";

const RARITY_OPTIONS = [RARITY.COMUN, RARITY.RARO, RARITY.EPICO, RARITY.LEGENDARIO];
const SEASON_OPTIONS = [null, ...Object.values(SEASONS)];

function VariableTag({ variable, onRemove }) {
  const colors = RARITY_COLORS[variable.rarity];
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-black text-xs font-black"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span className="capitalize">{variable.value}</span>
      <RarityBadge rarity={variable.rarity} size="sm" />
      {variable.season && <SeasonBadge season={variable.season} />}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">✕</button>
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
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b-2 border-black bg-[#111111] shrink-0">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={() => dispatch({ type: "SET_SCREEN", screen: "home" })}
              className="text-[#DFFF23] font-black text-sm"
            >
              ← Salir
            </button>
            <span className="bg-[#DFFF23] text-black px-3 py-1 rounded-full text-xs font-black">
              🛠️ Panel Admin
            </span>
          </div>
          <h2 className="text-xl font-black text-white">Gestión de Variables</h2>
          <p className="text-xs font-semibold text-white/50">WordPress Plugin · InkRush v1.0</p>
        </div>

        {/* Category selector */}
        <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar border-b-2 border-black bg-white shrink-0">
          {PARAM_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-black font-black text-xs transition-all ${selectedCategory === cat.id ? "sticker-shadow" : ""}`}
              style={{ backgroundColor: selectedCategory === cat.id ? cat.color : "white" }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 pb-6">
          {/* Stats row */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
            <div className="shrink-0 rounded-xl border-2 border-black bg-white p-3 text-center min-w-[80px]">
              <p className="font-black text-lg">{currentParams.length}</p>
              <p className="text-[10px] font-black text-neutral-400">Total</p>
            </div>
            {RARITY_OPTIONS.map(r => (
              <div
                key={r}
                className="shrink-0 rounded-xl border-2 border-black p-3 text-center min-w-[72px]"
                style={{ backgroundColor: RARITY_COLORS[r].bg }}
              >
                <p className="font-black text-lg">{rarityCount[r] || 0}</p>
                <p className="text-[10px] font-black" style={{ color: RARITY_COLORS[r].text }}>{r}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <select
              value={filterRarity}
              onChange={e => setFilterRarity(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-black bg-white font-black text-xs outline-none"
            >
              <option value="all">Rareza: Todas</option>
              {RARITY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={filterSeason}
              onChange={e => setFilterSeason(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-black bg-white font-black text-xs outline-none"
            >
              <option value="all">Temporada: Todas</option>
              <option value="none">Sin temporada</option>
              {Object.values(SEASONS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Add new variable */}
          <div className="rounded-2xl border-2 border-black bg-[#EFE8FF] p-4 mb-4">
            <p className="font-black text-sm mb-3">➕ Nueva variable</p>
            <input
              type="text"
              value={newVar}
              onChange={e => setNewVar(e.target.value)}
              placeholder="Nombre de la variable..."
              className="w-full h-10 rounded-xl border-2 border-black bg-white px-3 font-semibold text-sm outline-none mb-2"
            />
            <div className="flex gap-2 mb-2">
              <select
                value={newRarity}
                onChange={e => setNewRarity(e.target.value)}
                className="flex-1 h-10 rounded-xl border-2 border-black bg-white font-black text-xs outline-none px-2"
              >
                {RARITY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                value={newSeason || ""}
                onChange={e => setNewSeason(e.target.value || null)}
                className="flex-1 h-10 rounded-xl border-2 border-black bg-white font-black text-xs outline-none px-2"
              >
                <option value="">Sin temporada</option>
                {Object.values(SEASONS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button
              className="w-full h-10 rounded-xl border-2 border-black bg-[#DFFF23] font-black text-sm sticker-shadow disabled:opacity-40"
              disabled={!newVar.trim()}
              onClick={() => {
                // In a real app this would call the WordPress REST API
                alert(`Variable "${newVar}" (${newRarity}${newSeason ? " · " + newSeason : ""}) sería guardada via WordPress REST API.`);
                setNewVar("");
              }}
            >
              Guardar variable (→ WordPress API)
            </button>
          </div>

          {/* Variable list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-sm">{filtered.length} variables</p>
              <button
                onClick={() => setEditMode(e => !e)}
                className={`text-xs font-black px-3 py-1 rounded-full border-2 border-black ${editMode ? "bg-red-100" : "bg-white"}`}
              >
                {editMode ? "✓ Listo" : "✏️ Editar"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filtered.map((v, i) => (
                <VariableTag
                  key={`${v.value}-${i}`}
                  variable={v}
                  onRemove={editMode ? () => alert(`"${v.value}" eliminada (demo).`) : null}
                />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-neutral-400 font-black text-sm">
                No hay variables con estos filtros
              </div>
            )}
          </div>

          {/* Season manager */}
          <div className="mt-6 rounded-2xl border-2 border-black bg-[#FFFDF3] p-4">
            <p className="font-black text-sm mb-3">🌿 Gestión de Temporadas</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SEASONS).map(([key, name]) => (
                <button
                  key={key}
                  className="px-3 py-1.5 rounded-full border-2 border-black font-black text-xs bg-white sticker-shadow"
                  onClick={() => alert(`Activar temporada: ${name} (se haría via WordPress admin)`)}
                >
                  {name}
                </button>
              ))}
            </div>
            <p className="text-[10px] font-semibold text-neutral-400 mt-3">
              En producción: activar/desactivar temporadas via WordPress admin. Las variables de temporada activa aparecen con más probabilidad.
            </p>
          </div>

          {/* WP Plugin info */}
          <div className="mt-4 rounded-2xl border-2 border-black bg-[#111111] text-white p-4">
            <p className="font-black text-sm mb-2">🔌 Plugin WordPress</p>
            <div className="space-y-1 text-xs font-semibold text-white/70">
              <p>• REST API: /wp-json/inkrush/v1/parameters</p>
              <p>• Roles: subscriber → Ilustrador</p>
              <p>• WooCommerce Membership: niveles premium</p>
              <p>• Custom Post Type: inkrush_variable</p>
              <p>• Taxonomías: rareza, temporada, categoria</p>
            </div>
          </div>
        </div>
      </div>
    </Phone>
  );
}
