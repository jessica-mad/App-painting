import { useState } from "react";
import { Phone } from "../components/Phone";
import { Wordmark } from "../components/Wordmark";
import { useApp } from "../data/store";
import { IDice, ITimer, IStar, IHeart, IBrush, IArrowR } from "../components/Icons";

const SLIDES = [
  { Icon: IBrush,  col: "var(--acid)",   title: "Bienvenido a InkRush",   desc: "La app para artistas e ilustradores. Cada día, un reto nuevo para despertar tu creatividad." },
  { Icon: IDice,   col: "var(--lilac)",  title: "El Randometro",           desc: "Combina hasta 3 parámetros y genera una idea artística única. Tienes 3 intentos por día." },
  { Icon: ITimer,  col: "var(--rose)",   title: "Modo Pomodoro",           desc: "Elige tu tiempo de sesión: 10, 15, 30 min o libre. Trabaja con música ambiente." },
  { Icon: IStar,   col: "var(--butter)", title: "Rareza de Ideas",         desc: "Variables: Común, Raro, Épico y Legendario. Las temporadas activan parámetros exclusivos." },
  { Icon: IHeart,  col: "var(--mint)",   title: "Comunidad de Artistas",   desc: "Sube tus dibujos, reacciona con ❤️ ✨ 🔥, inspira y sé inspirado. Sube de nivel creando." },
];

export function TutorialScreen() {
  const [slide, setSlide] = useState(0);
  const { dispatch } = useApp();
  const current = SLIDES[slide];
  const SlideIcon = current.Icon;

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1);
    else dispatch({ type: "SET_SCREEN", screen: "login" });
  };

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 22px 24px" }}>
        {/* Top */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Wordmark size={22}/>
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "login" })}
            style={{ background: "transparent", border: "none", fontSize: 11, fontWeight: 800, fontFamily: "JetBrains Mono", color: "rgba(20,17,15,.5)", cursor: "pointer", textDecoration: "underline" }}
          >
            SALTAR
          </button>
        </div>

        {/* Hero card */}
        <div
          className="stk-lg"
          style={{ background: current.col, padding: "32px 20px", marginTop: 16, position: "relative", overflow: "hidden", textAlign: "center", flex: "0 0 auto" }}
        >
          <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.15 }}/>
          <div className="stripes-y" style={{ position: "absolute", inset: 0, opacity: 0.3 }}/>
          <div style={{ position: "relative" }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, border: "3px solid var(--ink)", background: "var(--paper-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "4px 4px 0 var(--ink)" }}>
              <SlideIcon s={40}/>
            </div>
          </div>
        </div>

        {/* Text */}
        <div style={{ flex: 1, paddingTop: 20 }}>
          <h2 className="serif" style={{ fontSize: 32, lineHeight: 1.05 }}>{current.title}</h2>
          <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(20,17,15,.65)", lineHeight: 1.5, marginTop: 10 }}>
            {current.desc}
          </p>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              style={{
                height: 6, width: i === slide ? 24 : 6,
                borderRadius: 999, border: "1.5px solid var(--ink)",
                background: i === slide ? "var(--ink)" : "transparent",
                cursor: "pointer", transition: "width 0.2s",
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          className="stk"
          style={{ height: 54, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", cursor: "pointer" }}
        >
          {slide < SLIDES.length - 1 ? (
            <><IArrowR s={18}/> Siguiente</>
          ) : (
            <><IBrush s={18}/> ¡Empezar!</>
          )}
        </button>
      </div>
    </Phone>
  );
}
