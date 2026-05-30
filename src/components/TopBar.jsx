import { IBell, ISearch } from "./Icons";
import { useApp } from "../data/store";

export function TopBar({ onSearch }) {
  const { state, dispatch } = useApp();
  const { unreadNotifs } = state;

  return (
    <div style={{
      height: 56,
      padding: "0 19px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <span className="rad-bold" style={{ fontSize: 30, color: "#F5F5F5", lineHeight: 1, letterSpacing: "-0.03em" }}>
        unlck.art
      </span>

      {/* Action circles */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* Notification */}
        <button
          onClick={() => dispatch({ type: "SET_SCREEN", screen: "notifications" })}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "transparent",
            border: "1.5px solid #99FC77",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", position: "relative", flexShrink: 0,
          }}
        >
          <IBell s={16} stroke="#F5F5F5"/>
          {unreadNotifs > 0 && (
            <span style={{
              position: "absolute", top: -3, right: -3,
              minWidth: 14, height: 14, borderRadius: 999,
              background: "#99FC77", color: "#1E1E1E",
              fontSize: 8, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 2px",
            }}>
              {unreadNotifs > 9 ? "9+" : unreadNotifs}
            </span>
          )}
        </button>

        {/* Search */}
        <button
          onClick={onSearch}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "transparent",
            border: "1.5px solid #99FC77",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <ISearch s={16} stroke="#F5F5F5"/>
        </button>
      </div>
    </div>
  );
}
