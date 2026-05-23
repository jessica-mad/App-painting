import { useState, useEffect } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { fetchUserFollowing, fetchUserFollowers, followUser, WP_USER_ID } from "../utils/api";
import { getUserLevel, getLevelName } from "../data/parameters";
import { IUser, IArrowL, IBrush, ICheck } from "../components/Icons";
import { useT } from "../i18n";

const COL_CYCLE = ["var(--rose)", "var(--lilac)", "var(--sky)", "var(--mint)", "var(--butter)", "var(--acid)"];

export function FollowListScreen() {
  const { state, dispatch } = useApp();
  const t = useT();
  const userId      = state.followListUserId;
  const listType    = state.followListType ?? "following";
  const returnScreen = state.viewingUserId ? "publicProfile" : "profile";
  const isOwn       = parseInt(userId) === WP_USER_ID;
  const canUnfollow = isOwn && listType === "following";

  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [unfollowing, setUnfollowing] = useState({}); // userId → true while in-flight

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const fetcher = listType === "followers" ? fetchUserFollowers : fetchUserFollowing;
    fetcher(userId)
      .then(data => setUsers(data?.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, listType]);

  const goBack   = () => dispatch({ type: "CLEAR_FOLLOW_LIST", returnScreen });
  const viewUser = (id) => dispatch({ type: "VIEW_USER", userId: id });

  const handleUnfollow = async (targetId, e) => {
    e.stopPropagation();
    if (unfollowing[targetId]) return;
    setUnfollowing(s => ({ ...s, [targetId]: true }));
    try {
      await followUser(targetId);
      setUsers(us => us.filter(u => parseInt(u.id) !== parseInt(targetId)));
    } catch {}
    setUnfollowing(s => { const n = { ...s }; delete n[targetId]; return n; });
  };

  const title = listType === "followers" ? t("follow.title.followers") : t("follow.title.following");

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "10px 18px 12px", borderBottom: "2px solid var(--ink)", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={goBack}
            style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, cursor: "pointer", padding: 0 }}
          >
            <IArrowL s={16}/>
          </button>
          <div>
            <h2 className="serif" style={{ fontSize: 26, lineHeight: 1 }}>{title}</h2>
            {!loading && (
              <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 2 }}>
                {users.length === 1 ? t("follow.count.one") : t("follow.count.many", { n: users.length })}
              </p>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 20px" }}>
          {loading && (
            <p className="mono" style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.4)", padding: "40px 0" }}>{t("follow.loading")}</p>
          )}

          {!loading && users.length === 0 && (
            <div style={{ textAlign: "center", padding: "52px 24px" }}>
              <p className="serif" style={{ fontSize: 24, lineHeight: 1 }}>
                {listType === "followers" ? t("follow.empty.followers") : t("follow.empty.following")}
              </p>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 8 }}>
                {t("follow.empty.hint")}
              </p>
            </div>
          )}

          {users.map((u, i) => {
            const level     = getUserLevel(u.completedChallenges ?? 0, state.levels);
            const avatarSrc = u.avatarUrl || null;
            const col       = COL_CYCLE[i % COL_CYCLE.length];
            const busy      = unfollowing[u.id];
            return (
              <div
                key={u.id ?? i}
                onClick={() => viewUser(u.id)}
                className="stk-sm"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", marginBottom: 10,
                  background: "var(--paper-2)", borderRadius: 14,
                  cursor: "pointer",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 52, height: 52, borderRadius: 999,
                  border: "2px solid var(--ink)", background: col,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", flexShrink: 0,
                }}>
                  {avatarSrc
                    ? <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                    : <IUser s={26}/>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, lineHeight: 1 }}>{u.displayName ?? u.username}</p>
                  <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 2 }}>
                    @{u.username}
                  </p>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                    <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "2px 7px", borderRadius: 999, fontSize: 9, fontWeight: 800 }}>
                      {getLevelName(level, state.lang)}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>
                      <IBrush s={10}/> {u.completedChallenges ?? 0} {t("follow.challenges")}
                    </span>
                  </div>
                </div>

                {canUnfollow ? (
                  <button
                    onClick={(e) => handleUnfollow(u.id, e)}
                    disabled={busy}
                    style={{
                      height: 32, padding: "0 12px", borderRadius: 10,
                      border: "2px solid var(--ink)",
                      background: "var(--paper-2)",
                      fontWeight: 800, fontSize: 11,
                      display: "flex", alignItems: "center", gap: 5,
                      cursor: busy ? "default" : "pointer",
                      opacity: busy ? 0.45 : 1,
                      flexShrink: 0,
                      fontFamily: "Space Grotesk",
                    }}
                  >
                    <ICheck s={12}/> {t("follow.unfollow")}
                  </button>
                ) : (
                  <span style={{ fontSize: 16, color: "rgba(20,17,15,.3)" }}>→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Phone>
  );
}
