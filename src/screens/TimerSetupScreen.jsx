import { useState, useRef } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { DURATIONS, MUSIC_TRACKS } from "../data/parameters";
import { IArrowL, ITimer, IMusic, IPlay, IPause } from "../components/Icons";
import { useT } from "../i18n";
import { track } from "../utils/track";

export function TimerSetupScreen() {
  const { state, dispatch } = useApp();
  const t = useT();
  const [duration, setDuration] = useState(DURATIONS[2]);
  const [music, setMusic] = useState(MUSIC_TRACKS[0]);
  const [musicOn, setMusicOn] = useState(true);
  const [previewId, setPreviewId] = useState(null);
  const musicScrollRef = useRef(null);
  const previewRef     = useRef(null);

  const availableTracks = MUSIC_TRACKS.filter(t => state.musicSrcs?.[t.id]);
  const hasMusicConfigured = availableTracks.length > 0;

  const togglePreview = (trackObj) => {
    const src = state.musicSrcs?.[trackObj.id];
    if (!src) return;
    if (previewId === trackObj.id) {
      previewRef.current?.pause();
      setPreviewId(null);
    } else {
      if (previewRef.current) {
        previewRef.current.src = src;
        previewRef.current.currentTime = 0;
        previewRef.current.play().catch(() => {});
      }
      setPreviewId(trackObj.id);
      setMusic(trackObj);
      setMusicOn(true);
      track('music_selected', { track: trackObj.id });
    }
  };

  const selectTrack = (trackObj) => {
    const wasPlaying = previewId !== null;
    if (previewRef.current) { previewRef.current.pause(); }
    setPreviewId(null);
    setMusic(trackObj);
    setMusicOn(true);
    track('music_selected', { track: trackObj.id });
    if (wasPlaying) {
      const src = state.musicSrcs?.[trackObj.id];
      if (src && previewRef.current) {
        previewRef.current.src = src;
        previewRef.current.currentTime = 0;
        previewRef.current.play().catch(() => {});
        setPreviewId(trackObj.id);
      }
    }
  };

  const inTutorial = state.tutorialStep !== null;

  const start = () => {
    if (previewRef.current) { previewRef.current.pause(); }
    if (!inTutorial) track('timer_setup_completed', { duration: duration?.seconds ?? 'free', music: music?.id ?? 'none' });
    dispatch({ type: "SET_TIMER_CONFIG", config: { duration, music, musicOn } });
    if (inTutorial) {
      dispatch({ type: "TUTORIAL_GOTO", step: 8, screen: "timer" });
    } else {
      dispatch({ type: "SET_SCREEN", screen: "timer" });
    }
  };

  return (
    <Phone>
      <audio ref={previewRef} onEnded={() => setPreviewId(null)} style={{ display: "none" }}/>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 22px 22px" }}>
        <button
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "idea" })}
          style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, alignSelf: "flex-start", padding: 0, cursor: "pointer" }}
        >
          <IArrowL s={16}/> {t("timer.setup.back")}
        </button>
        <h2 className="serif" style={{ fontSize: 28, marginTop: 8, lineHeight: 1 }}>{t("timer.setup.title")}</h2>
        <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>{t("timer.setup.sub")}</p>

        <div className="scroll" style={{ flex: 1, marginTop: 16 }}>
          {/* Duration */}
          <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <ITimer s={14}/> {t("timer.setup.duration")}
          </p>
          <div data-tutorial="tut-duration" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            {DURATIONS.map((d) => (
              <button
                key={d.label}
                onClick={() => setDuration(d)}
                className={duration.label === d.label ? "stk" : "stk-sm"}
                style={{
                  height: 76, background: duration.label === d.label ? "var(--acid)" : "var(--paper-2)",
                  border: "2px solid var(--ink)", borderRadius: 14,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                  cursor: "pointer",
                }}
              >
                <ITimer s={22}/>
                <span style={{ fontFamily: "JetBrains Mono", fontWeight: 800, fontSize: 13 }}>{d.label}</span>
              </button>
            ))}
          </div>

          {/* Music */}
          {!hasMusicConfigured && (
            <div data-tutorial="tut-music" className="stk-sm" style={{ background: "var(--paper-2)", border: "2px dashed rgba(20,17,15,.25)", borderRadius: 14, padding: "14px 16px", marginBottom: 4 }}>
              <p style={{ fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <IMusic s={14}/> {t("timer.setup.music")} <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, background: "rgba(20,17,15,.1)", padding: "2px 6px", borderRadius: 4 }}>{t("timer.setup.music.soon")}</span>
              </p>
              <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.45)", marginTop: 6 }}>
                {t("timer.setup.music.config")}
              </p>
            </div>
          )}
          {hasMusicConfigured && (
            <div data-tutorial="tut-music">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <IMusic s={14}/> {t("timer.setup.music")}
                  </p>
                  <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.5)", marginTop: 2 }}>{t("timer.setup.music.sub")}</p>
                </div>
                <button
                  onClick={() => setMusicOn(m => !m)}
                  style={{ width: 50, height: 26, borderRadius: 999, border: "2px solid var(--ink)", background: musicOn ? "var(--acid)" : "var(--paper)", position: "relative", cursor: "pointer" }}
                >
                  <div style={{ position: "absolute", top: 1, left: musicOn ? 25 : 2, width: 20, height: 20, borderRadius: 999, background: "#fff", border: "2px solid var(--ink)", transition: "left 0.2s" }}/>
                </button>
              </div>

              {musicOn && (
                <>
                  {previewId && (
                    <style>{`@keyframes eq-bar{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.3)}}`}</style>
                  )}
                  <div className="stk" style={{ background: "var(--ink)", color: "#fff", padding: 12, display: "flex", alignItems: "center", gap: 10, marginBottom: 12, borderRadius: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(223,255,35,.18)", border: "1.5px solid var(--acid)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IMusic s={18} stroke="var(--acid)"/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 800, fontSize: 13 }}>{music.title}</p>
                      <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,.5)" }}>{music.mood?.toUpperCase()}</p>
                    </div>
                    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 14 }}>
                      {[6, 10, 4, 12, 8].map((h, j) => (
                        <span key={j} style={{
                          width: 2, height: h, background: "var(--acid)", borderRadius: 2,
                          display: "inline-block", transformOrigin: "bottom",
                          ...(previewId ? { animation: `eq-bar ${0.45 + j * 0.09}s ease-in-out ${j * 0.06}s infinite` } : {}),
                        }}/>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div ref={musicScrollRef} className="scroll" style={{ display: "flex", gap: 10, paddingBottom: 4 }}>
                {availableTracks.map((track) => {
                  const isPreviewing = previewId === track.id;
                  const isSelected   = music.id === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => selectTrack(track)}
                      style={{
                        minWidth: 130, height: 88, padding: "10px 12px", borderRadius: 16, flexShrink: 0,
                        border: "2px solid var(--ink)",
                        background: isSelected ? "var(--acid)" : "var(--paper-2)",
                        boxShadow: isSelected ? "var(--shadow)" : "3px 3px 0 var(--ink)",
                        outline: isSelected ? "2px solid var(--ink)" : "none", outlineOffset: 2,
                        cursor: "pointer", textAlign: "left",
                        display: "flex", flexDirection: "column", justifyContent: "space-between",
                        position: "relative",
                      }}
                    >
                      <IMusic s={18} style={{ marginTop: 2 }}/>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 11, lineHeight: 1.1 }}>{track.title}</p>
                        <p className="mono" style={{ fontSize: 8, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 2 }}>{track.mood?.toUpperCase()}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePreview(track); }}
                        title={isPreviewing ? t("timer.setup.preview.stop") : t("timer.setup.preview.play")}
                        style={{
                          position: "absolute", top: 8, right: 8,
                          width: 26, height: 26, borderRadius: 999, border: "2px solid var(--ink)",
                          background: isPreviewing ? "var(--ink)" : (isSelected ? "rgba(20,17,15,.15)" : "var(--paper-2)"),
                          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                        }}
                      >
                        {isPreviewing
                          ? <IPause s={11} stroke={isPreviewing ? "var(--acid)" : "var(--ink)"}/>
                          : <IPlay s={11} stroke="var(--ink)"/>
                        }
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Scroll dots */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 8 }}>
                {availableTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      selectTrack(track);
                      if (musicScrollRef.current) {
                        const idx = availableTracks.findIndex(t => t.id === track.id);
                        musicScrollRef.current.scrollTo({ left: idx * 160, behavior: "smooth" });
                      }
                    }}
                    style={{
                      width: track.id === music.id ? 18 : 6, height: 6, borderRadius: 999, padding: 0,
                      border: "1.5px solid var(--ink)",
                      background: track.id === music.id ? "var(--ink)" : "rgba(20,17,15,.2)",
                      cursor: "pointer", transition: "width .2s, background .2s",
                    }}
                  />
                ))}
                <span className="mono" style={{ fontSize: 8, fontWeight: 700, color: "rgba(20,17,15,.4)", marginLeft: 4 }}>
                  {availableTracks.findIndex(t => t.id === music.id) + 1}/{availableTracks.length}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          data-tutorial="tut-start"
          onClick={start}
          className="stk"
          style={{ marginTop: 14, height: 54, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", cursor: "pointer" }}
        >
          <IPlay s={18}/> {t("timer.setup.start")}
        </button>
        <button
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "upload" })}
          style={{ marginTop: 8, height: 40, background: "transparent", border: "none", fontWeight: 700, fontSize: 12, color: "rgba(20,17,15,.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          {t("timer.setup.skip")}
        </button>
      </div>
    </Phone>
  );
}
