import { useState } from "react";
import { useApp } from "../data/store";
import { useT } from "../i18n";
import { IHome, IFeed, IPlus, IBookmark, ISketchbook, ILock } from "./Icons";

export function BottomNav({ current }) {
  const { state, dispatch } = useApp();
  const t = useT();
  const [feedTip, setFeedTip] = useState(false);

  const feedLocked = (state.profile?.completedChallenges ?? 0) < 1;

  const NAV_ITEMS = [
    { id: "home",    icon: IHome,       label: t("nav.home") },
    { id: "feed",    icon: IFeed,       label: t("nav.feed") },
    { id: "random",  icon: IPlus,       label: t("nav.challenge"), special: true },
    { id: "saved",   icon: IBookmark,   label: t("nav.saved") },
    { id: "profile", icon: ISketchbook, label: t("nav.profile") },
  ];

  const nav = (id) => {
    if (id === "feed" && feedLocked) {
      setFeedTip(true);
      setTimeout(() => setFeedTip(false), 2800);
      return;
    }
    dispatch({ type: "SET_SCREEN", screen: id });
  };

  return (
    <div className="navbar" style={{ position: "relative" }}>
      {/* Feed locked tooltip */}
      {feedTip && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 10px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--ink)",
          color: "var(--paper)",
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "JetBrains Mono",
          padding: "8px 14px",
          borderRadius: 10,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 999,
          boxShadow: "3px 3px 0 rgba(20,17,15,0.3)",
        }}>
          {t("nav.feed.locked")}
          {/* Arrow */}
          <span style={{
            position: "absolute",
            bottom: -7,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "7px solid var(--ink)",
          }}/>
        </div>
      )}

      {NAV_ITEMS.map((it) => {
        const active = current === it.id;
        const isLockedFeed = it.id === "feed" && feedLocked;

        if (it.special) {
          return (
            <div
              key={it.id}
              onClick={() => nav(it.id)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 999,
                border: "2px solid var(--ink)",
                background: "var(--acid)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "3px 3px 0 var(--ink)",
                position: "relative", marginTop: -16,
              }}>
                <it.icon s={26} sw={2.6} stroke="var(--ink)"/>
                <span style={{
                  position: "absolute", inset: 6, borderRadius: 999,
                  border: "1.5px dashed var(--ink)", opacity: 0.4,
                }}/>
              </div>
            </div>
          );
        }
        return (
          <button
            key={it.id}
            onClick={() => nav(it.id)}
            style={{
              background: "transparent", border: "none", cursor: isLockedFeed ? "default" : "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: active ? "var(--ink)" : "rgba(20,17,15,0.42)",
              paddingTop: 14,
              opacity: isLockedFeed ? 0.45 : 1,
              position: "relative",
            }}
          >
            <it.icon s={22} sw={active ? 2.4 : 1.8}/>
            {isLockedFeed && (
              <ILock s={9} style={{ position: "absolute", top: 12, right: 2 }}/>
            )}
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
              fontFamily: "JetBrains Mono", textTransform: "uppercase",
            }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
