import { useState } from "react";
import { Phone } from "../components/Phone";
import { Wordmark } from "../components/Wordmark";
import { useApp } from "../data/store";
import { IS_LOGGED_IN, WP_LOGIN_URL } from "../utils/api";
import { IBrush, ISpark, IStar, ILock, IBolt, IArrowL } from "../components/Icons";

export function LoginScreen() {
  const { dispatch } = useApp();
  const [mode, setMode]       = useState("main");
  const [phone, setPhone]     = useState("");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  if (IS_LOGGED_IN) {
    dispatch({ type: "SET_SCREEN", screen: "onboarding" });
    return null;
  }

  const goToWPLogin = () => {
    const redirect = window.location.href;
    window.location.href = `${WP_LOGIN_URL}?redirect_to=${encodeURIComponent(redirect)}`;
  };

  const loginDemo = () => {
    setLoading(true);
    setTimeout(() => dispatch({ type: "LOGIN", user: { name: "Artista", provider: "demo" } }), 800);
  };

  const sendSMS = () => {
    if (phone.replace(/\s/g, "").length < 8) { setError("Número inválido"); return; }
    setError(""); setLoading(true);
    setTimeout(() => { setLoading(false); setMode("sms-code"); }, 1200);
  };

  const verifyCode = () => {
    if (code !== "1234") { setError("Código incorrecto (demo: 1234)"); return; }
    setError(""); setLoading(true);
    setTimeout(() => dispatch({ type: "LOGIN", user: { name: "Artista", phone, provider: "sms" } }), 700);
  };

  if (mode === "sms") {
    return (
      <Phone>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 22px 22px" }}>
          <button
            onClick={() => setMode("main")}
            style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, alignSelf: "flex-start", padding: 0, cursor: "pointer" }}
          >
            <IArrowL s={16}/> Volver
          </button>
          <h2 className="serif" style={{ fontSize: 28, marginTop: 12, lineHeight: 1 }}>Tu número</h2>
          <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>// RECIBIRÁS UN CÓDIGO SMS DE 4 DÍGITOS</p>

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <div style={{ height: 50, width: 76, borderRadius: 14, border: "2px solid var(--ink)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
              🇪🇸 +34
            </div>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="612 345 678"
              style={{ flex: 1, height: 50, borderRadius: 14, border: "2px solid var(--ink)", background: "var(--paper-2)", padding: "0 16px", fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 14, outline: "none" }}
            />
          </div>

          {error && <p style={{ fontSize: 12, fontWeight: 800, color: "var(--coral)", marginTop: 8 }}>{error}</p>}

          <div className="stk-sm" style={{ background: "var(--sky)", padding: 12, marginTop: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700 }}>No compartimos tu número. Solo para verificar que eres una persona real.</p>
          </div>

          <button
            onClick={sendSMS} disabled={loading}
            className="stk" style={{ height: 54, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", marginTop: "auto", cursor: "pointer" }}
          >
            {loading ? "Enviando..." : "Enviar código SMS"}
          </button>
        </div>
      </Phone>
    );
  }

  if (mode === "sms-code") {
    return (
      <Phone>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 22px 22px" }}>
          <button
            onClick={() => { setMode("sms"); setCode(""); }}
            style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, alignSelf: "flex-start", padding: 0, cursor: "pointer" }}
          >
            <IArrowL s={16}/> Volver
          </button>
          <h2 className="serif" style={{ fontSize: 28, marginTop: 12, lineHeight: 1 }}>Código enviado</h2>
          <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>
            // SMS A {phone} ·{" "}
            <span style={{ background: "var(--ink)", color: "var(--acid)", padding: "1px 6px", borderRadius: 4 }}>DEMO: USA 1234</span>
          </p>

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 56, height: 64, borderRadius: 16, border: "2px solid var(--ink)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, fontWeight: 800,
                background: code[i] ? "var(--acid)" : "var(--paper-2)",
                boxShadow: code[i] ? "3px 3px 0 var(--ink)" : "none",
              }}>
                {code[i] ?? "_"}
              </div>
            ))}
          </div>

          <input
            type="number" value={code} onChange={e => setCode(e.target.value.slice(0,4))}
            placeholder="Código de 4 dígitos"
            style={{ height: 50, borderRadius: 14, border: "2px solid var(--ink)", background: "var(--paper-2)", padding: "0 16px", fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 20, outline: "none", textAlign: "center", marginTop: 16 }}
          />

          {error && <p style={{ fontSize: 12, fontWeight: 800, color: "var(--coral)", marginTop: 8 }}>{error}</p>}

          <button onClick={() => { setMode("sms"); setCode(""); }} style={{ background: "transparent", border: "none", fontSize: 11, fontWeight: 800, textDecoration: "underline", color: "rgba(20,17,15,.5)", marginTop: 12, cursor: "pointer" }}>
            No recibí el código. Reenviar.
          </button>

          <button
            onClick={verifyCode} disabled={loading || code.length < 4}
            className="stk" style={{ height: 54, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-lg)", marginTop: "auto", cursor: "pointer", opacity: code.length < 4 ? 0.5 : 1 }}
          >
            {loading ? "Verificando..." : "Verificar código"}
          </button>
        </div>
      </Phone>
    );
  }

  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 22px 24px" }}>
        {/* Hero */}
        <div className="stk-lg" style={{ background: "var(--acid)", padding: "26px 18px", position: "relative", overflow: "hidden", marginBottom: 22 }}>
          <div className="stripes-y" style={{ position: "absolute", inset: 0, opacity: 0.5 }}/>
          <div style={{ position: "absolute", top: 12, right: 16, color: "rgba(20,17,15,.25)" }}><ISpark s={32}/></div>
          <div style={{ position: "absolute", bottom: 8, left: 12, color: "rgba(20,17,15,.18)" }}><IStar s={24}/></div>
          <div style={{ position: "relative", textAlign: "center" }}>
            <div style={{ display: "inline-flex", padding: 10, border: "2px solid var(--ink)", borderRadius: 14, background: "var(--paper-2)", marginBottom: 10 }}>
              <IBrush s={28}/>
            </div>
            <div><Wordmark size={42}/></div>
            <p className="mono" style={{ fontSize: 10, fontWeight: 700, marginTop: 6, color: "rgba(20,17,15,.6)" }}>// PARA ARTISTAS E ILUSTRADORES</p>
          </div>
        </div>

        <h2 className="serif" style={{ fontSize: 26, lineHeight: 1 }}>Inicia sesión</h2>
        <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 6 }}>// SOLO ARTISTAS REALES · ANTI-BOTS</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          <button className="stk" onClick={goToWPLogin} style={{ height: 52, background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, height: 2, background: "rgba(20,17,15,.1)" }}/>
            <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>O</span>
            <div style={{ flex: 1, height: 2, background: "rgba(20,17,15,.1)" }}/>
          </div>

          <button className="stk" onClick={() => setMode("sms")} style={{ height: 52, background: "var(--lilac)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
            <ILock s={16}/> Verificar con teléfono (SMS)
          </button>

          <button onClick={loginDemo} disabled={loading} style={{ height: 44, background: "rgba(223,255,35,.5)", border: "2px dashed var(--ink)", borderRadius: 12, fontWeight: 800, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
            <IBolt s={14}/> {loading ? "Entrando..." : "Entrar en modo demo"}
          </button>
        </div>

        <div className="stk-sm" style={{ background: "var(--butter)", padding: 12, marginTop: "auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <ILock s={13}/> Verificación SMS para proteger la comunidad
          </p>
        </div>
        <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.45)", textAlign: "center", marginTop: 14 }}>AL REGISTRARTE ACEPTAS TÉRMINOS Y PRIVACIDAD</p>
      </div>
    </Phone>
  );
}
