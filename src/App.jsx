import { useReducer, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppContext, initialState, reducer } from "./data/store";
import { TutorialScreen } from "./screens/TutorialScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { RandomScreen } from "./screens/RandomScreen";
import { IdeaScreen } from "./screens/IdeaScreen";
import { TimerSetupScreen } from "./screens/TimerSetupScreen";
import { TimerScreen } from "./screens/TimerScreen";
import { UploadScreen } from "./screens/UploadScreen";
import { FeedScreen } from "./screens/FeedScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SavedScreen } from "./screens/SavedScreen";
import { AdminScreen } from "./screens/AdminScreen";

const SCREEN_MAP = {
  tutorial: TutorialScreen,
  login: LoginScreen,
  onboarding: OnboardingScreen,
  home: HomeScreen,
  random: RandomScreen,
  idea: IdeaScreen,
  setupTimer: TimerSetupScreen,
  timer: TimerScreen,
  upload: UploadScreen,
  feed: FeedScreen,
  profile: ProfileScreen,
  saved: SavedScreen,
  admin: AdminScreen,
};

function FloatingDoodles() {
  const items = ["✦", "○", "△", "◇", "★"];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {items.map((d, i) => (
        <span
          key={i}
          className="absolute font-black text-black/10 select-none"
          style={{
            fontSize: `${24 + i * 12}px`,
            top: `${5 + i * 18}%`,
            left: i % 2 === 0 ? `${2 + i * 6}%` : undefined,
            right: i % 2 !== 0 ? `${2 + i * 5}%` : undefined,
            animation: `float${(i % 2) + 1} ${5 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
          }}
        >
          {d}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const contextValue = useMemo(() => ({ state, dispatch }), [state]);

  const CurrentScreen = SCREEN_MAP[state.screen] || HomeScreen;

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-[#DFFF23] relative overflow-hidden">
        <FloatingDoodles />

        {/* App title — desktop only */}
        <div className="relative z-10 text-center pt-6 pb-4 hidden md:block">
          <h1 className="text-6xl font-black italic tracking-tighter">
            Ink<span className="bg-black text-[#DFFF23] px-2 rounded-xl">Rush</span>
          </h1>
          <p className="text-sm font-black text-black/50 mt-1">
            Prototipo interactivo MVP · Para artistas e ilustradores
          </p>
          <button
            onClick={() => dispatch({ type: "SET_SCREEN", screen: "admin" })}
            className="mt-2 text-xs font-black text-black/40 underline"
          >
            🛠️ Panel de gestión de variables (demo admin)
          </button>
        </div>

        {/* Phone container */}
        <div className="relative z-10 flex justify-center pb-8 px-4 pt-4 md:pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.screen}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            >
              <CurrentScreen />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Flow hint — desktop only */}
        <div className="relative z-10 text-center pb-6 px-4 hidden md:block">
          <p className="text-xs font-black text-black/40 max-w-xl mx-auto">
            Flujo: Tutorial → Login SMS/Google → Técnicas → Home → Randometro → Idea → Pomodoro → Timer → Subir → Feed → Perfil
          </p>
        </div>
      </div>
    </AppContext.Provider>
  );
}
