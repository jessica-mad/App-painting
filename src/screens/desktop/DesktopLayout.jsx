import { useState, useEffect, useRef } from "react";
import { Wordmark } from "../../components/Wordmark";
import { RarityBadge } from "../../components/RarityBadge";
import { useApp } from "../../data/store";
import {
  IHome, IFeed, IBookmark, ISpark, IUser, IDice, IFlame, IHeart, IInspire,
  IBrush, ITimer, IStar, IDiamond, IMusic, IPause, IPlay, IReload, ICheck,
  IArrowR, ILock, ICam, IShare, IPlus, IBolt, ICircle, IArrowL,
} from "../../components/Icons";
import { getUserLevel, LEVELS, TECHNIQUES, PARAMETERS, PARAM_CATEGORIES, RARITY, SEASONS } from "../../data/parameters";
import { fetchArtworks, addReaction, updateProfile, fetchUserArtworks, WP_LOGOUT_URL, WP_LOGIN_URL, IS_LOGGED_IN, IS_ADMIN, WP_USER_ID } from "../../utils/api";
import { compressImage } from "../../utils/imageUtils";

function copyToClipboard(text, onDone) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(onDone).catch(() => legacyCopy(text, onDone));
  } else {
    legacyCopy(text, onDone);
  }
}
function legacyCopy(text, onDone) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;opacity:0;top:0;left:0";
  document.body.appendChild(el);
  el.focus(); el.select();
  try { document.execCommand("copy"); onDone?.(); } catch {}
  document.body.removeChild(el);
}

/* ─── Sidebar ─── */
function DeskSidebar({ current }) {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const level = getUserLevel(profile.completedChallenges);

  const items = [
    { id: "home",    Icon: IHome,     label: "Inicio" },
    { id: "random",  Icon: IDice,     label: "Randómetro" },
    { id: "feed",    Icon: IFeed,     label: "Feed" },
    { id: "saved",   Icon: IBookmark, label: "Guardados" },
    { id: "profile", Icon: IUser,     label: "Mi perfil" },
  ];

  return (
    <aside style={{
      width: 240, padding: "20px 14px", borderRight: "2px solid var(--ink)",
      background: "var(--paper-2)", display: "flex", flexDirection: "column", gap: 10,
      flexShrink: 0,
    }} className="grain-soft">
      <div style={{ padding: "0 6px 14px", borderBottom: "2px dashed rgba(20,17,15,.18)" }}>
        <Wordmark size={28}/>
        <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 4 }}>// PARA ARTISTAS</p>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(({ id, Icon, label }) => {
          const active = current === id;
          return (
            <button key={id} onClick={() => dispatch({ type: "SET_SCREEN", screen: id })} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 12,
              border: active ? "2px solid var(--ink)" : "2px solid transparent",
              background: active ? "var(--acid)" : "transparent",
              boxShadow: active ? "3px 3px 0 var(--ink)" : "none",
              fontWeight: active ? 800 : 600, fontSize: 13, fontFamily: "Space Grotesk",
              color: "var(--ink)", textAlign: "left", cursor: "pointer", width: "100%",
            }}>
              <Icon s={18} sw={active ? 2.2 : 1.8}/>
              <span style={{ flex: 1 }}>{label}</span>
              {active && <span>→</span>}
            </button>
          );
        })}
      </nav>

      {/* CTA card */}
      <div className="stk" style={{
        marginTop: 8, background: "var(--ink)", color: "#fff", borderRadius: 14, padding: 14,
        position: "relative", overflow: "hidden",
      }}>
        <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.15 }}/>
        <div style={{ position: "relative" }}>
          <span style={{ background: "var(--acid)", color: "var(--ink)", padding: "2px 6px", borderRadius: 4, fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 800 }}>RETO HOY</span>
          <p className="serif" style={{ fontSize: 22, lineHeight: 1, marginTop: 10, color: "#fff" }}>Genera tu reto</p>
          <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,.6)", marginTop: 4 }}>
            {state.rollsLeft}/3 INTENTOS
          </p>
          <button className="stk" onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })} style={{
            marginTop: 10, width: "100%", padding: "8px 0", background: "var(--acid)",
            border: "2px solid var(--acid)", boxShadow: "3px 3px 0 var(--paper-2)",
            borderRadius: 10, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
          }}>
            <IDice s={14}/> Randomizar
          </button>
        </div>
      </div>

      {/* User card */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {IS_ADMIN && (
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "admin" })}
            style={{
              width: "100%", padding: "9px 12px", borderRadius: 12,
              border: current === "admin" ? "2px solid var(--ink)" : "2px solid rgba(20,17,15,.25)",
              background: current === "admin" ? "var(--acid)" : "var(--ink)",
              color: current === "admin" ? "var(--ink)" : "var(--acid)",
              display: "flex", alignItems: "center", gap: 10,
              fontWeight: 800, fontSize: 12, fontFamily: "Space Grotesk", cursor: "pointer",
            }}
          >
            <IMusic s={16} stroke={current === "admin" ? "var(--ink)" : "var(--acid)"}/>
            <span style={{ flex: 1, textAlign: "left" }}>Panel Admin</span>
            <span style={{ fontSize: 10 }}>⚙</span>
          </button>
        )}
        <div onClick={() => dispatch({ type: "SET_SCREEN", screen: "profile" })} style={{ display: "flex", gap: 10, padding: "10px 8px", borderRadius: 12, background: "var(--rose)", border: "2px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)", alignItems: "center", cursor: "pointer" }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IUser s={18}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.displayName}</p>
            <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>{level.name.toUpperCase()}</p>
          </div>
          <ISpark s={16}/>
        </div>
      </div>
    </aside>
  );
}

/* ─── Topbar ─── */
function DeskTopbar({ title, sub }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", padding: "18px 28px",
      borderBottom: "2px solid var(--ink)", gap: 18, background: "var(--paper-2)",
      flexShrink: 0,
    }} className="grain-soft">
      <div style={{ flex: 1 }}>
        <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)" }}>// {sub}</p>
        <h1 className="serif" style={{ fontSize: 36, lineHeight: 1, marginTop: 4 }}>{title}</h1>
      </div>
      <div title="Búsqueda disponible próximamente" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", border: "2px solid rgba(20,17,15,.2)", borderRadius: 12, background: "var(--paper)", width: 260, opacity: 0.5, cursor: "not-allowed" }}>
        <ISpark s={16}/>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: "rgba(20,17,15,.5)", flex: 1 }}>Buscar artista, técnica…</span>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700, padding: "1px 5px", border: "1.5px solid rgba(20,17,15,.3)", borderRadius: 4, color: "rgba(20,17,15,.4)" }}>PRÓX</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="stk-sm" style={{ width: 38, height: 38, borderRadius: 10, background: "var(--paper-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--ink)", cursor: "pointer" }}>
          <IHeart s={18}/>
        </button>
        <button className="stk-sm" style={{ width: 38, height: 38, borderRadius: 10, background: "var(--butter)", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--ink)", cursor: "pointer", position: "relative" }}>
          <IBookmark s={18}/>
        </button>
      </div>
    </div>
  );
}

/* ─── Flow wrapper — puts any mobile screen inside the sidebar layout ─── */
export function DeskFlowWrapper({ Screen, navId }) {
  const { state } = useApp();
  const navCurrent = navId || (["feed","profile","saved"].includes(state.screen) ? state.screen : "home");
  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <DeskSidebar current={navCurrent}/>
      <main className="desk-main" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Screen/>
      </main>
    </div>
  );
}

/* ─── Desktop Home ─── */
export function DeskHome() {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const level = getUserLevel(profile.completedChallenges);
  const pct = Math.round(((profile.completedChallenges - level.minChallenges) / 10) * 100);

  const stats = [
    { Icon: IFlame,   v: `${profile.streak}d`,  l: "Racha activa",    c: "var(--butter)" },
    { Icon: IBrush,   v: profile.completedChallenges, l: "Retos hechos", c: "var(--mint)" },
    { Icon: IHeart,   v: profile.totalLikes,     l: "Likes recibidos", c: "var(--rose)" },
    { Icon: IInspire, v: profile.totalInspires,  l: "Inspiras",        c: "var(--lilac)" },
  ];

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <DeskSidebar current="home"/>
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <DeskTopbar
          sub={`DÍA ${profile.streak} DE RACHA · ${level.name.toUpperCase()}`}
          title={`Hola, ${profile.displayName.split(" ")[0]} 🪶`}
        />
        <div className="scroll" style={{ flex: 1, padding: 28, display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 22 }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {/* Randómetro CTA */}
            <div className="stk-lg" style={{ background: "var(--acid)", padding: 0, position: "relative", overflow: "hidden", borderRadius: 22, boxShadow: "var(--shadow-lg)" }}>
              <div className="stripes-y" style={{ position: "absolute", inset: 0 }}/>
              <div style={{ position: "relative", padding: 28, display: "grid", gridTemplateColumns: "1.4fr 0.9fr", gap: 24, alignItems: "center" }}>
                <div>
                  <span className="tag" style={{ background: "var(--ink)", color: "var(--acid)", padding: "3px 8px", borderRadius: 4 }}>RETO HOY · {state.rollsLeft}/3 INTENTOS</span>
                  <h2 className="serif" style={{ fontSize: 56, lineHeight: 0.95, marginTop: 14 }}>Genera el reto<br/>de hoy</h2>
                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button className="stk" onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })} style={{ background: "var(--ink)", color: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 14, padding: "12px 18px", fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <IDice s={16} stroke="var(--acid)"/> ¡Randomizar!
                    </button>
                    <button className="stk-sm" onClick={() => dispatch({ type: "SET_SCREEN", screen: "saved" })} style={{ background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 14, padding: "12px 16px", fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <IBookmark s={16}/> Ideas guardadas
                    </button>
                  </div>
                </div>
                <div style={{ position: "relative", aspectRatio: "1 / 1" }}>
                  <div style={{ position: "absolute", inset: 16, border: "3px solid var(--ink)", borderRadius: 24, background: "var(--paper-2)", boxShadow: "6px 6px 0 var(--ink)", transform: "rotate(-6deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IDice s={80} sw={2.2}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {stats.map((s, i) => (
                <div key={i} className="stk-sm" style={{ background: s.c, padding: 14, borderRadius: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.Icon s={18}/>
                  </div>
                  <p className="serif" style={{ fontSize: 36, lineHeight: 1, marginTop: 12 }}>{s.v}</p>
                  <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.65)", marginTop: 4 }}>{s.l.toUpperCase()}</p>
                </div>
              ))}
            </div>

            {/* Recent works placeholder */}
            <div className="stk-sm" style={{ background: "var(--paper-2)", padding: 20, borderRadius: 16, textAlign: "center" }}>
              <p className="serif" style={{ fontSize: 22, lineHeight: 1 }}>Aquí aparecerán tus obras</p>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 8 }}>// COMPLETA TU PRIMER RETO Y PUBLÍCALO</p>
              <button
                onClick={() => dispatch({ type: "SET_SCREEN", screen: "feed" })}
                className="stk-sm"
                style={{ marginTop: 14, height: 38, padding: "0 16px", borderRadius: 10, background: "var(--acid)", border: "2px solid var(--ink)", fontWeight: 800, fontSize: 12, cursor: "pointer" }}
              >
                Ver el feed de la comunidad →
              </button>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Level card */}
            <div className="stk" style={{ background: "var(--mint)", padding: 18, position: "relative", overflow: "hidden", borderRadius: 18 }}>
              <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.12 }}/>
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IBrush s={24}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>NIVEL {String(level.id).padStart(2, "0")}</p>
                    <p className="serif" style={{ fontSize: 22, lineHeight: 1 }}>{level.name}</p>
                  </div>
                  <span className="serif" style={{ fontSize: 38, lineHeight: 1 }}>{pct}%</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ height: 10, borderRadius: 999, border: "2px solid var(--ink)", background: "rgba(255,255,255,.5)", overflow: "hidden", position: "relative" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--ink)" }}/>
                    <div style={{ position: "absolute", left: `${Math.max(0, pct - 2)}%`, top: -4, width: 16, height: 16, borderRadius: 999, background: "var(--acid)", border: "2px solid var(--ink)" }}/>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span className="mono" style={{ fontSize: 9, fontWeight: 700 }}>{profile.completedChallenges} RETOS</span>
                    <span className="mono" style={{ fontSize: 9, fontWeight: 700 }}>SIGUIENTE NIVEL EN {10 - ((profile.completedChallenges - level.minChallenges) % 10)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Streak grid */}
            <div className="stk-sm" style={{ background: "var(--paper-2)", padding: 16, borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><IFlame s={14}/> Racha actual</p>
                <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.5)" }}>{profile.streak} DÍAS</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: 4, marginTop: 12 }}>
                {Array.from({ length: 31 }).map((_, i) => {
                  const filled = i < profile.streak % 31;
                  const lvl = filled ? (i % 4) + 1 : 0;
                  const colors = ["var(--paper)", "rgba(20,17,15,.15)", "var(--mint)", "var(--acid)", "var(--coral)"];
                  return <div key={i} style={{ aspectRatio: "1/1", borderRadius: 4, border: "1.5px solid var(--ink)", background: colors[lvl] }}/>;
                })}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Desktop Feed ─── */
const FEED_FILTERS = ["Para ti", "Siguiendo", "Legendarios", "Esta semana", "Acuarela", "Tinta"];
const COL_CYCLE = ["var(--rose)", "var(--lilac)", "var(--sky)", "var(--mint)", "var(--butter)", "var(--acid)"];

function DeskFeedCard({ post, index }) {
  const { dispatch } = useApp();
  const images = post.images?.length ? post.images : (post.image ? [post.image] : []);
  const user = post.username ?? post.user ?? "Artista";
  const tech = post.technique ?? "—";
  const rarity = post.rarity ?? "Común";
  const tags = post.variables ?? post.tags ?? [];
  const hasAuthor = !!post.author_id;
  const viewAuthor = () => { if (hasAuthor) dispatch({ type: "VIEW_USER", userId: post.author_id }); };

  return (
    <div className="stk-sm" style={{ background: "var(--paper-2)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 8px" }}>
        <div
          onClick={viewAuthor}
          style={{ width: 34, height: 34, borderRadius: 999, border: "2px solid var(--ink)", background: COL_CYCLE[index % COL_CYCLE.length], display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: hasAuthor ? "pointer" : "default", flexShrink: 0 }}
        >
          {post.avatar_url
            ? <img src={post.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
            : <IUser s={16}/>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0, cursor: hasAuthor ? "pointer" : "default" }} onClick={viewAuthor}>
          <p style={{ fontWeight: 800, fontSize: 12 }}>{user}</p>
          <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.5)" }}>{tech.toUpperCase()}</p>
        </div>
        <RarityBadge rarity={rarity}/>
      </div>
      {tags.length > 0 && (
        <div style={{ display: "flex", gap: 5, padding: "0 14px 8px", flexWrap: "wrap" }}>
          {tags.slice(0, 3).map((t, j) => (
            <span key={j} style={{ background: "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>
              {typeof t === "string" ? t : t.value}
            </span>
          ))}
        </div>
      )}
      {images.length > 0 ? (
        <div style={{ width: "100%", height: 260, overflow: "hidden" }}>
          <img src={images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
        </div>
      ) : (
        <div style={{ width: "100%", height: 260, background: "var(--lilac)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {post.prompt && <p className="serif" style={{ fontSize: 14, padding: "12px 16px", textAlign: "center", lineHeight: 1.3 }}>{post.prompt}</p>}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, padding: 12 }}>
        <button
          onClick={() => post.id && addReaction(post.id, "like").catch(() => {})}
          style={{ flex: 1, height: 32, borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 800, fontSize: 11, cursor: "pointer" }}
        >
          <IHeart s={13}/> {post.likes ?? 0}
        </button>
        <button
          onClick={() => post.id && addReaction(post.id, "inspire").catch(() => {})}
          style={{ flex: 1, height: 32, borderRadius: 10, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 800, fontSize: 11, cursor: "pointer" }}
        >
          <IInspire s={13}/> {post.inspires ?? 0}
        </button>
      </div>
    </div>
  );
}

export function DeskFeed() {
  const { dispatch } = useApp();
  const [filter, setFilter] = useState("Para ti");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtworks()
      .then(data => { if (data?.artworks) setPosts(data.artworks); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <DeskSidebar current="feed"/>
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <DeskTopbar sub="LO MEJOR DE LA COMUNIDAD HOY" title="Feed"/>
        <div style={{ padding: "12px 28px", borderBottom: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {FEED_FILTERS.map(f => {
            const active = f === filter;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "6px 14px", borderRadius: 999, border: "2px solid var(--ink)",
                background: active ? "var(--ink)" : "var(--paper-2)",
                color: active ? "var(--acid)" : "var(--ink)",
                fontWeight: 700, fontSize: 12, boxShadow: active ? "3px 3px 0 var(--ink)" : "none",
                cursor: "pointer",
              }}>{f}</button>
            );
          })}
        </div>

        <div className="scroll" style={{ flex: 1, padding: 22, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, alignContent: "start" }}>
          {loading && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0" }}>
              <p className="mono" style={{ fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.4)", animation: "pulse 1.5s ease-in-out infinite" }}>// CARGANDO FEED...</p>
            </div>
          )}
          {!loading && posts.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 24px" }}>
              <p className="serif" style={{ fontSize: 32, lineHeight: 1 }}>Sin obras aún</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(20,17,15,.5)", marginTop: 10 }}>Completa tu primer reto y sube tu obra a la comunidad.</p>
            </div>
          )}
          {posts.map((post, i) => (
            <DeskFeedCard key={post.id ?? i} post={post} index={i}/>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ─── Desktop Profile ─── */
const TABS_OWNER = ["Obras", "Editar", "Logros", "Estadísticas"];
const TABS_GUEST = ["Obras", "Logros", "Estadísticas"];

export function DeskProfile() {
  const { state, dispatch } = useApp();
  const { profile } = state;
  const level = getUserLevel(profile.completedChallenges);
  const PROFILE_TABS = IS_LOGGED_IN ? TABS_OWNER : TABS_GUEST;
  const [tab, setTab] = useState("Obras");

  const [artworks, setArtworks]       = useState([]);
  const [loadingArt, setLoadingArt]   = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarB64, setAvatarB64]     = useState(null);
  const avatarInputRef                = useRef(null);
  const [copied, setCopied]           = useState(false);

  const [editName,    setEditName]    = useState(profile.displayName);
  const [editBio,     setEditBio]     = useState(profile.bio ?? "");
  const [editEmail,   setEditEmail]   = useState(profile.email ?? "");
  const [editSocials, setEditSocials] = useState(profile.socials ?? { instagram: "", tiktok: "", pinterest: "" });
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [saveError,   setSaveError]   = useState(null);

  useEffect(() => {
    if (tab === "Obras" && IS_LOGGED_IN) {
      setLoadingArt(true);
      fetchUserArtworks(WP_USER_ID)
        .then(data => setArtworks(data?.artworks ?? []))
        .catch(() => {})
        .finally(() => setLoadingArt(false));
    }
  }, [tab]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await compressImage(file, { maxPx: 400, quality: 0.75 });
    setAvatarPreview(b64);
    setAvatarB64(b64);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = { displayName: editName, bio: editBio, email: editEmail, socials: editSocials };
      if (avatarB64) payload.avatar = avatarB64;
      if (IS_LOGGED_IN) await updateProfile(payload);
      dispatch({ type: "UPDATE_PROFILE", data: { displayName: editName, bio: editBio, email: editEmail, socials: editSocials, ...(avatarPreview ? { avatarUrl: avatarPreview } : {}) } });
      setAvatarB64(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err?.message || "No se pudieron guardar los cambios. Revisa tu conexión.");
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    if (IS_LOGGED_IN) { window.location.href = WP_LOGOUT_URL; }
    else { dispatch({ type: "LOGOUT" }); }
  };

  const shareLink = profile.shareLink || (window.location.origin + window.location.pathname + "?u=" + profile.username);
  const avatarSrc = avatarPreview || profile.avatarUrl || null;

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <DeskSidebar current="profile"/>
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Hero */}
        <div style={{ background: "var(--lilac)", borderBottom: "2px solid var(--ink)", padding: "28px 32px", position: "relative", overflow: "hidden", flexShrink: 0 }} className="grain-soft">
          <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.12 }}/>
          <div style={{ position: "relative", display: "flex", gap: 22, alignItems: "flex-end" }}>
            <div style={{ position: "relative" }}>
              <div
                onClick={() => IS_LOGGED_IN && avatarInputRef.current?.click()}
                style={{ width: 100, height: 100, borderRadius: 999, border: "3px solid var(--ink)", background: "var(--rose)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "6px 6px 0 var(--ink)", overflow: "hidden", cursor: IS_LOGGED_IN ? "pointer" : "default" }}
              >
                {avatarSrc
                  ? <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                  : <IUser s={52}/>
                }
              </div>
              {IS_LOGGED_IN && (
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  style={{ position: "absolute", bottom: -4, right: -4, width: 32, height: 32, borderRadius: 999, background: "var(--acid)", border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <ICam s={16}/>
                </div>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange}/>
            </div>
            <div style={{ flex: 1 }}>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>@{profile.username.toUpperCase()}</p>
              <h1 className="serif" style={{ fontSize: 48, lineHeight: 1, marginTop: 4 }}>{profile.displayName}</h1>
              {profile.bio && <p style={{ fontSize: 13, fontWeight: 600, marginTop: 6, maxWidth: 460 }}>{profile.bio}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>{level.name}</span>
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center", padding: "4px 10px", borderRadius: 999, border: "2px solid var(--ink)", background: "var(--butter)", fontSize: 11, fontWeight: 800 }}><IFlame s={13}/> {profile.streak} días</span>
                <button
                  onClick={() => copyToClipboard(shareLink, () => { setCopied(true); setTimeout(() => setCopied(false), 1800); })}
                  className="stk-sm"
                  style={{ display: "inline-flex", gap: 6, alignItems: "center", padding: "4px 10px", borderRadius: 999, border: "2px solid var(--ink)", background: copied ? "var(--acid)" : "var(--paper-2)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                >
                  <IShare s={12}/> {copied ? "¡Copiado!" : "Copiar enlace"}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, padding: "0 16px" }}>
              {[
                { l: "Retos",      v: profile.completedChallenges },
                { l: "Seguidores", v: profile.followers > 999 ? `${(profile.followers / 1000).toFixed(1)}K` : profile.followers },
                { l: "Siguiendo",  v: profile.following },
                { l: "Likes",      v: profile.totalLikes > 999 ? `${(profile.totalLikes / 1000).toFixed(1)}K` : profile.totalLikes },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <p className="serif" style={{ fontSize: 32, lineHeight: 1 }}>{s.v}</p>
                  <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)", marginTop: 4 }}>{s.l.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--ink)", background: "var(--paper-2)", flexShrink: 0 }}>
          {PROFILE_TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "12px 24px", border: "none",
              borderRight: "2px solid var(--ink)",
              background: tab === t ? "var(--acid)" : "transparent",
              fontWeight: 800, fontSize: 12, fontFamily: "JetBrains Mono",
              textTransform: "uppercase", letterSpacing: "0.04em", cursor: "pointer",
            }}>{t}</button>
          ))}
        </div>

        <div className="scroll" style={{ flex: 1, padding: 24, display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignContent: "start" }}>
          {tab === "Obras" && (
            <>
              <div>
                <h3 className="serif" style={{ fontSize: 24, marginBottom: 12 }}>Obras publicadas</h3>
                {loadingArt && (
                  <p className="mono" style={{ fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.4)", animation: "pulse 1.5s ease-in-out infinite" }}>// CARGANDO...</p>
                )}
                {!loadingArt && artworks.length === 0 && (
                  <div className="stk-sm" style={{ background: "var(--paper-2)", padding: 20, borderRadius: 16, textAlign: "center" }}>
                    <p className="serif" style={{ fontSize: 22, lineHeight: 1 }}>Aún no has publicado obras</p>
                    <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 8 }}>// COMPLETA TU PRIMER RETO Y PUBLÍCALO</p>
                    <button
                      onClick={() => dispatch({ type: "SET_SCREEN", screen: "random" })}
                      className="stk-sm"
                      style={{ marginTop: 14, height: 38, padding: "0 16px", borderRadius: 10, background: "var(--acid)", border: "2px solid var(--ink)", fontWeight: 800, fontSize: 12, cursor: "pointer" }}
                    >
                      Generar primer reto →
                    </button>
                  </div>
                )}
                {artworks.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {artworks.map((aw, i) => {
                      const img = aw.images?.[0] ?? aw.image ?? null;
                      return (
                        <div key={aw.id ?? i} className="stk-sm" style={{ borderRadius: 14, overflow: "hidden", background: "var(--paper-2)" }}>
                          {img
                            ? <img src={img} alt="" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}/>
                            : <div style={{ width: "100%", aspectRatio: "3/4", background: "var(--lilac)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <p className="serif" style={{ fontSize: 13, padding: 12, textAlign: "center" }}>{aw.prompt}</p>
                              </div>
                          }
                          <div style={{ padding: "8px 10px" }}>
                            <p style={{ fontWeight: 800, fontSize: 11 }}>{aw.technique}</p>
                            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}><IHeart s={10}/> {aw.likes ?? 0}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}><IInspire s={10}/> {aw.inspires ?? 0}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="stk-sm" style={{ background: "var(--mint)", padding: 14, borderRadius: 14 }}>
                  <p style={{ fontWeight: 800, fontSize: 13 }}>Próximo nivel</p>
                  <p className="serif" style={{ fontSize: 22, lineHeight: 1, marginTop: 6 }}>{LEVELS.find(l => l.id === level.id + 1)?.name ?? "¡Maestro!"}</p>
                  <div style={{ height: 8, borderRadius: 999, border: "2px solid var(--ink)", background: "rgba(255,255,255,.6)", overflow: "hidden", marginTop: 10 }}>
                    <div style={{ width: `${Math.round(((profile.completedChallenges - level.minChallenges) / 10) * 100)}%`, height: "100%", background: "var(--ink)" }}/>
                  </div>
                  <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)", marginTop: 6 }}>
                    {10 - ((profile.completedChallenges - level.minChallenges) % 10)} RETOS RESTANTES
                  </p>
                </div>
                <div className="stk-sm" style={{ background: "var(--paper-2)", padding: 14, borderRadius: 14 }}>
                  <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>Heatmap de actividad</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 3 }}>
                    {Array.from({ length: 56 }).map((_, i) => {
                      const lvl = i < profile.streak ? (i % 4) + 1 : 0;
                      return <div key={i} style={{ aspectRatio: "1/1", borderRadius: 2, border: "1px solid var(--ink)", background: ["rgba(20,17,15,.08)", "var(--mint)", "var(--acid)", "var(--coral)", "var(--lilac)"][lvl] }}/>;
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "Editar" && IS_LOGGED_IN && (
            <div style={{ gridColumn: "1 / -1", maxWidth: 560 }}>
              <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 20 }}>Editar perfil</p>

              {/* Avatar upload in edit tab */}
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  style={{ width: 72, height: 72, borderRadius: 999, border: "2px solid var(--ink)", background: "var(--rose)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 }}
                >
                  {avatarSrc
                    ? <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                    : <IUser s={32}/>
                  }
                </div>
                <div>
                  <button onClick={() => avatarInputRef.current?.click()} className="stk-sm"
                    style={{ height: 36, padding: "0 14px", border: "2px solid var(--ink)", borderRadius: 10, background: "var(--paper-2)", fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <ICam s={14}/> Cambiar foto
                  </button>
                  <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.5)", marginTop: 4 }}>JPG, PNG · máx 400px</p>
                </div>
              </div>

              <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>Nombre</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                style={{ width: "100%", border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 14, outline: "none", background: "var(--paper-2)", marginBottom: 14 }} />

              <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>Biografía</label>
              <textarea value={editBio} onChange={e => setEditBio(e.target.value)}
                placeholder="Cuéntanos sobre ti..."
                style={{ width: "100%", height: 80, border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, resize: "none", outline: "none", background: "var(--paper-2)", marginBottom: 14 }} />

              <label style={{ fontWeight: 800, fontSize: 12, display: "block", marginBottom: 6 }}>Email</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                style={{ width: "100%", border: "2px solid var(--ink)", borderRadius: 12, padding: "10px 12px", fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 13, outline: "none", background: "var(--paper-2)", marginBottom: 14 }} />

              <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>Redes sociales</p>
              {[
                { key: "instagram", label: "Instagram", placeholder: "@usuario" },
                { key: "tiktok",    label: "TikTok",    placeholder: "@usuario" },
                { key: "pinterest", label: "Pinterest", placeholder: "usuario" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <label style={{ fontWeight: 700, fontSize: 11, display: "block", marginBottom: 4, color: "rgba(20,17,15,.6)" }}>{label}</label>
                  <input type="text" value={editSocials[key] ?? ""} onChange={e => setEditSocials(s => ({ ...s, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: "100%", border: "2px solid var(--ink)", borderRadius: 10, padding: "8px 12px", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, outline: "none", background: "var(--paper-2)" }} />
                </div>
              ))}

              {saveError && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--rose)", border: "2px solid var(--ink)", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4 }}>
                  ⚠ {saveError}
                </div>
              )}
              <button onClick={handleSaveProfile} disabled={saving} className="stk"
                style={{ width: "100%", height: 50, background: saved ? "var(--mint)" : "var(--acid)", border: "2px solid var(--ink)", borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1, marginTop: 10, marginBottom: 24 }}>
                {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar cambios"}
              </button>

              <div style={{ borderTop: "2px solid var(--ink)", paddingTop: 20 }}>
                <button onClick={handleLogout} className="stk-sm"
                  style={{ width: "100%", height: 48, background: "var(--rose)", border: "2px solid var(--ink)", borderRadius: 14, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}

          {tab === "Logros" && (
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {LEVELS.map(lv => {
                  const unlocked = level.id >= lv.id;
                  const current = level.id === lv.id;
                  return (
                    <div key={lv.id} className={current ? "stk" : "stk-sm"} style={{
                      background: unlocked ? (lv.color || "var(--mint)") : "var(--paper)",
                      padding: 14, opacity: unlocked ? 1 : 0.5, display: "flex", alignItems: "center", gap: 14, borderRadius: 14,
                    }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IBrush s={22}/>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 800, fontSize: 15 }}>{lv.name}</p>
                        <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>{lv.minChallenges}+ RETOS</p>
                      </div>
                      {unlocked ? (
                        <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
                          {current ? "Actual" : "✓"}
                        </span>
                      ) : (
                        <ILock s={18} stroke="rgba(20,17,15,.4)"/>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "Estadísticas" && (
            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { Icon: IHeart,   l: "Likes",       v: profile.totalLikes,    c: "var(--rose)" },
                { Icon: IInspire, l: "Inspiras",     v: profile.totalInspires, c: "var(--lilac)" },
                { Icon: IFlame,   l: "Lo intentaré", v: profile.totalTries,    c: "var(--butter)" },
                { Icon: ITimer,   l: "Pomodoros",    v: profile.pomodorosCompleted, c: "var(--sky)" },
                { Icon: IDice,    l: "Retos",        v: profile.completedChallenges, c: "var(--mint)" },
                { Icon: IStar,    l: "Streak máx",   v: profile.streak,        c: "var(--acid)" },
              ].map((s, i) => (
                <div key={i} className="stk-sm" style={{ background: s.c, padding: 20, borderRadius: 16 }}>
                  <s.Icon s={24}/>
                  <p className="serif" style={{ fontSize: 42, lineHeight: 1, marginTop: 10 }}>{s.v}</p>
                  <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.65)", marginTop: 6 }}>{s.l.toUpperCase()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── Desktop Login ─── */
export function DeskLogin() {
  const goLogin    = () => { window.location.href = `${WP_LOGIN_URL}?redirect_to=${encodeURIComponent(window.location.href)}`; };
  const goRegister = () => { window.location.href = `${WP_LOGIN_URL}?action=register&redirect_to=${encodeURIComponent(window.location.href)}`; };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100vh", background: "var(--paper)", overflow: "hidden" }}>
      {/* Left — marketing */}
      <div style={{ background: "var(--acid)", padding: 48, position: "relative", overflow: "hidden" }} className="grain-soft">
        <div className="stripes-y" style={{ position: "absolute", inset: 0 }}/>
        <div style={{ position: "absolute", top: 30, right: 40, color: "rgba(20,17,15,.18)" }}><ISpark s={48}/></div>
        <div style={{ position: "absolute", bottom: 40, left: 40, color: "rgba(20,17,15,.15)" }}><IStar s={36}/></div>
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
          <Wordmark size={42}/>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span className="stamp" style={{ background: "var(--coral)", color: "#fff", borderColor: "#fff", alignSelf: "flex-start" }}>★ Para artistas reales</span>
            <h1 className="serif" style={{ fontSize: 72, lineHeight: 0.95, marginTop: 18, maxWidth: 540 }}>Por fin, completa tus sketchbooks.</h1>
            <p style={{ fontSize: 16, fontWeight: 600, marginTop: 18, maxWidth: 460, lineHeight: 1.4 }}>Retos creativos aleatorios, timer Pomodoro y una comunidad que dibuja — no scrollea. Captura tu inspiración antes de que desaparezca.</p>
            <div style={{ display: "flex", gap: 8, marginTop: 26, flexWrap: "wrap" }}>
              {[
                { Icon: IDice,  l: "Randómetro" },
                { Icon: ITimer, l: "Pomodoro" },
                { Icon: IHeart, l: "Comunidad real" },
              ].map(({ Icon, l }, i) => (
                <span key={i} className="stk-sm" style={{ background: "var(--paper-2)", padding: "6px 12px", borderRadius: 999, border: "2px solid var(--ink)", fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon s={14}/> {l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div>
              <p className="serif" style={{ fontSize: 36, lineHeight: 1 }}>+∞</p>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>IDEAS POSIBLES</p>
            </div>
            <div style={{ width: 2, height: 36, background: "var(--ink)", opacity: 0.4 }}/>
            <div>
              <p className="serif" style={{ fontSize: 36, lineHeight: 1 }}>0</p>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>EXCUSAS ACEPTADAS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ padding: 48, display: "flex", flexDirection: "column", justifyContent: "center", background: "var(--paper-2)" }}>
        <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>// BIENVENIDA · ACCESO</p>
        <h2 className="serif" style={{ fontSize: 48, lineHeight: 1, marginTop: 8 }}>Únete a InkRush</h2>
        <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(20,17,15,.65)", marginTop: 8, maxWidth: 380 }}>
          Crea tu cuenta o inicia sesión con tu cuenta de WordPress para acceder a la plataforma.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32, maxWidth: 420 }}>
          {/* Google — próximamente */}
          <button disabled style={{ height: 56, background: "var(--paper-2)", border: "2px solid rgba(20,17,15,.25)", borderRadius: 16, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, opacity: 0.5, cursor: "not-allowed" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google · Próximamente
          </button>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1, height: 2, background: "rgba(20,17,15,.1)" }}/>
            <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>O CON EMAIL</span>
            <div style={{ flex: 1, height: 2, background: "rgba(20,17,15,.1)" }}/>
          </div>

          <button className="stk" onClick={goRegister}
            style={{ height: 56, background: "var(--mint)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
            <IUser s={18}/> Crear cuenta gratis
          </button>

          <button className="stk" onClick={goLogin}
            style={{ height: 56, background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
            <ILock s={18}/> Iniciar sesión
          </button>
        </div>

        <div className="stk-sm" style={{ background: "var(--butter)", padding: 14, marginTop: 28, maxWidth: 420, borderRadius: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <ILock s={14}/> Solo artistas reales. Sin bots, sin spam.
          </p>
        </div>
      </div>
    </div>
  );
}
