import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { RarityBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { IBookmark, ITimer, ITrash } from "../components/Icons";

function decodeTag(t) {
  const raw = typeof t === "string" ? t : (t.value ?? "");
  try { return decodeURIComponent(raw); } catch { return raw; }
}

export function SavedScreen() {
  const { state, dispatch } = useApp();
  const savedIdeas = state.savedIdeas ?? [];

  const startIdea = (idea) => {
    dispatch({ type: "SET_IDEA", idea: idea.variables, params: idea.params });
    dispatch({ type: "SET_SCREEN", screen: "setupTimer" });
  };

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "8px 22px 10px", borderBottom: "2px solid var(--ink)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="serif" style={{ fontSize: 30, lineHeight: 1 }}>Guardados</h2>
            <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IBookmark s={12} stroke="var(--acid)"/> {savedIdeas.length}
            </span>
          </div>
          <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>
            // IDEAS PARA CUANDO ESTÉS LISTO
          </p>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 22px 90px", display: "flex", flexDirection: "column", gap: 12 }}>
          {savedIdeas.map((idea, i) => {
            const rarity = idea.variables?.[0]?.rarity ?? "Común";
            const rarityColor = rarity === "Legendario" ? "var(--acid)" : rarity === "Épico" ? "var(--lilac)" : rarity === "Raro" ? "var(--sky)" : "rgba(20,17,15,.12)";
            return (
              <div key={i} className="stk" style={{ background: "var(--paper-2)", padding: 0, borderRadius: 18, overflow: "hidden" }}>
                <div style={{ height: 4, background: rarityColor }}/>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1, marginRight: 8 }}>
                      {(idea.variables ?? []).map((v, j) => (
                        <span key={j} style={{ background: "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>
                          {decodeTag(v)}
                        </span>
                      ))}
                    </div>
                    <RarityBadge rarity={rarity}/>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(20,17,15,.65)", lineHeight: 1.4, marginBottom: 12 }}>
                    {idea.variables?.length >= 3
                      ? <>Ilustra <b>{decodeTag(idea.variables[0])}</b> encontrando <b>{decodeTag(idea.variables[1])}</b> en <b>{decodeTag(idea.variables[2])}</b>.</>
                      : (idea.variables ?? []).map(v => decodeTag(v)).join(" + ")
                    }
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => startIdea(idea)}
                      className="stk"
                      style={{ flex: 1, height: 42, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 12, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                    >
                      <ITimer s={14}/> Aceptar reto
                    </button>
                    <button
                      onClick={() => dispatch({ type: "REMOVE_IDEA", index: i })}
                      style={{ width: 42, height: 42, borderRadius: 12, border: "2px solid var(--ink)", background: "var(--rose)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <ITrash s={16}/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {savedIdeas.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <p className="serif" style={{ fontSize: 24 }}>Sin ideas guardadas</p>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 8 }}>
                // GUARDA IDEAS DESDE EL RANDÓMETRO
              </p>
            </div>
          )}
        </div>

        <BottomNav current="saved"/>
      </div>
    </Phone>
  );
}
