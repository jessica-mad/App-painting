import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { RarityBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { RARITY } from "../data/parameters";
import { IBookmark, ITimer, ITrash } from "../components/Icons";

const SAVED_IDEAS = [
  { id: "s1", variables: ["melancolía", "cuervo", "carnaval"], rarity: RARITY.EPICO, params: ["Emociones", "Animales", "Eventos"] },
  { id: "s2", variables: ["nostalgia", "zorro", "biblioteca infinita"], rarity: RARITY.RARO, params: ["Emociones", "Animales", "Lugares"] },
  { id: "s3", variables: ["dualidad interior", "fénix", "fin del mundo"], rarity: RARITY.LEGENDARIO, params: ["Emociones", "Animales", "Eventos"] },
];

export function SavedScreen() {
  const { dispatch } = useApp();

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "8px 22px 10px", borderBottom: "2px solid var(--ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="serif" style={{ fontSize: 30, lineHeight: 1 }}>Guardados</h2>
            <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IBookmark s={12} stroke="var(--acid)"/> {SAVED_IDEAS.length}
            </span>
          </div>
          <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>
            // IDEAS PARA CUANDO ESTÉS LISTO
          </p>
        </div>

        <div className="scroll" style={{ flex: 1, padding: "14px 22px 90px", display: "flex", flexDirection: "column", gap: 12 }}>
          {SAVED_IDEAS.map((idea) => (
            <div key={idea.id} className="stk" style={{ background: "var(--paper-2)", padding: 0, borderRadius: 18, overflow: "hidden" }}>
              {/* Rarity bar */}
              <div style={{
                height: 4,
                background: idea.rarity === RARITY.LEGENDARIO ? "var(--acid)" : idea.rarity === RARITY.EPICO ? "var(--lilac)" : idea.rarity === RARITY.RARO ? "var(--sky)" : "rgba(20,17,15,.12)"
              }}/>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1, marginRight: 8 }}>
                    {idea.variables.map(v => (
                      <span key={v} style={{ background: "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>
                        {v}
                      </span>
                    ))}
                  </div>
                  <RarityBadge rarity={idea.rarity}/>
                </div>

                <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(20,17,15,.65)", lineHeight: 1.4, marginBottom: 12 }}>
                  Ilustra <b>{idea.variables[0]}</b> encontrando <b>{idea.variables[1]}</b> en <b>{idea.variables[2]}</b>.
                </p>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => dispatch({ type: "SET_SCREEN", screen: "setupTimer" })}
                    className="stk"
                    style={{ flex: 1, height: 42, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 12, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                  >
                    <ITimer s={14}/> Aceptar reto
                  </button>
                  <button
                    style={{ width: 42, height: 42, borderRadius: 12, border: "2px solid var(--ink)", background: "var(--rose)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <ITrash s={16}/>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {SAVED_IDEAS.length === 0 && (
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
