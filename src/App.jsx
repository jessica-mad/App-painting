import { useReducer, useMemo, useEffect, useState } from "react";
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
import { DeskHome, DeskFeed, DeskProfile, DeskLogin } from "./screens/desktop/DesktopLayout";

const MOBILE_SCREENS = {
  tutorial:   TutorialScreen,
  login:      LoginScreen,
  onboarding: OnboardingScreen,
  home:       HomeScreen,
  random:     RandomScreen,
  idea:       IdeaScreen,
  setupTimer: TimerSetupScreen,
  timer:      TimerScreen,
  upload:     UploadScreen,
  feed:       FeedScreen,
  profile:    ProfileScreen,
  saved:      SavedScreen,
  admin:      AdminScreen,
};

const DESKTOP_SCREENS = {
  tutorial:   DeskLogin,
  login:      DeskLogin,
  onboarding: OnboardingScreen,
  home:       DeskHome,
  random:     DeskHome,
  idea:       DeskHome,
  setupTimer: DeskHome,
  timer:      DeskHome,
  upload:     DeskHome,
  feed:       DeskFeed,
  profile:    DeskProfile,
  saved:      DeskHome,
  admin:      AdminScreen,
};

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 900);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isDesktop;
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ctx = useMemo(() => ({ state, dispatch }), [state]);
  const isDesktop = useIsDesktop();

  const MobileScreen  = MOBILE_SCREENS[state.screen]  ?? HomeScreen;
  const DesktopScreen = DESKTOP_SCREENS[state.screen] ?? DeskHome;

  if (isDesktop) {
    return (
      <AppContext.Provider value={ctx}>
        <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={state.screen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              style={{ display: "flex", flex: 1, minHeight: "100vh" }}
            >
              <DesktopScreen/>
            </motion.div>
          </AnimatePresence>
        </div>
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={ctx}>
      <div style={{ minHeight: "100dvh", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={state.screen}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <MobileScreen/>
          </motion.div>
        </AnimatePresence>
      </div>
    </AppContext.Provider>
  );
}
