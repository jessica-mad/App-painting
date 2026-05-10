import { useReducer, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppContext, initialState, reducer } from "./data/store";
import { TutorialScreen }    from "./screens/TutorialScreen";
import { LoginScreen }       from "./screens/LoginScreen";
import { OnboardingScreen }  from "./screens/OnboardingScreen";
import { HomeScreen }        from "./screens/HomeScreen";
import { RandomScreen }      from "./screens/RandomScreen";
import { IdeaScreen }        from "./screens/IdeaScreen";
import { TimerSetupScreen }  from "./screens/TimerSetupScreen";
import { TimerScreen }       from "./screens/TimerScreen";
import { UploadScreen }      from "./screens/UploadScreen";
import { FeedScreen }        from "./screens/FeedScreen";
import { ProfileScreen }     from "./screens/ProfileScreen";
import { SavedScreen }       from "./screens/SavedScreen";
import { AdminScreen }       from "./screens/AdminScreen";

const SCREENS = {
  tutorial: TutorialScreen,
  login:    LoginScreen,
  onboarding: OnboardingScreen,
  home:     HomeScreen,
  random:   RandomScreen,
  idea:     IdeaScreen,
  setupTimer: TimerSetupScreen,
  timer:    TimerScreen,
  upload:   UploadScreen,
  feed:     FeedScreen,
  profile:  ProfileScreen,
  saved:    SavedScreen,
  admin:    AdminScreen,
};

/* Doodles decorativos solo en desktop */
function DesktopDoodles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 hidden md:block">
      {["✦","○","△","◇","★"].map((d, i) => (
        <span key={i} className="absolute font-black text-black/10 select-none"
          style={{
            fontSize: `${28 + i * 10}px`,
            top:  `${6 + i * 17}%`,
            left: i % 2 === 0 ? `${3 + i * 7}%` : undefined,
            right: i % 2 !== 0 ? `${3 + i * 6}%` : undefined,
            animation: `float${(i%2)+1} ${5+i}s ease-in-out infinite`,
            animationDelay: `${i*0.6}s`,
          }}>
          {d}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ctx = useMemo(() => ({ state, dispatch }), [state]);
  const Screen = SCREENS[state.screen] ?? HomeScreen;

  return (
    <AppContext.Provider value={ctx}>
      {/* Desktop: fondo amarillo con doodles y phone centrado */}
      {/* Móvil: fondo del phone (FFFDF3), sin chrome */}
      <div className="min-h-screen md:bg-[#DFFF23] bg-[#FFFDF3] relative overflow-hidden">
        <DesktopDoodles />

        {/* Header — solo desktop */}
        <div className="relative z-10 text-center pt-6 pb-3 hidden md:block">
          <h1 className="text-6xl font-black italic tracking-tighter">
            Ink<span className="bg-black text-[#DFFF23] px-2 rounded-xl">Rush</span>
          </h1>
          <p className="text-sm font-black text-black/50 mt-1">
            App de retos creativos para ilustradores
          </p>
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "admin" })}
            className="mt-1 text-xs font-black text-black/30 underline"
          >
            🛠️ Panel admin (demo)
          </button>
        </div>

        {/* Phone / pantalla fullscreen */}
        <div className="relative z-10 md:flex md:justify-center md:pb-8 md:px-4">
          <AnimatePresence mode="wait">
            <motion.div key={state.screen}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <Screen />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppContext.Provider>
  );
}
