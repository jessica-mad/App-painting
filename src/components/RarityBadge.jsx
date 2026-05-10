import { RARITY_COLORS, RARITY_EMOJI } from "../data/parameters";

export function RarityBadge({ rarity, size = "sm" }) {
  const colors = RARITY_COLORS[rarity];
  const emoji = RARITY_EMOJI[rarity];
  const isLegendary = rarity === "Legendario";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-black font-black ${size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"} ${isLegendary ? "animate-pulse" : ""}`}
      style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {emoji} {rarity}
    </span>
  );
}

export function SeasonBadge({ season }) {
  if (!season) return null;
  const colors = {
    "Primavera": { bg: "#D6FFE8", text: "#006633" },
    "Verano": { bg: "#FFF3D6", text: "#AA5500" },
    "Otoño": { bg: "#FFE8D6", text: "#884422" },
    "Invierno": { bg: "#D6F5FF", text: "#004466" },
    "Halloween": { bg: "#FF8C00", text: "#1a0000" },
    "Navidad": { bg: "#CC0000", text: "#FFFFFF" },
    "San Valentín": { bg: "#FF69B4", text: "#660033" },
  };
  const c = colors[season] || { bg: "#EEE", text: "#333" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border-2 border-black px-2 py-0.5 text-[10px] font-black"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      🌿 {season}
    </span>
  );
}
