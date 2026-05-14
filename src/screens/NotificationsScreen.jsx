import { useState, useEffect } from "react";
import { Phone } from "../components/Phone";
import { BottomNav } from "../components/BottomNav";
import { useApp } from "../data/store";
import { fetchNotifications, markNotificationsRead, IS_LOGGED_IN } from "../utils/api";
import { IArrowL, IUser, IBell, IHeart, IInspire, IFlame, IComment } from "../components/Icons";

const TYPE_META = {
  like:    { icon: IHeart,   color: "var(--rose)",   label: (n) => `${n} le dio like a tu obra` },
  inspire: { icon: IInspire, color: "var(--lilac)",  label: (n) => `${n} se inspiró con tu obra` },
  try:     { icon: IFlame,   color: "var(--butter)", label: (n) => `${n} va a intentar tu reto` },
  comment: { icon: IComment, color: "var(--sky)",    label: (n) => `${n} comentó en tu obra` },
  follow:  { icon: IUser,    color: "var(--mint)",   label: (n) => `${n} empezó a seguirte` },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr + "Z").getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "ahora";
  if (m < 60)  return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d`;
  return `${Math.floor(d / 7)}sem`;
}

function NotifRow({ notif, onViewUser }) {
  const meta   = TYPE_META[notif.type] ?? TYPE_META.like;
  const IcoFn  = meta.icon;
  const isRead = notif.is_read;

  return (
    <div
      onClick={notif.type === "follow" ? () => onViewUser(notif.from.id) : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 18px",
        background: isRead ? "transparent" : "rgba(20,17,15,.035)",
        borderBottom: "1px solid rgba(20,17,15,.07)",
        cursor: notif.type === "follow" ? "pointer" : "default",
        position: "relative",
      }}
    >
      {/* Unread dot */}
      {!isRead && (
        <div style={{
          position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)",
          width: 6, height: 6, borderRadius: 999, background: "var(--ink)",
        }}/>
      )}

      {/* Avatar + type badge */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 999,
          border: "2px solid var(--ink)", background: "var(--lilac)",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {notif.from.avatar
            ? <img src={notif.from.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
            : <IUser s={20}/>
          }
        </div>
        <div style={{
          position: "absolute", bottom: -2, right: -2,
          width: 20, height: 20, borderRadius: 999,
          background: meta.color, border: "1.5px solid var(--ink)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <IcoFn s={11}/>
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: isRead ? 500 : 700, lineHeight: 1.3, margin: 0 }}>
          {meta.label(notif.from.name)}
        </p>
        {notif.type === "comment" && notif.excerpt && (
          <p style={{
            fontSize: 12, fontWeight: 500, color: "rgba(20,17,15,.55)",
            marginTop: 2, margin: "3px 0 0",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            "{notif.excerpt}"
          </p>
        )}
        <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.38)", marginTop: 3 }}>
          {timeAgo(notif.created_at)}
          {notif.from.handle && ` · @${notif.from.handle}`}
        </p>
      </div>

      {/* Artwork thumbnail */}
      {notif.thumb && (
        <div style={{
          width: 44, height: 44, borderRadius: 10, overflow: "hidden",
          border: "1.5px solid var(--ink)", flexShrink: 0, background: "var(--ink)",
        }}>
          <img src={notif.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
        </div>
      )}
    </div>
  );
}

export function NotificationsScreen() {
  const { dispatch } = useApp();
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [empty,   setEmpty]   = useState(false);

  useEffect(() => {
    if (!IS_LOGGED_IN) return;
    fetchNotifications()
      .then(res => {
        const list = res?.notifications ?? [];
        setNotifs(list);
        setEmpty(list.length === 0);
        // Mark all as read + clear badge
        if (list.some(n => !n.is_read)) {
          markNotificationsRead().catch(() => {});
        }
        dispatch({ type: "CLEAR_UNREAD_NOTIFS" });
      })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false));
  }, []);

  const goBack  = () => dispatch({ type: "SET_SCREEN", screen: "home" });
  const viewUser = (uid) => dispatch({ type: "VIEW_USER", userId: uid });

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "10px 18px 8px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10, borderBottom: "2px solid var(--ink)" }}>
          <button
            onClick={goBack}
            style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, cursor: "pointer", padding: 0 }}
          >
            <IArrowL s={16}/>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <IBell s={18}/>
            <h2 className="serif" style={{ fontSize: 22, lineHeight: 1, margin: 0 }}>Notificaciones</h2>
          </div>
        </div>

        {/* Content */}
        <div className="scroll" style={{ flex: 1 }}>
          {loading && (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <p className="mono" style={{ fontSize: 11, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>// CARGANDO...</p>
            </div>
          )}

          {!loading && empty && (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
              <p className="serif" style={{ fontSize: 24, lineHeight: 1 }}>Sin notificaciones</p>
              <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.45)", marginTop: 8 }}>
                // cuando alguien interactúe con tu obra aparecerá aquí
              </p>
            </div>
          )}

          {!loading && notifs.length > 0 && (
            <div>
              {notifs.map(n => (
                <NotifRow key={n.id} notif={n} onViewUser={viewUser}/>
              ))}
              <p className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.3)", textAlign: "center", padding: "18px 0" }}>
                // últimas 50 notificaciones
              </p>
            </div>
          )}
        </div>

        <BottomNav current="notifications"/>
      </div>
    </Phone>
  );
}
