import { ICircle, IDiamond, ITriangle, IStar } from "./Icons";
import { useApp } from "../data/store";
import { getRarityName } from "../data/parameters";

/* Keyed by internal backend value — stable regardless of language */
const RARITY_STYLE = {
  "Común":      { color: "#E8E1D0",      glyph: ICircle   },
  "Raro":       { color: "var(--sky)",   glyph: IDiamond  },
  "Épico":      { color: "var(--lilac)", glyph: ITriangle },
  "Legendario": { color: "var(--acid)",  glyph: IStar     },
};

export function RarityBadge({ rarity, size = "sm" }) {
  const { state } = useApp();
  const label = getRarityName(rarity, state.lang, state.rarityLabels);
  const c = RARITY_STYLE[rarity] || RARITY_STYLE["Común"];
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
      <Glyph s={big ? 13 : 11} sw={2}/>{label}
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
