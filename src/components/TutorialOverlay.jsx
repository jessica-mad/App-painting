import { useEffect, useState, useRef } from "react";
import { useApp } from "../data/store";
import { useT } from "../i18n";
import { TUTORIAL_STEPS } from "../data/tutorial";

function useTargetRect(target, screen, tutorialStep) {
  const [rect, setRect] = useState(null);
  const roRef = useRef(null);

  useEffect(() => {
    if (!target) { setRect(null); return; }

    function measure() {
      const el = document.querySelector(`[data-tutorial="${target}"]`);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    }

    measure();
    const timer = setTimeout(measure, 120);

    const el = document.querySelector(`[data-tutorial="${target}"]`);
    if (el) {
      roRef.current = new ResizeObserver(measure);
      roRef.current.observe(el);
      roRef.current.observe(document.body);
    }

    return () => {
      clearTimeout(timer);
      roRef.current?.disconnect();
      roRef.current = null;
    };
  }, [target, screen, tutorialStep]);

  return rect;
}

const PAD = 8;

export function TutorialOverlay() {
  const { state, dispatch } = useApp();
  const t = useT();
  const { tutorialStep, screen } = state;

  const step = tutorialStep !== null ? TUTORIAL_STEPS[tutorialStep] : null;
  const rect = useTargetRect(step?.target ?? null, screen, tutorialStep);

  if (tutorialStep === null || !step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  /* ── Spotlight cutout (with padding) ── */
  const spot = rect
    ? {
        top:    Math.max(0, rect.top    - PAD),
        left:   Math.max(0, rect.left   - PAD),
        width:  Math.min(vw, rect.width  + PAD * 2),
        height: Math.min(vh, rect.height + PAD * 2),
      }
    : { top: vh / 2 - 40, left: vw / 2 - 40, width: 80, height: 80 };

  const spotBottom = spot.top + spot.height;
  const spotRight  = spot.left + spot.width;

  /* pointer events on bands: block all if not interactive, pass-through if interactive */
  const bandsPtr = step.interactive ? "none" : "auto";

  const BAND = {
    position: "fixed",
    background: "rgba(0,0,0,0.72)",
    zIndex: 9990,
    pointerEvents: bandsPtr,
  };

  /* ── Tooltip position ── */
  const TOOLTIP_W = Math.min(300, vw - 32);
  const spaceBelow = vh - spotBottom - 16;
  const spaceAbove = spot.top - 16;
  const tooltipAbove = spaceBelow < 160 && spaceAbove > spaceBelow;
  const tooltipTop = tooltipAbove
    ? spot.top - 16
    : spotBottom + 16;
  const tooltipLeft = Math.min(
    Math.max(16, spot.left + spot.width / 2 - TOOLTIP_W / 2),
    vw - TOOLTIP_W - 16,
  );

  const isLast = step.isLast;

  return (
    <>
      {/* Top band */}
      <div style={{ ...BAND, top: 0, left: 0, right: 0, height: spot.top }} />
      {/* Bottom band */}
      <div style={{ ...BAND, top: spotBottom, left: 0, right: 0, bottom: 0 }} />
      {/* Left band */}
      <div style={{ ...BAND, top: spot.top, left: 0, width: spot.left, height: spot.height }} />
      {/* Right band */}
      <div style={{ ...BAND, top: spot.top, left: spotRight, right: 0, height: spot.height }} />

      {/* Spotlight border highlight */}
      {rect && (
        <div style={{
          position: "fixed",
          top: spot.top,
          left: spot.left,
          width: spot.width,
          height: spot.height,
          border: "2.5px solid #DFFF23",
          borderRadius: 16,
          zIndex: 9991,
          pointerEvents: "none",
          boxShadow: "0 0 0 3px rgba(223,255,35,0.18)",
        }} />
      )}

      {/* Tooltip card */}
      <div
        style={{
          position: "fixed",
          top: tooltipAbove ? undefined : tooltipTop,
          bottom: tooltipAbove ? vh - tooltipTop : undefined,
          left: tooltipLeft,
          width: TOOLTIP_W,
          background: "#FFFDF3",
          border: "2.5px solid #14110F",
          borderRadius: 18,
          padding: "16px 18px 14px",
          zIndex: 9992,
          boxShadow: "4px 4px 0 #14110F",
          pointerEvents: "auto",
        }}
      >
        <p style={{ fontWeight: 900, fontSize: 15, lineHeight: 1.15, marginBottom: 6 }}>
          {t(`${step.textKey}.title`)}
        </p>
        <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.55, color: "rgba(20,17,15,.75)", marginBottom: 14 }}>
          {t(`${step.textKey}.body`)}
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button
            onClick={() => dispatch({ type: "TUTORIAL_SKIP" })}
            style={{ background: "none", border: "none", fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.45)", cursor: "pointer", padding: 0 }}
          >
            {t("tut.skip")}
          </button>

          {/* Don't show Next button for interactive+waitForAction steps (user must act) */}
          {(!step.waitForAction) && (
            <button
              onClick={() => isLast
                ? dispatch({ type: "TUTORIAL_END" })
                : dispatch({ type: "TUTORIAL_NEXT" })
              }
              style={{
                background: "#DFFF23", border: "2px solid #14110F", borderRadius: 10,
                padding: "8px 16px", fontWeight: 900, fontSize: 13, cursor: "pointer",
                boxShadow: "2px 2px 0 #14110F",
              }}
            >
              {isLast ? t("tut.finish") : t("tut.next")}
            </button>
          )}
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === tutorialStep ? 16 : 6,
                height: 6,
                borderRadius: 999,
                background: i === tutorialStep ? "#14110F" : "rgba(20,17,15,.2)",
                transition: "width .25s",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
