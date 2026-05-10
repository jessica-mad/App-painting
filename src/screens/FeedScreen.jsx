import { useState, useEffect } from "react";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { RarityBadge } from "../components/RarityBadge";
import { ArtTile } from "../components/ArtTile";
import { fetchArtworks, addReaction } from "../utils/api";
import { SAMPLE_POSTS } from "../data/parameters";
import { IHeart, IInspire, IFlame, ISpark, IBookmark, IUser } from "../components/Icons";

const FILTERS = ["Para ti", "Siguiendo", "Legendarios", "Temporada"];
const COL_CYCLE = ["var(--rose)", "var(--lilac)", "var(--sky)", "var(--mint)", "var(--butter)", "var(--acid)"];

function ArtCard({ post, idx }) {
  const [likes,    setLikes]    = useState(post.likes    ?? 0);
  const [inspires, setInspires] = useState(post.inspires ?? 0);
  const [tries,    setTries]    = useState(post.tries    ?? 0);
  const [reacted,  setReacted]  = useState({ like: false, inspire: false, try: false });

  const react = (type) => {
    if (post.id) addReaction(post.id, type).catch(() => {});
    const was = reacted[type];
    if (type === "like")    setLikes(n    => was ? n - 1 : n + 1);
    if (type === "inspire") setInspires(n => was ? n - 1 : n + 1);
    if (type === "try")     setTries(n    => was ? n - 1 : n + 1);
    setReacted(r => ({ ...r, [type]: !was }));
  };

  const tags   = post.variables ?? post.tags ?? [];
  const user   = post.username ?? post.user ?? "Artista";
  const tech   = post.technique ?? "—";
  const rarity = post.rarity ?? "Común";
  const prompt = post.prompt ?? tags.join(" + ");
  const col    = COL_CYCLE[idx % COL_CYCLE.length];

  const reactions = [
    { Ico: IHeart,   count: likes,    type: "like",    col: "var(--rose)",   active: reacted.like },
    { Ico: IInspire, count: inspires, type: "inspire", col: "var(--lilac)",  active: reacted.inspire },
    { Ico: IFlame,   count: tries,    type: "try",     col: "var(--butter)", active: reacted.try },
  ];

  return (
    <div className="stk" style={{ background: "var(--paper-2)", padding: 0, marginBottom: 14, borderRadius: 18, overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 8px" }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, border: "2px solid var(--ink)", background: col, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IUser s={18}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: 13 }}>{user}</p>
          <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.5)" }}>{tech.toUpperCase()} · 32 MIN</p>
        </div>
        <RarityBadge rarity={rarity}/>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display: "flex", gap: 6, padding: "0 14px 10px", flexWrap: "wrap" }}>
          {tags.map((t, i) => (
            <span key={i} style={{ background: "var(--acid)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
              {typeof t === "string" ? t : t.value}
            </span>
          ))}
        </div>
      )}

      {/* Artwork */}
      <div style={{ position: "relative" }}>
        <ArtTile kind={idx} height={260}/>
        {prompt && (
          <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, background: "rgba(20,17,15,.85)", color: "#fff", borderRadius: 10, padding: "8px 10px", border: "1.5px solid var(--ink)" }}>
            <p className="serif" style={{ fontSize: 14, lineHeight: 1.2 }}>{prompt}</p>
          </div>
        )}
      </div>

      {/* Reactions */}
      <div style={{ display: "flex", gap: 8, padding: 12 }}>
        {reactions.map((b, j) => (
          <button
            key={j}
            onClick={() => react(b.type)}
            style={{
              flex: 1, height: 38, borderRadius: 12, border: "2px solid var(--ink)",
              background: b.active ? b.col : "var(--paper-2)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontWeight: 800, fontSize: 12,
              boxShadow: b.active ? "3px 3px 0 var(--ink)" : "none",
              cursor: "pointer",
            }}
          >
            <b.Ico s={15}/> {b.count}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FeedScreen() {
  const [filter, setFilter] = useState("Para ti");
  const [posts, setPosts]   = useState(SAMPLE_POSTS);

  useEffect(() => {
    fetchArtworks()
      .then(data => { if (data?.artworks?.length) setPosts(data.artworks); })
      .catch(() => {});
  }, []);

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "8px 22px 6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="serif" style={{ fontSize: 32, lineHeight: 1 }}>Feed</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <span className="stk-sm" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--paper-2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <ISpark s={18}/>
              </span>
              <span className="stk-sm" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--paper-2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <IBookmark s={18}/>
              </span>
            </div>
          </div>
          {/* Filters */}
          <div className="scroll" style={{ display: "flex", gap: 8, marginTop: 10, paddingBottom: 4 }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flexShrink: 0, padding: "5px 12px", borderRadius: 999,
                  border: "2px solid var(--ink)",
                  background: filter === f ? "var(--ink)" : "var(--paper-2)",
                  color: filter === f ? "var(--acid)" : "var(--ink)",
                  fontWeight: 700, fontSize: 11,
                  boxShadow: filter === f ? "3px 3px 0 var(--ink)" : "none",
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="scroll" style={{ flex: 1, padding: "8px 18px 90px" }}>
          {posts.map((post, i) => (
            <ArtCard key={post.id ?? i} post={post} idx={i}/>
          ))}
        </div>

        <BottomNav current="feed"/>
      </div>
    </Phone>
  );
}
