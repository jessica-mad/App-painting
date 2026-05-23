import { useState, useEffect, useRef } from "react";
import { Phone } from "../components/Phone";
import { Wordmark } from "../components/Wordmark";
import { useApp } from "../data/store";
import { useT } from "../i18n";
import { IS_LOGGED_IN, registerUser, loginUser, forgotPassword } from "../utils/api";
import { IBrush, ISpark, IStar, ILock, IArrowL, IUser, ICheck } from "../components/Icons";

const RECAPTCHA_SITE_KEY = window.InkRushConfig?.recaptchaSiteKey || "";

export function LoginScreen() {
  const { dispatch } = useApp();
  const t = useT();

  const EYEBROWS = [t("login.eyebrow1"), t("login.eyebrow2"), t("login.eyebrow3"), t("login.eyebrow4")];
  const HEADLINES = [t("login.headline1"), t("login.headline2")];
  const [mode, setMode]           = useState("main"); // main | login | register | forgot
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [name, setName]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [eyebrowIdx, setEyebrowIdx]   = useState(0);
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const captchaRef    = useRef(null);
  const captchaWidget = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      setEyebrowIdx(i => (i + 1) % EYEBROWS.length);
      setHeadlineIdx(i => (i + 1) % HEADLINES.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  if (IS_LOGGED_IN) {
    dispatch({ type: "SET_SCREEN", screen: "onboarding" });
    return null;
  }

  const back = () => { setMode("main"); setError(""); setSuccess(""); setConfirm(""); };

  useEffect(() => {
    if (mode !== "register" || !RECAPTCHA_SITE_KEY) return;
    const mount = () => {
      if (!captchaRef.current || captchaWidget.current !== null) return;
      captchaWidget.current = window.grecaptcha.render(captchaRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        theme: "light",
      });
    };
    if (window.grecaptcha?.render) {
      mount();
    } else {
      window.inkrushRecaptchaReady = mount;
    }
    return () => { captchaWidget.current = null; };
  }, [mode]);

  const handleRegister = async () => {
    if (!name.trim())              { setError("Escribe tu nombre."); return; }
    if (!email.includes("@"))      { setError("Email inválido."); return; }
    if (password.length < 6)       { setError("Contraseña mínimo 6 caracteres."); return; }
    if (password !== confirm)      { setError("Las contraseñas no coinciden."); return; }
    const captchaToken = RECAPTCHA_SITE_KEY && captchaWidget.current !== null
      ? window.grecaptcha.getResponse(captchaWidget.current)
      : "";
    if (RECAPTCHA_SITE_KEY && !captchaToken) { setError("Completa el CAPTCHA."); return; }
    setError(""); setLoading(true);
    try {
      await registerUser({ email, password, displayName: name, captchaToken });
      setSuccess("¡Cuenta creada! Entrando…");
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      setError(e.message || "Error al crear la cuenta.");
      if (RECAPTCHA_SITE_KEY && captchaWidget.current !== null) window.grecaptcha.reset(captchaWidget.current);
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email.includes("@")) { setError("Email inválido."); return; }
    setError(""); setLoading(true);
    try { await forgotPassword(email); } catch {}
    setSuccess(t("login.forgot.success"));
    setLoading(false);
  };

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
            <IArrowL s={16}/> {t("common.back")}
          </button>
          <h2 className="serif" style={{ fontSize: 28, marginTop: 12, lineHeight: 1 }}>{t("login.register.title")}</h2>
          <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>{t("login.register.subtitle")}</p>

          <div className="scroll" style={{ flex: 1, marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: t("login.register.name"),    val: name,    set: setName,     type: "text",     ph: "Malva Ink",    Icon: IUser },
              { label: t("login.register.email"),   val: email,   set: setEmail,    type: "email",    ph: "tu@email.com", Icon: ILock },
              { label: t("login.register.password"),val: password,set: setPassword, type: "password", ph: "••••••••",     Icon: ILock },
              { label: t("login.register.confirm"), val: confirm, set: setConfirm,  type: "password", ph: "••••••••",     Icon: ICheck },
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

            {RECAPTCHA_SITE_KEY && (
              <div>
                <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 6 }}>{t("login.register.verification")}</p>
                <div ref={captchaRef}/>
              </div>
            )}

            {error   && <p style={{ fontSize: 12, fontWeight: 800, color: "var(--coral)" }}>{error}</p>}
            {success && (
              <div className="stk-sm" style={{ background: "var(--mint)", padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <ICheck s={16}/> <span style={{ fontWeight: 800, fontSize: 12 }}>{success}</span>
              </div>
            )}

            <button onClick={handleRegister} disabled={loading} className="stk"
              style={{ height: 54, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", marginTop: 8, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
              <IBrush s={18}/> {loading ? t("login.register.submitting") : t("login.register.submit")}
            </button>

            <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "transparent", border: "none", fontSize: 12, fontWeight: 800, color: "rgba(20,17,15,.55)", cursor: "pointer", textDecoration: "underline", marginTop: 4, textAlign: "center" }}>
              {t("login.register.haveAccount")}
            </button>
          </div>
        </div>
      </Phone>
    );
  }

  /* ── Recuperar contraseña ── */
  if (mode === "forgot") {
    return (
      <Phone>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 22px 22px" }}>
          <button onClick={back} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, alignSelf: "flex-start", padding: 0, cursor: "pointer" }}>
            <IArrowL s={16}/> {t("common.back")}
          </button>
          <h2 className="serif" style={{ fontSize: 28, marginTop: 12, lineHeight: 1 }}>{t("login.forgot.title")}</h2>
          <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>{t("login.forgot.subtitle")}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 6 }}>{t("login.field.email")}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, height: 50, borderRadius: 14, border: "2px solid var(--ink)", background: "var(--paper-2)", padding: "0 14px" }}>
              <IUser s={16}/>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
                onKeyDown={handleKey(handleForgot)}
                style={{ flex: 1, border: "none", background: "transparent", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 14, outline: "none" }}/>
            </div>

            {error   && <p style={{ fontSize: 12, fontWeight: 800, color: "var(--coral)" }}>{error}</p>}
            {success && (
              <div className="stk-sm" style={{ background: "var(--mint)", padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <ICheck s={16}/> <span style={{ fontWeight: 800, fontSize: 12 }}>{success}</span>
              </div>
            )}
          </div>

          <button onClick={handleForgot} disabled={loading || !!success} className="stk"
            style={{ height: 54, background: "var(--acid)", border: "2px solid var(--ink)", borderRadius: 18, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "var(--shadow-lg)", marginTop: "auto", cursor: "pointer", opacity: loading || success ? 0.6 : 1 }}>
            <ILock s={18}/> {loading ? t("login.forgot.submitting") : t("login.forgot.submit")}
          </button>
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
            <IArrowL s={16}/> {t("common.back")}
          </button>
          <h2 className="serif" style={{ fontSize: 28, marginTop: 12, lineHeight: 1 }}>Iniciar sesión</h2>
          <p className="mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(20,17,15,.55)", marginTop: 4 }}>{t("login.mode.email")}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            {[
              { label: t("login.field.email"),    val: email,    set: setEmail,    type: "email",    ph: "tu@email.com", Icon: IUser },
              { label: t("login.field.password"), val: password, set: setPassword, type: "password", ph: "••••••••",    Icon: ILock },
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
            <ILock s={18}/> {loading ? t("login.submitting") : t("login.submit")}
          </button>

          <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }} style={{ background: "transparent", border: "none", fontSize: 12, fontWeight: 700, color: "rgba(20,17,15,.5)", cursor: "pointer", marginTop: 10, textAlign: "center" }}>
            {t("login.forgot")}
          </button>

          <button onClick={() => { setMode("register"); setError(""); }} style={{ background: "transparent", border: "none", fontSize: 12, fontWeight: 800, color: "rgba(20,17,15,.55)", cursor: "pointer", textDecoration: "underline", marginTop: 4, textAlign: "center" }}>
            {t("login.noAccount")}
          </button>
        </div>
      </Phone>
    );
  }

  /* ── Pantalla principal — Marketing split ── */
  return (
    <Phone>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* TOP — hero acid panel */}
        <div style={{ background: "var(--acid)", padding: "28px 22px 26px", position: "relative", overflow: "hidden", flex: "0 0 auto" }}>
          <div className="stripes-y" style={{ position: "absolute", inset: 0, opacity: 0.35 }}/>
          <div style={{ position: "absolute", top: 14, right: 18, color: "rgba(20,17,15,.2)" }}><ISpark s={28}/></div>
          <div style={{ position: "absolute", bottom: 10, left: 14, color: "rgba(20,17,15,.15)" }}><IStar s={20}/></div>
          <div style={{ position: "relative" }}>
            <p className="mono" style={{ fontSize: 10, fontWeight: 700, color: "rgba(20,17,15,.6)", marginBottom: 10, minHeight: 14, transition: "opacity .3s" }}>
              {EYEBROWS[eyebrowIdx]}
            </p>
            <div style={{ marginBottom: 12 }}>
              <Wordmark size={36}/>
            </div>
            <h2 className="serif" style={{ fontSize: 26, lineHeight: 1.05, maxWidth: 260 }}>
              {HEADLINES[headlineIdx]}
            </h2>
            <p style={{ fontWeight: 600, fontSize: 12, marginTop: 8, lineHeight: 1.5, color: "rgba(20,17,15,.7)" }}>
              {t("login.tagline1")}
            </p>
            <p style={{ fontWeight: 600, fontSize: 11, marginTop: 4, lineHeight: 1.4, color: "rgba(20,17,15,.55)" }}>
              {t("login.tagline2")}
            </p>
          </div>
        </div>

        {/* BOTTOM — auth form */}
        <div className="scroll" style={{ flex: 1, padding: "18px 22px 20px", display: "flex", flexDirection: "column", gap: 10 }}>

          <button disabled className="stk"
            style={{ height: 50, background: "var(--paper-2)", border: "2px solid rgba(20,17,15,.25)", borderRadius: 16, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: 0.45, cursor: "not-allowed" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t("login.google.label")}
          </button>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, height: 2, background: "rgba(20,17,15,.1)" }}/>
            <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: "rgba(20,17,15,.4)" }}>{t("login.divider")}</span>
            <div style={{ flex: 1, height: 2, background: "rgba(20,17,15,.1)" }}/>
          </div>

          <button className="stk" onClick={() => { setMode("register"); setError(""); }}
            style={{ height: 50, background: "var(--mint)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
            <IUser s={16}/> {t("login.createAccount")}
          </button>

          <button className="stk" onClick={() => { setMode("login"); setError(""); }}
            style={{ height: 50, background: "var(--paper-2)", border: "2px solid var(--ink)", borderRadius: 16, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
            <ILock s={16}/> {t("login.signIn")}
          </button>


          {error   && <p style={{ fontSize: 12, fontWeight: 800, color: "var(--coral)", textAlign: "center" }}>{error}</p>}
          {success && <p style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)", textAlign: "center" }}>{success}</p>}

          <p className="mono" style={{ fontSize: 9, fontWeight: 600, color: "rgba(20,17,15,.4)", textAlign: "center", marginTop: 8 }}>
            {t("login.terms")}
          </p>
        </div>
      </div>
    </Phone>
  );
}
