import { useState } from "react";
import { Phone } from "../components/Phone";
import { Wordmark } from "../components/Wordmark";
import { useApp } from "../data/store";
import { IS_LOGGED_IN, registerUser, loginUser } from "../utils/api";
import { IBrush, ISpark, IStar, ILock, IArrowL, IUser, ICheck } from "../components/Icons";

export function LoginScreen() {
  const { dispatch } = useApp();
  const [mode, setMode]         = useState("main"); // main | login | register
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  if (IS_LOGGED_IN) {
    dispatch({ type: "SET_SCREEN", screen: "onboarding" });
    return null;
  }

  const back = () => { setMode("main"); setError(""); setSuccess(""); };

  /* ── Registro con email ── */
  const handleRegister = async () => {
    if (!name.trim())          { setError("Escribe tu nombre."); return; }
    if (!email.includes("@")) { setError("Email inválido."); return; }
    if (password.length < 6)  { setError("Contraseña mínimo 6 caracteres."); return; }
    setError(""); setLoading(true);
    try {
      await registerUser({ email, password, displayName: name });
      setSuccess("¡Cuenta creada! Entrando…");
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      setError(e.message || "Error al crear la cuenta.");
      setLoading(false);
    }
  };

  /* ── Login en-app ── */
  const handleLogin = async () => {
    if (!email.includes("@")) { setError("Email inválido."); return; }
    if (!password)            { setError("Escribe tu contraseña."); return; }
    setError(""); setLoading(true);
    try {
      await loginUser({ email, password });
      setSuccess("¡Bienvenido! Cargando…");
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setError(e.message || "Email o contraseña incorrectos.");
      setLoading(false);
    }
  };

  const handleKey = (fn) => (e) => { if (e.key === "Enter") fn(); };

  /* ── Registro ── */
  if (mode === "register") {
    return (
      <Phone>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 22px 22px", overflow: "hidden" }}>
          <button onClick={back} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, alignSelf: "flex-start", padding: 0, cursor: "pointer" }}>
            <IArrowL s={16}/> Volver
          </button>
          <h2 className="serif" style={{ fontSize: 28, marginTop: 12, lineHeight: 1 }}>Crear cuenta</h2>
          <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>// REGISTRO CON EMAIL</p>

          <div className="scroll" style={{ flex: 1, marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Tu nombre artístico", val: name,     set: setName,     type: "text",     ph: "Malva Ink",  Icon: IUser },
              { label: "Email",               val: email,    set: setEmail,    type: "email",    ph: "tu@email.com", Icon: ILock },
              { label: "Contraseña (mín. 6)", val: password, set: setPassword, type: "password", ph: "••••••••",   Icon: ILock },
            ].map(({ label, val, set, type, ph, Icon }) => (
              <div key={label}>
                <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 6 }}>{label}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, height: 50, borderRadius: 14, border: "2px solid var(--ink)", background: "var(--paper-2)", padding: "0 14px" }}>
                  <Icon s={16}/>
                  <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    onKeyDown={handleKey(handleRegister)}
                    style={{ flex: 1, border: "none", background: "transparent", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 14, outline: "none" }}/>
                </div>
              </div>
            ))}

            {error   && <p style={{ fontSize: 12, fontWeight: 800, color: "var(--coral)" }}>{error}</p>}
            {success && (
              <div className="stk-sm" style={{ background: "var(--mint)", padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <ICheck s={16}/> <span style={{ fontWeight: 800, fontSize: 12 }}>{success}</span>
              </div>
            )}

            <button onClick={handleRegister} disabled={loading} className="stk"
              style={{ height: 54, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", marginTop: 8, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
              <IBrush s={18}/> {loading ? "Creando cuenta…" : "Crear mi cuenta"}
            </button>

            <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "transparent", border: "none", fontSize: 12, fontWeight: 800, color: "rgba(20,17,15,.55)", cursor: "pointer", textDecoration: "underline", marginTop: 4, textAlign: "center" }}>
              ¿Ya tienes cuenta? Iniciar sesión
            </button>
          </div>
        </div>
      </Phone>
    );
  }

  /* ── Login ── */
  if (mode === "login") {
    return (
      <Phone>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 22px 22px" }}>
          <button onClick={back} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, alignSelf: "flex-start", padding: 0, cursor: "pointer" }}>
            <IArrowL s={16}/> Volver
          </button>
          <h2 className="serif" style={{ fontSize: 28, marginTop: 12, lineHeight: 1 }}>Iniciar sesión</h2>
          <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>// CON TU EMAIL Y CONTRASEÑA</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            {[
              { label: "Email",       val: email,    set: setEmail,    type: "email",    ph: "tu@email.com", Icon: IUser },
              { label: "Contraseña",  val: password, set: setPassword, type: "password", ph: "••••••••",    Icon: ILock },
            ].map(({ label, val, set, type, ph, Icon }) => (
              <div key={label}>
                <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 6 }}>{label}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, height: 50, borderRadius: 14, border: "2px solid var(--ink)", background: "var(--paper-2)", padding: "0 14px" }}>
                  <Icon s={16}/>
                  <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    onKeyDown={handleKey(handleLogin)}
                    style={{ flex: 1, border: "none", background: "transparent", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 14, outline: "none" }}/>
                </div>
              </div>
            ))}

            {error   && <p style={{ fontSize: 12, fontWeight: 800, color: "var(--coral)" }}>{error}</p>}
            {success && (
              <div className="stk-sm" style={{ background: "var(--mint)", padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <ICheck s={16}/> <span style={{ fontWeight: 800, fontSize: 12 }}>{success}</span>
              </div>
            )}
          </div>

          <button onClick={handleLogin} disabled={loading} className="stk"
            style={{ height: 54, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", marginTop: "auto", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
            <ILock s={18}/> {loading ? "Entrando…" : "Entrar"}
          </button>

          <button onClick={() => { setMode("register"); setError(""); }} style={{ background: "transparent", border: "none", fontSize: 12, fontWeight: 800, color: "rgba(20,17,15,.55)", cursor: "pointer", textDecoration: "underline", marginTop: 12, textAlign: "center" }}>
            ¿No tienes cuenta? Crear cuenta gratis
          </button>
        </div>
      </Phone>
    );
  }

  /* ── Pantalla principal ── */
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

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button disabled className="stk"
            style={{ height: 52, background: "var(--paper-2)", border: "2px solid rgba(20,17,15,.25)", borderRadius: 16, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: 0.5, cursor: "not-allowed" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google · Próximamente
          </button>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, height: 2, background: "rgba(20,17,15,.1)" }}/>
            <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>O CONTINÚA CON</span>
            <div style={{ flex: 1, height: 2, background: "rgba(20,17,15,.1)" }}/>
          </div>

          <button className="stk" onClick={() => { setMode("register"); setError(""); }}
            style={{ height: 52, background: "var(--mint)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
            <IUser s={16}/> Crear cuenta con email
          </button>

          <button className="stk" onClick={() => { setMode("login"); setError(""); }}
            style={{ height: 52, background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
            <ILock s={16}/> Iniciar sesión con email
          </button>

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
            <div style={{ flex: 1, height: 2, background: "rgba(20,17,15,.1)" }}/>
            <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>MODO TESTER</span>
            <div style={{ flex: 1, height: 2, background: "rgba(20,17,15,.1)" }}/>
          </div>

          <button className="stk" disabled={loading} onClick={async () => {
            setError(""); setLoading(true);
            try {
              await loginUser({ email: "tester@inkrush.app", password: "test1234" });
              setSuccess("¡Bienvenido, tester! Cargando…");
              setTimeout(() => window.location.reload(), 800);
            } catch (e) {
              setError(e.message || "Cuenta tester no disponible.");
              setLoading(false);
            }
          }}
            style={{ height: 48, background: "transparent", border: "2px dashed rgba(20,17,15,.35)", borderRadius: 16, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", color: "rgba(20,17,15,.6)", opacity: loading ? 0.6 : 1 }}>
            🧪 {loading ? "Entrando…" : "Entrar como tester · test1234"}
          </button>

          {error   && <p style={{ fontSize: 12, fontWeight: 800, color: "var(--coral)", textAlign: "center" }}>{error}</p>}
          {success && <p style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)", textAlign: "center" }}>{success}</p>}
        </div>

        <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.45)", textAlign: "center", marginTop: "auto", paddingTop: 16 }}>AL REGISTRARTE ACEPTAS TÉRMINOS Y PRIVACIDAD</p>
      </div>
    </Phone>
  );
}
