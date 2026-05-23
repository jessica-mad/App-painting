import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "../components/Phone";
import { Wordmark } from "../components/Wordmark";
import { useApp } from "../data/store";
import { IDice, ITimer, IHeart, IBrush, IStar, IArrowR } from "../components/Icons";
import { useT } from "../i18n";

const SLIDE_ICONS = [IBrush, IDice, ITimer, IHeart];
const SLIDE_BG    = ["var(--acid)", "var(--rose)", "var(--mint)", "var(--lilac)"];

function SlideIndicators({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 6, borderRadius: 999, border: "1.5px solid var(--ink)",
          width: i === current ? 22 : 6,
          background: i === current ? "var(--ink)" : "rgba(20,17,15,.2)",
          transition: "width .25s",
        }}/>
      ))}
    </div>
  );
}

export function IntroScreen() {
  const { dispatch } = useApp();
  const t = useT();
  const [idx, setIdx] = useState(0);
  const isLast = idx === 3;

  const SLIDES = [
    { bg: SLIDE_BG[0], Icon: SLIDE_ICONS[0], tag: t("intro.tag1"), title: t("intro.slide1.title"), body: t("intro.slide1.sub"), stamp: t("intro.slide1.label") },
    { bg: SLIDE_BG[1], Icon: SLIDE_ICONS[1], tag: t("intro.tag2"), title: t("intro.slide2.title"), body: t("intro.slide2.sub"), stamp: t("intro.slide2.label") },
    { bg: SLIDE_BG[2], Icon: SLIDE_ICONS[2], tag: t("intro.tag3"), title: t("intro.slide3.title"), body: t("intro.slide3.sub"), stamp: t("intro.slide3.label") },
    { bg: SLIDE_BG[3], Icon: SLIDE_ICONS[3], tag: t("intro.tag4"), title: t("intro.slide4.title"), body: t("intro.slide4.sub"), stamp: t("intro.slide4.label") },
  ];

  const slide = SLIDES[idx];

  const finish = () => {
    localStorage.setItem("musai_seen_intro", "1");
    dispatch({ type: "SET_SCREEN", screen: "login" });
  };

  const next = () => {
    if (isLast) { finish(); return; }
    setIdx(i => i + 1);
  };

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ padding: "10px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <Wordmark size={22}/>
          <button
            onClick={finish}
            style={{ background: "transparent", border: "none", fontSize: 12, fontWeight: 800, color: "rgba(20,17,15,.45)", cursor: "pointer", padding: "4px 8px" }}
          >
            {t("intro.skip")}
          </button>
        </div>

        {/* Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 18px 14px" }}
          >
            {/* Big visual card */}
            <div className="stk-lg" style={{
              background: slide.bg, position: "relative", overflow: "hidden",
              borderRadius: 24, flex: 1, display: "flex", flexDirection: "column",
              justifyContent: "space-between", padding: "20px 18px",
            }}>
              <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.14 }}/>
              <div className="stripes-y" style={{ position: "absolute", inset: 0, opacity: 0.4 }}/>

              <div style={{ position: "relative" }}>
                <span className="tag" style={{ background: "var(--ink)", color: slide.bg, padding: "3px 8px", borderRadius: 4 }}>
                  {slide.tag}
                </span>
              </div>

              {/* Big icon */}
              <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
                <div style={{
                  width: 120, height: 120, borderRadius: 28,
                  border: "3px solid var(--ink)", background: "var(--paper-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "8px 8px 0 var(--ink)", transform: "rotate(-4deg)",
                }}>
                  <slide.Icon s={60} sw={1.8}/>
                </div>
                {/* Floating stamp */}
                <div className="stamp" style={{
                  position: "absolute", bottom: 8, right: 0,
                  background: "var(--ink)", color: slide.bg, borderColor: slide.bg,
                  transform: "rotate(3deg)",
                }}>
                  ★ {slide.stamp}
                </div>
              </div>

              {/* Step number */}
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <p className="mono" style={{ fontSize: 60, fontWeight: 800, lineHeight: 1, color: "rgba(20,17,15,.12)", letterSpacing: "-0.04em" }}>
                  0{idx + 1}
                </p>
                <IStar s={20} stroke="rgba(20,17,15,.25)"/>
              </div>
            </div>

            {/* Text below card */}
            <div style={{ marginTop: 16 }}>
              <h2 className="serif" style={{ fontSize: 26, lineHeight: 1.05 }}>{slide.title}</h2>
              <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: "rgba(20,17,15,.65)", marginTop: 8 }}>
                {slide.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom controls */}
        <div style={{ padding: "0 18px 20px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <SlideIndicators total={4} current={idx}/>
          <button
            onClick={next}
            className="stk"
            style={{
              height: 56, background: "var(--ink)", color: "var(--acid)",
              border: "2px solid var(--ink)", borderRadius: 18,
              fontWeight: 800, fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: "var(--shadow-lg)", cursor: "pointer",
            }}
          >
            {isLast ? t("intro.start") : (
              <><IArrowR s={18} stroke="var(--acid)"/> {t("intro.next")}</>
            )}
          </button>
        </div>
      </div>
    </Phone>
  );
}
