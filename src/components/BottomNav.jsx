import { useState } from "react";
import { useApp } from "../data/store";
import { useT } from "../i18n";
import { IHome, IFeed, IBookmark, ISketchbook } from "./Icons";

// Star-badge central button (Figma: outer star #1E1E1E/stroke #99FC77, inner star #99FC77/stroke #1E1E1E, + cross)
function StarCenterBtn({ onClick }) {
  const size = 64;
  const cx = size / 2, cy = size / 2;

  function starPoints(cx, cy, outerR, innerR, numPoints) {
    const pts = [];
    for (let i = 0; i < numPoints * 2; i++) {
      const angle = (i * Math.PI) / numPoints - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
    }
    return pts.join(" ");
  }

  return (
    <button
      onClick={onClick}
      style={{
        background: "none", border: "none", cursor: "pointer",
        padding: 0, width: size, height: size,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", marginTop: -20, flexShrink: 0,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
        {/* Outer star — dark fill, green stroke */}
        <polygon
          points={starPoints(cx, cy, 32, 24, 12)}
          fill="#1E1E1E"
          stroke="#99FC77"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Inner star — green fill, dark stroke */}
        <polygon
          points={starPoints(cx, cy, 26, 19, 12)}
          fill="#99FC77"
          stroke="#1E1E1E"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* + cross */}
        <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

// Speech bubble tooltip
function Bubble({ label }) {
  return (
    <div style={{
      position: "absolute",
      bottom: "calc(100% + 10px)",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#F5F5F5",
      color: "#1E1E1E",
      fontSize: 10,
      fontWeight: 800,
      fontFamily: "JetBrains Mono",
      padding: "5px 10px",
      borderRadius: 8,
      whiteSpace: "nowrap",
      pointerEvents: "none",
      zIndex: 999,
      boxShadow: "2px 2px 0 rgba(20,17,15,0.25)",
    }}>
      {label}
      <span style={{
        position: "absolute",
        bottom: -6, left: "50%", transform: "translateX(-50%)",
        width: 0, height: 0,
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderTop: "6px solid #F5F5F5",
      }}/>
    </div>
  );
}

function NavBtn({ id, Icon, label, active, showTooltip, locked, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent", border: "none",
        cursor: locked ? "default" : "pointer",
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", opacity: locked ? 0.4 : 1,
        padding: 0, height: "100%",
      }}
    >
      {showTooltip && <Bubble label={label}/>}
      <Icon
        s={24}
        sw={active ? 2.4 : 1.8}
        stroke={active ? "#99FC77" : "#F5F5F5"}
      />
    </button>
  );
}

export function BottomNav({ current }) {
  const { state, dispatch } = useApp();
  const t = useT();
  const [tooltip, setTooltip] = useState(null);

  const feedLocked = (state.profile?.completedChallenges ?? 0) < 1;

  const showTip = (id) => {
    setTooltip(id);
    setTimeout(() => setTooltip(t => t === id ? null : t), 2000);
  };

  const nav = (id) => {
    if (id === "feed" && feedLocked) { showTip("feed-locked"); return; }
    showTip(id);
    dispatch({ type: "SET_SCREEN", screen: id });
  };

  return (
    <div className="navbar">

      <NavBtn
        id="home" Icon={IHome} label={t("nav.home")}
        active={current === "home"} showTooltip={tooltip === "home"}
        onClick={() => nav("home")}
      />

      <NavBtn
        id="feed" Icon={IFeed} label={feedLocked ? t("nav.feed.locked") : t("nav.feed")}
        active={current === "feed"} showTooltip={tooltip === "feed" || tooltip === "feed-locked"}
        locked={feedLocked}
        onClick={() => nav("feed")}
      />

      {/* Central star button */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {tooltip === "random" && <Bubble label={t("nav.challenge")}/>}
        <StarCenterBtn onClick={() => nav("random")}/>
      </div>

      <NavBtn
        id="saved" Icon={IBookmark} label={t("nav.saved")}
        active={current === "saved"} showTooltip={tooltip === "saved"}
        onClick={() => nav("saved")}
      />

      <NavBtn
        id="profile" Icon={ISketchbook} label={t("nav.profile")}
        active={current === "profile"} showTooltip={tooltip === "profile"}
        onClick={() => nav("profile")}
      />

    </div>
  );
}
