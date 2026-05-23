import { useState, useEffect } from "react";
import {
  isPushSupported, isPushBlocked, iosNeedsGuide,
  subscribePush, unsubscribePush, getPushStatus, saveMusaiHour,
} from "../utils/push";
import { IS_LOGGED_IN } from "../utils/api";
import { useT } from "../i18n";

export function PushSettings() {
  const t = useT();
  const [subscribed,  setSubscribed]  = useState(false);
  const [musaiHour,   setMusaiHour]   = useState("");
  const [loading,     setLoading]     = useState(true);
  const [toggling,    setToggling]    = useState(false);
  const [savingHour,  setSavingHour]  = useState(false);
  const [hourSaved,   setHourSaved]   = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (!IS_LOGGED_IN) { setLoading(false); return; }
    getPushStatus().then(s => {
      setSubscribed(s.subscribed);
      setMusaiHour(s.musaiHour || "");
      setLoading(false);
    });
  }, []);

  if (!IS_LOGGED_IN) return null;

  const supported  = isPushSupported();
  const blocked    = isPushBlocked();
  const iosGuide   = iosNeedsGuide();

  async function togglePush() {
    setToggling(true);
    setError("");
    try {
      if (subscribed) {
        await unsubscribePush();
        setSubscribed(false);
      } else {
        await subscribePush();
        setSubscribed(true);
      }
    } catch (e) {
      setError(e.message || t("push.error.toggle"));
    } finally {
      setToggling(false);
    }
  }

  async function handleSaveHour() {
    setSavingHour(true);
    await saveMusaiHour(musaiHour);
    setSavingHour(false);
    setHourSaved(true);
    setTimeout(() => setHourSaved(false), 2000);
  }

  return (
    <div style={{ borderTop: "2px solid var(--ink)", paddingTop: 20, marginTop: 4 }}>
      <p style={{ fontWeight: 900, fontSize: 13, marginBottom: 14 }}>🔔 {t("push.title")}</p>

      {/* iOS without standalone — show guide */}
      {iosGuide ? (
        <div style={{ background: "#111", color: "#fff", borderRadius: 14, border: "2px solid var(--ink)", padding: "14px 16px" }}>
          <p style={{ fontWeight: 800, fontSize: 13, color: "#DFFF23", marginBottom: 10 }}>
            {t("push.ios.title")}
          </p>
          <ol style={{ paddingLeft: 18, margin: 0, lineHeight: 2.2, fontSize: 13, color: "rgba(255,255,255,.8)" }}>
            <li dangerouslySetInnerHTML={{ __html: t("push.ios.step1") }}/>
            <li dangerouslySetInnerHTML={{ __html: t("push.ios.step2") }}/>
            <li>{t("push.ios.step3")}</li>
          </ol>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,.45)", marginTop: 10, marginBottom: 0 }}>
            {t("push.ios.hint")}
          </p>
        </div>
      ) : !supported ? (
        <p style={{ fontSize: 12, color: "rgba(20,17,15,.5)", fontWeight: 700 }}>
          {t("push.unsupported")}
        </p>
      ) : blocked ? (
        <p style={{ fontSize: 12, color: "var(--coral)", fontWeight: 700 }}>
          ⚠ {t("push.blocked")}
        </p>
      ) : loading ? null : (
        <>
          {/* Toggle */}
          <div
            onClick={!toggling ? togglePush : undefined}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 12,
              padding: "12px 14px", cursor: toggling ? "not-allowed" : "pointer",
              opacity: toggling ? 0.6 : 1, marginBottom: 14,
            }}
          >
            <div>
              <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>
                {subscribed ? `✅ ${t("push.on")}` : t("push.off")}
              </p>
              <p style={{ fontSize: 11, color: "rgba(20,17,15,.5)", fontWeight: 600, margin: 0 }}>
                {subscribed ? t("push.on.sub") : t("push.off.sub")}
              </p>
            </div>
            {/* Toggle pill */}
            <div style={{
              width: 44, height: 26, borderRadius: 999,
              background: subscribed ? "var(--ink)" : "rgba(20,17,15,.15)",
              border: "2px solid var(--ink)", position: "relative", transition: "background .2s", flexShrink: 0,
            }}>
              <div style={{
                position: "absolute", top: 2,
                left: subscribed ? 18 : 2,
                width: 18, height: 18, borderRadius: 999,
                background: subscribed ? "var(--acid)" : "#fff",
                border: "1.5px solid var(--ink)", transition: "left .2s",
              }}/>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--coral)", marginBottom: 12 }}>
              ⚠ {error}
            </p>
          )}

          {/* Musai hour — only if subscribed */}
          {subscribed && (
            <div style={{ background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 12, padding: "12px 14px" }}>
              <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>🕐 {t("push.musaiHour.title")}</p>
              <p style={{ fontSize: 11, color: "rgba(20,17,15,.5)", fontWeight: 600, marginBottom: 10 }}>
                {t("push.musaiHour.sub")}
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="time"
                  value={musaiHour}
                  onChange={e => { setMusaiHour(e.target.value); setHourSaved(false); }}
                  style={{
                    height: 40, border: "2px solid var(--ink)", borderRadius: 10,
                    padding: "0 12px", fontFamily: "Space Grotesk", fontWeight: 800,
                    fontSize: 16, background: "var(--paper)", outline: "none", flex: 1,
                  }}
                />
                <button
                  onClick={handleSaveHour}
                  disabled={savingHour || !musaiHour}
                  style={{
                    height: 40, padding: "0 16px", border: "2px solid var(--ink)", borderRadius: 10,
                    background: hourSaved ? "var(--mint)" : "var(--acid)",
                    fontWeight: 800, fontSize: 12, cursor: "pointer",
                    opacity: savingHour || !musaiHour ? 0.5 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {hourSaved ? `✓ ${t("push.musaiHour.saved")}` : t("push.musaiHour.save")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
