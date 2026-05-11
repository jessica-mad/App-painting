import { useState, useEffect } from "react";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";
import { fetchUserFollowing } from "../utils/api";
import { getUserLevel } from "../data/parameters";
import { IUser, IArrowL, IBrush } from "../components/Icons";

const COL_CYCLE = ["var(--rose)", "var(--lilac)", "var(--sky)", "var(--mint)", "var(--butter)", "var(--acid)"];

export function FollowListScreen() {
  const { state, dispatch } = useApp();
  const userId = state.followListUserId;
  const returnScreen = state.viewingUserId ? "publicProfile" : "profile";

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchUserFollowing(userId)
      .then(data => setUsers(data?.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const goBack = () => dispatch({ type: "CLEAR_FOLLOW_LIST", returnScreen });
  const viewUser = (id) => dispatch({ type: "VIEW_USER", userId: id });

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
            <h2 className="serif" style={{ fontSize: 26, lineHeight: 1 }}>Siguiendo</h2>
            {!loading && (
              <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 2 }}>
                // {users.length} CUENTA{users.length !== 1 ? "S" : ""}
              </p>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 20px" }}>
          {loading && (
            <p className="mono" style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.4)", padding: "40px 0" }}>// CARGANDO...</p>
          )}

          {!loading && users.length === 0 && (
            <div style={{ textAlign: "center", padding: "52px 24px" }}>
              <p className="serif" style={{ fontSize: 24, lineHeight: 1 }}>Sin cuentas seguidas</p>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.5)", marginTop: 8 }}>
                // EXPLORE EL FEED PARA DESCUBRIR ARTISTAS
              </p>
            </div>
          )}

          {users.map((u, i) => {
            const level = getUserLevel(u.completedChallenges ?? 0);
            const avatarSrc = u.avatarUrl || null;
            const col = COL_CYCLE[i % COL_CYCLE.length];
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
                      {level.name}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.55)" }}>
                      <IBrush s={10}/> {u.completedChallenges ?? 0} retos
                    </span>
                  </div>
                </div>

                <span style={{ fontSize: 16, color: "rgba(20,17,15,.3)" }}>→</span>
              </div>
            );
          })}
        </div>
      </div>
    </Phone>
  );
}
