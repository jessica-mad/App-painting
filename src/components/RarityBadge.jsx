import { ICircle, IDiamond, ITriangle, IStar } from "./Icons";

const RARITY_MAP = {
  "Común":      { color: "#E8E1D0",        glyph: ICircle,   label: "Susurro" },
  "Raro":       { color: "var(--sky)",     glyph: IDiamond,  label: "Visión" },
  "Épico":      { color: "var(--lilac)",   glyph: ITriangle, label: "Éxtasis" },
  "Legendario": { color: "var(--acid)",    glyph: IStar,     label: "✦ Epifanía" },
};

export function RarityBadge({ rarity, size = "sm" }) {
  const c = RARITY_MAP[rarity] || RARITY_MAP["Común"];
  const big = size === "md";
  const Glyph = c.glyph;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: c.color, border: "2px solid var(--ink)",
      borderRadius: 999, padding: big ? "3px 10px" : "2px 7px",
      fontFamily: "JetBrains Mono", fontWeight: 700,
      fontSize: big ? 11 : 9, textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      <Glyph s={big ? 13 : 11} sw={2}/>{c.label}
    </span>
  );
}

export function SeasonBadge({ season }) {
  if (!season) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "var(--sky)", border: "2px solid var(--ink)",
      borderRadius: 999, padding: "2px 8px",
      fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 9,
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      {season}
    </span>
  );
}
