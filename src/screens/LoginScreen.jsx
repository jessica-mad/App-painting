import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "../components/Phone";
import { useApp } from "../data/store";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function LoginScreen() {
  const { dispatch } = useApp();
  const [mode, setMode] = useState("main"); // main | sms | sms-code | signup
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginWithGoogle = () => {
    setLoading(true);
    setTimeout(() => {
      dispatch({
        type: "LOGIN",
        user: { name: "Artista Google", email: "artista@gmail.com", provider: "google" },
      });
    }, 1200);
  };

  const sendSMS = () => {
    if (phone.length < 8) { setError("Ingresa un número válido"); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCodeSent(true);
      setMode("sms-code");
    }, 1500);
  };

  const verifySMS = () => {
    if (code !== "1234") { setError("Código incorrecto (demo: 1234)"); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      dispatch({
        type: "LOGIN",
        user: { name: "Artista", phone, provider: "sms" },
      });
    }, 800);
  };

  return (
    <Phone>
      <div className="flex flex-col h-full">
        {/* Header art */}
        <div className="relative mx-6 mt-4 rounded-3xl border-2 border-black bg-gradient-to-br from-[#DFFF23] to-[#EFE8FF] p-6 overflow-hidden">
          <span className="float-1 absolute top-3 right-6 text-3xl">✦</span>
          <span className="float-2 absolute bottom-2 right-16 text-2xl">○</span>
          <span className="float-3 absolute top-8 left-4 text-2xl opacity-30">△</span>
          <div className="text-5xl text-center mb-2">🎨</div>
          <h1 className="text-3xl font-black text-center leading-none">
            Ink<span className="bg-black text-[#DFFF23] px-1 rounded-lg">Rush</span>
          </h1>
          <p className="text-center text-xs font-bold text-neutral-600 mt-1">Para artistas e ilustradores</p>
        </div>

        <AnimatePresence mode="wait">
          {mode === "main" && (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col flex-1 px-6 pt-6 gap-4"
            >
              <div>
                <h2 className="text-xl font-black">Inicia sesión</h2>
                <p className="text-xs font-semibold text-neutral-500 mt-1">
                  Verificación real para evitar bots. Solo artistas de verdad. 🎨
                </p>
              </div>

              {/* Google */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={loginWithGoogle}
                disabled={loading}
                className="flex items-center justify-center gap-3 h-14 rounded-2xl border-2 border-black bg-white font-black sticker-shadow active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
              >
                {loading ? <span className="text-xl spin-slow">⟳</span> : <GoogleIcon />}
                <span>Continuar con Google</span>
              </motion.button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-[2px] bg-black/10" />
                <span className="text-xs font-black text-neutral-400">O</span>
                <div className="flex-1 h-[2px] bg-black/10" />
              </div>

              {/* SMS */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode("sms")}
                className="flex items-center justify-center gap-3 h-14 rounded-2xl border-2 border-black bg-[#EFE8FF] font-black sticker-shadow active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
              >
                <span className="text-xl">📱</span>
                <span>Continuar con teléfono</span>
              </motion.button>

              <div className="bg-[#FFF3D6] rounded-2xl border-2 border-black p-4">
                <p className="text-xs font-black text-center">
                  🛡️ Usamos verificación SMS para proteger la comunidad de bots y contenido spam.
                </p>
              </div>

              <p className="text-center text-xs font-semibold text-neutral-400 mt-auto pb-4">
                Al registrarte aceptas los <span className="underline">Términos</span> y <span className="underline">Privacidad</span>
              </p>
            </motion.div>
          )}

          {mode === "sms" && (
            <motion.div
              key="sms"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col flex-1 px-6 pt-6 gap-4"
            >
              <button onClick={() => setMode("main")} className="text-sm font-black text-left">
                ← Volver
              </button>
              <div>
                <h2 className="text-xl font-black">Tu número</h2>
                <p className="text-xs font-semibold text-neutral-500 mt-1">
                  Recibirás un código SMS de verificación.
                </p>
              </div>

              <div className="flex gap-2">
                <div className="h-14 w-20 rounded-2xl border-2 border-black bg-white flex items-center justify-center font-black text-sm">
                  🇪🇸 +34
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="612 345 678"
                  className="flex-1 h-14 rounded-2xl border-2 border-black bg-white px-4 font-black text-sm outline-none"
                />
              </div>

              {error && <p className="text-xs font-black text-red-500">{error}</p>}

              <div className="bg-[#D6F5FF] rounded-2xl border-2 border-black p-3">
                <p className="text-xs font-black">
                  📵 No compartiremos tu número. Solo para verificar que eres una persona real.
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={sendSMS}
                disabled={loading}
                className="h-14 rounded-2xl border-2 border-black bg-[#DFFF23] font-black sticker-shadow-md active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all mt-auto"
              >
                {loading ? "Enviando..." : "Enviar código SMS"}
              </motion.button>
            </motion.div>
          )}

          {mode === "sms-code" && (
            <motion.div
              key="sms-code"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col flex-1 px-6 pt-6 gap-4"
            >
              <button onClick={() => setMode("sms")} className="text-sm font-black text-left">
                ← Volver
              </button>
              <div>
                <h2 className="text-xl font-black">Código enviado</h2>
                <p className="text-xs font-semibold text-neutral-500 mt-1">
                  Revisa tu SMS en {phone}. <br/>
                  <span className="text-[#DFFF23] bg-black px-1 rounded font-black">Demo: usa 1234</span>
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`w-14 h-16 rounded-2xl border-2 border-black bg-white flex items-center justify-center text-2xl font-black ${code[i] ? "bg-[#DFFF23]" : ""}`}>
                    {code[i] || "_"}
                  </div>
                ))}
              </div>

              <input
                type="number"
                value={code}
                onChange={e => setCode(e.target.value.slice(0, 4))}
                placeholder="Código de 4 dígitos"
                className="h-14 rounded-2xl border-2 border-black bg-white px-4 font-black text-center text-xl outline-none"
              />

              {error && <p className="text-xs font-black text-red-500">{error}</p>}

              <button onClick={() => { setMode("sms"); setCode(""); }} className="text-xs font-black text-center underline text-neutral-500">
                No recibí el código. Reenviar.
              </button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={verifySMS}
                disabled={loading || code.length < 4}
                className="h-14 rounded-2xl border-2 border-black bg-[#DFFF23] font-black sticker-shadow-md active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all mt-auto disabled:opacity-50"
              >
                {loading ? "Verificando..." : "Verificar código"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Phone>
  );
}
