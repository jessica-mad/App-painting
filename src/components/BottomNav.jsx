import { useApp } from "../data/store";
import { IHome, IFeed, IPlus, IBookmark, IUser } from "./Icons";

const NAV_ITEMS = [
  { id: "home",    icon: IHome,     label: "Inicio" },
  { id: "feed",    icon: IFeed,     label: "Feed" },
  { id: "random",  icon: IPlus,     label: "Reto",   special: true },
  { id: "saved",   icon: IBookmark, label: "Guardar" },
  { id: "profile", icon: IUser,     label: "Perfil" },
];

export function BottomNav({ current }) {
  const { dispatch } = useApp();

  const nav = (id) => {
    const map = {
      home: "HOME", feed: "FEED", random: "RANDOM", saved: "SAVED", profile: "PROFILE",
    };
    if (map[id]) dispatch({ type: "SET_SCREEN", screen: map[id] });
  };

  return (
    <div className="navbar">
      {NAV_ITEMS.map((it) => {
        const active = current === it.id;
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
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: active ? "var(--ink)" : "rgba(20,17,15,0.42)",
              paddingTop: 14,
            }}
          >
            <it.icon s={22} sw={active ? 2.4 : 1.8}/>
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
