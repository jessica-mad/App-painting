import { useState, useRef } from "react";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { TopBar } from "../components/TopBar";
import { ArtworkModal } from "../components/ArtworkModal";
import { useApp } from "../data/store";
import { useT } from "../i18n";
import { searchUsers, searchPosts, WP_TRIES_LEFT, IS_LOGGED_IN, WP_USER_ID } from "../utils/api";
import { IUser, ISearch, IX } from "../components/Icons";

const BG = "#6A4EFF";
const GREEN = "#99FC77";
const DARK = "#1E1E1E";
const WHITE = "#F5F5F5";

/* 7-point star for streak row */
function StarIcon({ size = 14, fill = GREEN }) {
  const cx = size / 2, cy = size / 2;
  const pts = [];
  const outer = size / 2, inner = size / 4;
  for (let i = 0; i < 14; i++) {
    const angle = (i * Math.PI) / 7 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <polygon points={pts.join(" ")} fill={fill}/>
    </svg>
  );
}

const COL_CYCLE = ["#E891F9", "#3D3AF1", "#99FC77", "#FFE9A8", "#BEE5F5", "#FFC9D8"];

export function HomeScreen() {
  const { state, dispatch } = useApp();
  const t = useT();
  const { profile } = state;
  const firstName = (profile.displayName || profile.username || "artista").split(" ")[0];

  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchMode, setSearchMode] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeArtwork, setActiveArtwork] = useState(null);
  const [triesLeft, setTriesLeft] = useState(WP_TRIES_LEFT);
  const searchTimer = useRef(null);

  const handleSearchInput = (val) => {
    setSearchQ(val);
    clearTimeout(searchTimer.current);
    const q = val.trim();
    const mode = q.startsWith("#") ? "posts" : q.startsWith("@") ? "users" : null;
    if (!mode || q.length < 3) { setSearchMode(null); setSearchResults([]); return; }
    setSearchMode(mode);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const term = q.slice(1);
        if (mode === "posts") {
          const res = await searchPosts(term);
          setSearchResults(res?.artworks ?? []);
        } else {
          const res = await searchUsers(term);
          setSearchResults(res?.users ?? []);
        }
      } catch {}
      setSearching(false);
    }, 350);
  };

  const clearSearch = () => {
    setSearchQ(""); setSearchMode(null); setSearchResults([]);
    clearTimeout(searchTimer.current);
  };

  const viewUser = (userId) => {
    if (!userId) return;
    const uid = parseInt(userId);
    if (IS_LOGGED_IN && uid === WP_USER_ID) {
      dispatch({ type: "SET_SCREEN", screen: "profile" });
    } else {
      dispatch({ type: "VIEW_USER", userId: uid });
    }
  };

  const triesUsed = (state.rollsLimit ?? 3) - (state.rollsLeft ?? 3);
  const triesTotal = state.rollsLimit ?? 3;

  return (
    <Phone dark>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: BG, overflow: "hidden" }}>

        <TopBar onSearch={() => setShowSearch(s => !s)}/>

        <div className="scroll" style={{ flex: 1, padding: "0 19px 100px" }}>

          {/* Search overlay */}
          {showSearch && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                height: 44, borderRadius: 14,
                border: "1.5px solid rgba(245,245,245,0.3)",
                background: "rgba(255,255,255,0.12)",
                padding: "0 14px",
              }}>
                <ISearch s={15} stroke={WHITE}/>
                <input
                  autoFocus
                  value={searchQ}
                  onChange={e => handleSearchInput(e.target.value)}
                  placeholder={t("home.search.placeholder")}
                  style={{
                    flex: 1, border: "none", background: "transparent",
                    fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13,
                    outline: "none", color: WHITE,
                  }}
                />
                {searchQ
                  ? <button onClick={clearSearch} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", opacity: 0.5 }}><IX s={14} stroke={WHITE}/></button>
                  : <button onClick={() => setShowSearch(false)} style={{ all: "unset", cursor: "pointer", color: WHITE, fontSize: 11, fontWeight: 700, opacity: 0.6 }}>✕</button>
                }
              </div>

              {/* Search results */}
              {searching && (
                <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(245,245,245,.5)", marginTop: 8 }}>{t("home.search.searching")}</p>
              )}
              {!searching && searchResults.length === 0 && searchQ.length >= 3 && searchMode && (
                <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(245,245,245,.4)", textAlign: "center", padding: "20px 0" }}>
                  {t("home.search.empty", { query: searchQ })}
                </p>
              )}
              {searchMode === "users" && searchResults.map((u, i) => (
                <div key={u.id ?? i} onClick={() => viewUser(u.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.1)", marginTop: 8, cursor: "pointer" }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: COL_CYCLE[i % COL_CYCLE.length], overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/> : <IUser s={18}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 800, fontSize: 13, margin: 0, color: WHITE }}>{u.displayName}</p>
                    {u.handle && <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(245,245,245,.5)", margin: "2px 0 0" }}>@{u.handle}</p>}
                  </div>
                </div>
              ))}
              {searchMode === "posts" && searchResults.map((post, i) => {
                const images = post.images?.length ? post.images : (post.image ? [post.image] : []);
                return (
                  <div key={post.id ?? i} onClick={() => setActiveArtwork(post)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.1)", marginTop: 8, cursor: "pointer" }}
                  >
                    <div style={{ width: 50, height: 50, borderRadius: 10, background: images.length ? DARK : COL_CYCLE[i % COL_CYCLE.length], overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {images.length > 0 ? <img src={images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/> : <span style={{ fontSize: 22, opacity: 0.4 }}>🖼</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 800, fontSize: 13, margin: 0, color: WHITE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.prompt || post.description || "Sin título"}</p>
                      <p style={{ fontWeight: 600, fontSize: 11, color: "rgba(245,245,245,.5)", margin: "2px 0 0" }}>{post.username}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Greeting */}
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800, fontSize: 22,
            color: WHITE, margin: "4px 0 20px",
            lineHeight: 1.2,
          }}>
            Hola, {firstName} 🪶
          </p>

          {/* CTA card */}
          <div
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })}
            style={{
              width: "100%", minHeight: 197,
              background: GREEN, borderRadius: 20,
              padding: "22px 20px 20px",
              marginBottom: 12, cursor: "pointer",
              display: "flex", flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}
          >
            <div>
              <p className="rad-bold" style={{
                fontSize: 38, lineHeight: 1.05, color: DARK,
                margin: 0, maxWidth: 280,
              }}>
                {t("home.cta.headline")}
              </p>
            </div>
            <p className="rad-light" style={{
              fontSize: 18, color: DARK, margin: "12px 0 0",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              crear ideas →
            </p>
          </div>

          {/* Streak card */}
          <div style={{
            width: "100%", minHeight: 95,
            border: "1.5px solid " + WHITE,
            borderRadius: 17,
            padding: "14px 18px",
            marginBottom: 12,
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}>
            <div>
              <p className="rad-bold" style={{ fontSize: 22, color: WHITE, margin: 0, lineHeight: 1 }}>
                {profile.streak ?? 0}
              </p>
              <p className="rad-light" style={{ fontSize: 13, color: "rgba(245,245,245,0.7)", margin: "3px 0 0" }}>
                días de racha
              </p>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <StarIcon key={i} size={16} fill={i < (profile.streak % 7 || 0) ? GREEN : "rgba(245,245,245,0.25)"}/>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 11, marginBottom: 12 }}>
            {/* Stat 1 – pink */}
            <div style={{
              flex: 1, background: "#E891F9", borderRadius: 17,
              padding: "18px 16px", display: "flex", flexDirection: "column",
            }}>
              <p className="rad-light" style={{ fontSize: 46, color: DARK, margin: 0, lineHeight: 1 }}>
                {profile.completedChallenges ?? 0}
              </p>
              <p className="rad-light" style={{ fontSize: 12, color: DARK, margin: "6px 0 0", opacity: 0.7 }}>
                retos hechos
              </p>
            </div>
            {/* Stat 2 – blue */}
            <div style={{
              flex: 1, background: "#3D3AF1", borderRadius: 17,
              padding: "18px 16px", display: "flex", flexDirection: "column",
            }}>
              <p className="rad-light" style={{ fontSize: 46, color: WHITE, margin: 0, lineHeight: 1 }}>
                {profile.totalLikes ?? 0}
              </p>
              <p className="rad-light" style={{ fontSize: 12, color: WHITE, margin: "6px 0 0", opacity: 0.7 }}>
                likes recibidos
              </p>
            </div>
          </div>

        </div>

        {/* BottomNav wrapper with pill labels */}
        <BottomNavWithLabels current="home" triesLeft={state.rollsLeft ?? 3} triesTotal={triesTotal} dispatch={dispatch}/>
      </div>

      {activeArtwork && (
        <ArtworkModal
          post={activeArtwork}
          onClose={() => setActiveArtwork(null)}
          triesLeft={triesLeft}
          onTryUsed={(serverLeft) => setTriesLeft(tl => typeof serverLeft === "number" ? serverLeft : Math.max(0, tl - 1))}
          onViewAuthor={activeArtwork.author_id ? () => { setActiveArtwork(null); viewUser(activeArtwork.author_id); } : undefined}
        />
      )}
    </Phone>
  );
}

/* BottomNav with pill labels row above */
function BottomNavWithLabels({ current, triesLeft, triesTotal, dispatch }) {
  const labels = ["Escritorio", "Feed", "Sketchbook", "Ideas"];

  return (
    <div style={{ flexShrink: 0, position: "relative" }}>
      {/* Pill labels row */}
      <div style={{
        display: "flex", justifyContent: "center",
        padding: "0 16px 6px",
        background: "transparent",
      }}>
        <div style={{
          width: 358, display: "flex",
          alignItems: "center", justifyContent: "space-around",
          position: "relative",
        }}>
          {/* tries badge above center */}
          <div style={{
            position: "absolute", left: "50%", top: -28,
            transform: "translateX(-50%)",
            background: GREEN, color: DARK,
            fontSize: 10, fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            padding: "3px 10px", borderRadius: 999,
            whiteSpace: "nowrap", pointerEvents: "none",
          }}>
            {triesLeft}/{triesTotal} intentos
          </div>

          {labels.map((label, i) => (
            <span
              key={label}
              className="rad-light"
              style={{
                fontSize: 14, color: WHITE,
                background: "rgba(245,245,245,0.12)",
                borderRadius: 999, padding: "4px 12px",
                cursor: "pointer",
                opacity: i === 2 ? 0 : 1, /* hide center slot — star btn is there */
              }}
              onClick={() => {
                const screens = ["home", "feed", "random", "saved", "profile"];
                dispatch({ type: "SET_SCREEN", screen: screens[i] });
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <BottomNav current={current}/>
    </div>
  );
}
