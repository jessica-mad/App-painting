import { useEffect, useState, useRef } from "react";
import { useApp } from "../data/store";
import { useT } from "../i18n";
import { TUTORIAL_STEPS } from "../data/tutorial";
import { track } from "../utils/track";

const RETRY_DELAYS = [0, 100, 250, 500, 900];

function useTargetRect(target, screen, tutorialStep) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!target) { setRect(null); return; }

    const timers = [];

    function measure() {
      const el = document.querySelector(`[data-tutorial="${target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        /* Only accept a rect that has been fully painted (width or height > 0) */
        if (r.width > 0 || r.height > 0) {
          setRect(r);
          return true;
        }
      }
      return false;
    }

    RETRY_DELAYS.forEach(d => {
      timers.push(setTimeout(measure, d));
    });

    /* ResizeObserver as a continuous safety-net for layout shifts */
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);

    return () => {
      timers.forEach(clearTimeout);
      ro.disconnect();
      setRect(null);
    };
  }, [target, screen, tutorialStep]);

  return rect;
}

const PAD = 8;
const TOOLTIP_ESTIMATED_H = 210;

export function TutorialOverlay() {
  const { state, dispatch } = useApp();
  const t = useT();
  const { tutorialStep, screen } = state;
  const trackedStartRef = useRef(false);

  /* Track tutorial_started once when the overlay first mounts at step 0 */
  useEffect(() => {
    if (tutorialStep === 0 && !trackedStartRef.current) {
      trackedStartRef.current = true;
      track('tutorial_started', {});
    }
  }, [tutorialStep]);

  const step = tutorialStep !== null ? TUTORIAL_STEPS[tutorialStep] : null;
  const rect = useTargetRect(step?.target ?? null, screen, tutorialStep);

  if (tutorialStep === null || !step) return null;

  const vw = window.innerWidth;
  /* Use clientHeight — more stable on mobile with dynamic toolbars */
  const vh = document.documentElement.clientHeight || window.innerHeight;

  /* ── Spotlight cutout (with padding) ── */
  const spot = rect
    ? {
        top:    Math.max(0, rect.top    - PAD),
        left:   Math.max(0, rect.left   - PAD),
        width:  Math.min(vw, rect.width  + PAD * 2),
        height: Math.min(vh, rect.height + PAD * 2),
      }
    : null; /* null → no bands, no highlight until element is found */

  const spotBottom = spot ? spot.top + spot.height : 0;
  const spotRight  = spot ? spot.left + spot.width : 0;

  const bandsPtr = step.interactive ? "none" : "auto";

  const BAND = {
    position: "fixed",
    background: "rgba(0,0,0,0.72)",
    zIndex: 9990,
    pointerEvents: bandsPtr,
  };

  /* ── Tooltip position ── */
  const TOOLTIP_W = Math.min(300, vw - 32);

  let tooltipTop;
  if (spot) {
    const spaceBelow = vh - spotBottom - 16;
    const spaceAbove = spot.top - 16;
    const wantAbove  = spaceBelow < TOOLTIP_ESTIMATED_H && spaceAbove > spaceBelow;
    const rawTop     = wantAbove ? spot.top - TOOLTIP_ESTIMATED_H - 12 : spotBottom + 12;
    tooltipTop = Math.max(8, Math.min(rawTop, vh - TOOLTIP_ESTIMATED_H - 8));
  } else {
    /* No rect yet — center vertically */
    tooltipTop = Math.max(8, vh / 2 - TOOLTIP_ESTIMATED_H / 2);
  }

  const tooltipLeft = spot
    ? Math.min(Math.max(16, spot.left + spot.width / 2 - TOOLTIP_W / 2), vw - TOOLTIP_W - 16)
    : Math.max(16, vw / 2 - TOOLTIP_W / 2);

  const isLast = step.isLast;

  const handleNext = () => {
    if (isLast) {
      track('tutorial_completed', {});
      dispatch({ type: "TUTORIAL_END" });
    } else {
      track('tutorial_step_done', { step: tutorialStep, screen: step.screen });
      dispatch({ type: "TUTORIAL_NEXT" });
    }
  };

  const handleSkip = () => {
    track('tutorial_skipped', { at_step: tutorialStep });
    dispatch({ type: "TUTORIAL_SKIP" });
  };

  return (
    <>
      {/* Dark overlay bands — only render once we have a valid rect */}
      {spot ? (
        <>
          <div style={{ ...BAND, top: 0, left: 0, right: 0, height: spot.top }} />
          <div style={{ ...BAND, top: spotBottom, left: 0, right: 0, bottom: 0 }} />
          <div style={{ ...BAND, top: spot.top, left: 0, width: spot.left, height: spot.height }} />
          <div style={{ ...BAND, top: spot.top, left: spotRight, right: 0, height: spot.height }} />

          {/* Yellow spotlight border */}
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
        </>
      ) : (
        /* Full-screen dim while waiting for element */
        <div style={{ ...BAND, inset: 0, top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "auto" }} />
      )}

      {/* Tooltip card */}
      <div
        style={{
          position: "fixed",
          top: tooltipTop,
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
            onClick={handleSkip}
            style={{ background: "none", border: "none", fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.45)", cursor: "pointer", padding: 0 }}
          >
            {t("tut.skip")}
          </button>

          {/* Only show Next button when the step doesn't require a screen interaction */}
          {!step.waitForAction && (
            <button
              onClick={handleNext}
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
