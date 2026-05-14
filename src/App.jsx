import { useReducer, useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppContext, initialState, reducer } from "./data/store";
import { IS_LOGGED_IN, fetchNotifications } from "./utils/api";
import { TutorialScreen }       from "./screens/TutorialScreen";
import { IntroScreen }          from "./screens/IntroScreen";
import { LoginScreen }          from "./screens/LoginScreen";
import { OnboardingScreen }     from "./screens/OnboardingScreen";
import { HomeScreen }           from "./screens/HomeScreen";
import { RandomScreen }         from "./screens/RandomScreen";
import { IdeaScreen }           from "./screens/IdeaScreen";
import { TimerSetupScreen }     from "./screens/TimerSetupScreen";
import { TimerScreen }          from "./screens/TimerScreen";
import { UploadScreen }         from "./screens/UploadScreen";
import { FeedScreen }           from "./screens/FeedScreen";
import { ProfileScreen }        from "./screens/ProfileScreen";
import { PublicProfileScreen }  from "./screens/PublicProfileScreen";
import { FollowListScreen }     from "./screens/FollowListScreen";
import { SavedScreen }          from "./screens/SavedScreen";
import { BugReportScreen }          from "./screens/BugReportScreen";
import { NotificationsScreen }     from "./screens/NotificationsScreen";
import { DeskHome, DeskFeed, DeskProfile, DeskLogin, DeskFlowWrapper } from "./screens/desktop/DesktopLayout";

const MOBILE_SCREENS = {
  intro:         IntroScreen,
  tutorial:      TutorialScreen,
  login:         LoginScreen,
  onboarding:    OnboardingScreen,
  home:          HomeScreen,
  random:        RandomScreen,
  idea:          IdeaScreen,
  setupTimer:    TimerSetupScreen,
  timer:         TimerScreen,
  upload:        UploadScreen,
  feed:          FeedScreen,
  profile:       ProfileScreen,
  publicProfile: PublicProfileScreen,
  followList:    FollowListScreen,
  saved:         SavedScreen,
  bugReport:     BugReportScreen,
  notifications: NotificationsScreen,
};

/* On desktop, screens without a dedicated layout use DeskFlowWrapper to keep sidebar visible */
const DESKTOP_FULL = {
  intro:    () => <DeskLogin/>,
  tutorial: () => <DeskLogin/>,
  login:    () => <DeskLogin/>,
  home:     () => <DeskHome/>,
  feed:     () => <DeskFeed/>,
  profile:  () => <DeskProfile/>,
};

const DESKTOP_FLOW = {
  onboarding:    OnboardingScreen,
  random:        RandomScreen,
  idea:          IdeaScreen,
  setupTimer:    TimerSetupScreen,
  timer:         TimerScreen,
  upload:        UploadScreen,
  saved:         SavedScreen,
  publicProfile: PublicProfileScreen,
  followList:    FollowListScreen,
  bugReport:     BugReportScreen,
  notifications: NotificationsScreen,
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

/* intro and login are always public; publicProfile visible even without login */
const PUBLIC_SCREENS = new Set(["intro", "login", "tutorial", "publicProfile", "followList"]);

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ctx = useMemo(() => ({ state, dispatch }), [state]);
  const isDesktop = useIsDesktop();

  /* Fetch unread notification count on mount */
  useEffect(() => {
    if (!IS_LOGGED_IN) return;
    fetchNotifications()
      .then(res => {
        if (res?.unread > 0) dispatch({ type: "SET_UNREAD_NOTIFS", count: res.unread });
      })
      .catch(() => {});
  }, []);

  /* Hard guard: if no WP session and trying to access a protected screen, force login */
  const guardedScreen = !IS_LOGGED_IN && !PUBLIC_SCREENS.has(state.screen) ? "login" : state.screen;
  const MobileScreen = MOBILE_SCREENS[guardedScreen] ?? LoginScreen;

  if (isDesktop) {
    const guardedDesktop = !IS_LOGGED_IN && !PUBLIC_SCREENS.has(state.screen) ? "login" : state.screen;
    const FullScreen = DESKTOP_FULL[guardedDesktop];
    const FlowScreen = DESKTOP_FLOW[guardedDesktop];

    return (
      <AppContext.Provider value={ctx}>
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--paper)", overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={guardedDesktop}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              style={{ display: "flex", flex: 1, overflow: "hidden" }}
            >
              {FullScreen
                ? <FullScreen/>
                : <DeskFlowWrapper Screen={FlowScreen ?? HomeScreen}/>
              }
            </motion.div>
          </AnimatePresence>
        </div>
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={ctx}>
      <div style={{ height: "100dvh", overflow: "hidden", background: "var(--paper-2)" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={guardedScreen}
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
