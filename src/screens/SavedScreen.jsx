import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { RarityBadge } from "../components/RarityBadge";
import { useApp } from "../data/store";
import { IBookmark, ITimer, ITrash, IGrip, IUndo } from "../components/Icons";

const MAX_SAVED = 5;

function decodeTag(t) {
  const raw = typeof t === "string" ? t : (t.value ?? "");
  try { return decodeURIComponent(raw); } catch { return raw; }
}

function IdeaCard({ idea, rank, onRemove, onStart, isExiting }) {
  const controls = useDragControls();
  const rarity = idea.variables?.[0]?.rarity ?? "Común";
  const rarityColor = { Legendario: "var(--acid)", Épico: "var(--lilac)", Raro: "var(--sky)" }[rarity] ?? "rgba(20,17,15,.12)";
  const rankBg = rank === 1 ? "var(--acid)" : rank === 2 ? "var(--mint)" : "var(--paper)";

  return (
    <Reorder.Item
      value={idea}
      dragListener={false}
      dragControls={controls}
      as="div"
      layout
      animate={isExiting
        ? { x: 100, y: 14, rotate: 14, scale: 0.6, opacity: 0 }
        : { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
      }
      transition={isExiting
        ? { duration: 0.32, ease: "easeIn" }
        : { type: "spring", stiffness: 300, damping: 28 }
      }
      style={{ marginBottom: 12, touchAction: "none" }}
    >
      <div className="stk" style={{ background: "var(--paper-2)", padding: 0, borderRadius: 18, overflow: "hidden", userSelect: "none" }}>
        <div style={{ height: 4, background: rarityColor }}/>
        <div style={{ padding: "12px 14px" }}>

          {/* Row 1: grip + rank + tags + rarity */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <div
              onPointerDown={(e) => controls.start(e)}
              style={{ cursor: "grab", touchAction: "none", color: "rgba(20,17,15,.3)", flexShrink: 0, lineHeight: 1 }}
            >
              <IGrip s={18}/>
            </div>

            <span style={{
              width: 22, height: 22, borderRadius: 999, border: "2px solid var(--ink)",
              background: rankBg,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 800, flexShrink: 0,
            }}>
              {rank}
            </span>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, flex: 1 }}>
              {(idea.variables ?? []).map((v, j) => (
                <span key={j} style={{
                  background: "var(--acid)", border: "1.5px solid var(--ink)",
                  borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 800,
                }}>
                  {decodeTag(v)}
                </span>
              ))}
            </div>
            <RarityBadge rarity={rarity}/>
          </div>

          {/* Description */}
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(20,17,15,.65)", lineHeight: 1.4, marginBottom: 10, paddingLeft: 52 }}>
            {idea.variables?.length >= 3
              ? <>Ilustra <b>{decodeTag(idea.variables[0])}</b> encontrando <b>{decodeTag(idea.variables[1])}</b> en <b>{decodeTag(idea.variables[2])}</b>.</>
              : (idea.variables ?? []).map(v => decodeTag(v)).join(" + ")
            }
          </p>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onStart}
              className="stk"
              style={{
                flex: 1, height: 40, background: "var(--acid)", border: "2px solid var(--ink)",
                borderRadius: 12, fontWeight: 800, fontSize: 12,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
              }}
            >
              <ITimer s={14}/> Aceptar reto
            </button>
            <button
              onClick={onRemove}
              style={{
                width: 40, height: 40, borderRadius: 12, border: "2px solid var(--ink)",
                background: "var(--rose)", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ITrash s={16}/>
            </button>
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}

export function SavedScreen() {
  const { state, dispatch } = useApp();
  const savedIdeas = state.savedIdeas ?? [];
  const displaced = state.displacedIdea;
  const [exitingIds, setExitingIds] = useState(new Set());

  /* Auto-dismiss undo toast after 6s */
  useEffect(() => {
    if (!displaced) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_DISPLACED" }), 6000);
    return () => clearTimeout(t);
  }, [displaced, dispatch]);

  const startIdea = (idea) => {
    dispatch({ type: "SET_IDEA", idea: idea.variables, params: idea.params });
    dispatch({ type: "SET_SCREEN", screen: "setupTimer" });
  };

  const handleRemove = (idea) => {
    const id = idea._id;
    setExitingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      dispatch({ type: "REMOVE_IDEA_BY_ID", id });
      setExitingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 340);
  };

  const capacity = savedIdeas.length;

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "8px 22px 10px", borderBottom: "2px solid var(--ink)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="serif" style={{ fontSize: 30, lineHeight: 1 }}>Guardados</h2>
            {/* Capacity slots */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: MAX_SAVED }).map((_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: 3,
                    border: "1.5px solid var(--ink)",
                    background: i < capacity ? "var(--ink)" : "transparent",
                    transition: "background .2s",
                  }}/>
                ))}
              </div>
              <span className="mono" style={{ fontSize: 10, fontWeight: 800 }}>{capacity}/{MAX_SAVED}</span>
            </div>
          </div>
          <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>
            // ARRASTRA ≡ PARA PRIORIZAR · MÁX {MAX_SAVED} IDEAS
          </p>
        </div>

        {/* Undo toast */}
        <AnimatePresence>
          {displaced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: "hidden", flexShrink: 0 }}
            >
              <div style={{
                background: "var(--coral)", borderBottom: "2px solid var(--ink)",
                padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, fontSize: 12, color: "#fff" }}>
                    Límite alcanzado — se eliminó la última idea
                  </p>
                  <p style={{ fontWeight: 600, fontSize: 11, color: "rgba(255,255,255,.8)", marginTop: 1 }}>
                    {(displaced.variables ?? []).map(v => decodeTag(v)).join(" + ")}
                  </p>
                </div>
                <button
                  onClick={() => dispatch({ type: "UNDO_SAVE" })}
                  style={{
                    height: 32, padding: "0 12px", borderRadius: 999,
                    border: "2px solid #fff", background: "#fff",
                    color: "var(--coral)", fontWeight: 800, fontSize: 11,
                    display: "flex", alignItems: "center", gap: 5, cursor: "pointer", flexShrink: 0,
                  }}
                >
                  <IUndo s={13}/> Deshacer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div className="scroll" style={{ flex: 1, minHeight: 0, padding: "14px 22px 90px" }}>
          {savedIdeas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "52px 0" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, border: "2px solid var(--ink)",
                background: "var(--lilac)", display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <IBookmark s={28}/>
              </div>
              <p className="serif" style={{ fontSize: 24 }}>Sin ideas guardadas</p>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 8 }}>
                // GUARDA DESDE EL RANDÓMETRO O EL FEED
              </p>
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={savedIdeas}
              onReorder={(newOrder) => dispatch({ type: "SET_SAVED_IDEAS", ideas: newOrder })}
              as="div"
              style={{ padding: 0, margin: 0 }}
            >
              {savedIdeas.map((idea, i) => (
                <IdeaCard
                  key={idea._id ?? i}
                  idea={idea}
                  rank={i + 1}
                  isExiting={exitingIds.has(idea._id)}
                  onStart={() => startIdea(idea)}
                  onRemove={() => handleRemove(idea)}
                />
              ))}
            </Reorder.Group>
          )}
        </div>

        <BottomNav current="saved"/>
      </div>
    </Phone>
  );
}
