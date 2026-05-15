import { useState } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { TECHNIQUES } from "../data/parameters";
import { IBrush, ICheck, ITinta, IPencil, ICharcoal, IPastel, IOil, IDigital, IGouache, IMarker, IWatercolor } from "../components/Icons";
import { useT } from "../i18n";

const TECH_ICONS = {
  acuarela: IWatercolor, tinta: ITinta, digital: IDigital, lapiz: IPencil,
  oleo: IOil, manga: IBrush, pixel: IBrush, gouache: IGouache, carboncillo: ICharcoal,
};

const TECH_COLORS = {
  "acuarela": "var(--sky)", "tinta": "var(--ink)", "lapiz": "var(--paper-2)",
  "carbon": "var(--lilac)", "pastel": "var(--rose)", "oleo": "var(--mint)",
  "digital": "var(--butter)", "gouache": "var(--coral)", "marcador": "var(--paper-2)",
};
const TECH_TEXT = { "tinta": "var(--acid)", "gouache": "#fff" };

export function OnboardingScreen() {
  const { dispatch } = useApp();
  const t = useT();
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    if (selected.includes(id)) setSelected(s => s.filter(x => x !== id));
    else if (selected.length < 3) setSelected(s => [...s, id]);
  };

  const confirm = () => {
    if (selected.length < 1) return;
    dispatch({ type: "SET_TECHNIQUES", techniques: selected });
  };

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10px 22px 22px" }}>
        <div style={{ display: "inline-flex", alignSelf: "flex-start", padding: "4px 12px", border: "2px solid var(--ink)", borderRadius: 999, background: "var(--acid)", fontSize: 10, fontWeight: 800, fontFamily: "JetBrains Mono" }}>
          {t("onboarding.step")}
        </div>

        <h2 className="serif" style={{ fontSize: 30, marginTop: 10, lineHeight: 1.05 }}>
          Elige tus{" "}
          <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "0 6px", borderRadius: 6, fontFamily: "Space Grotesk", fontStyle: "normal", fontWeight: 700, fontSize: 22, letterSpacing: "-0.04em" }}>
            3 técnicas
          </span>{" "}
          favoritas
        </h2>
        <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 6 }}>{t("onboarding.subtitle")}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 18, flex: 1 }}>
          {TECHNIQUES.map((tech) => {
            const on = selected.includes(tech.id);
            const bg = TECH_COLORS[tech.id] || "var(--paper-2)";
            const col = TECH_TEXT[tech.id] || "var(--ink)";
            return (
              <button
                key={tech.id}
                onClick={() => toggle(tech.id)}
                className={on ? "stk" : "stk-sm"}
                style={{
                  background: bg, color: col,
                  padding: "10px 6px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  position: "relative", borderRadius: 14,
                  outline: on ? "3px solid var(--acid)" : "none", outlineOffset: 2,
                  cursor: "pointer",
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, border: "2px solid currentColor", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(() => { const TechIcon = TECH_ICONS[tech.id] || IBrush; return <TechIcon s={20} stroke={col}/>; })()}
                </div>
                <span style={{ fontSize: 11, fontWeight: 800 }}>{tech.label}</span>
                {on && (
                  <span style={{ position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 999, background: "var(--acid)", border: "1.5px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ICheck s={11} stroke="var(--ink)"/>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 800 }}>{selected.length} / 3 {t("onboarding.selected")}</span>
          <div style={{ display: "flex", gap: 4 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ width: 22, height: 6, borderRadius: 999, border: "1.5px solid var(--ink)", background: i < selected.length ? "var(--ink)" : "transparent" }}/>
            ))}
          </div>
        </div>

        <button
          onClick={confirm} disabled={selected.length < 1}
          className="stk"
          style={{ marginTop: 12, height: 54, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", cursor: "pointer", opacity: selected.length < 1 ? 0.5 : 1 }}
        >
          <IBrush s={18}/> {t("onboarding.start")}
        </button>
      </div>
    </Phone>
  );
}
