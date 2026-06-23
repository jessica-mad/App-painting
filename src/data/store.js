import { createContext, useContext } from "react";
import { ACTIVE_SEASON, LEVELS } from "./parameters";
import { WP_ROLLS, WP_ROLLS_USED, WP_TUTORIAL_DONE, WP_TUTORIAL_PENDING, markTutorialDone } from "../utils/api";
import { getLang } from "../i18n";
import { TUTORIAL_STEPS } from "./tutorial";

export const AppContext = createContext(null);
export function useApp() { return useContext(AppContext); }

/* Lee config inyectada por WordPress (wp_localize_script) */
const wpConfig = window.InkRushConfig ?? {};

function getLocalRolls(maxRolls) {
  try {
    const stored = localStorage.getItem("musai_daily_rolls");
    if (!stored) return maxRolls;
    const { date, rolls } = JSON.parse(stored);
    return date === new Date().toDateString() ? Math.min(rolls, maxRolls) : maxRolls;
  } catch {
    return maxRolls;
  }
}

function saveLocalRolls(rolls) {
  localStorage.setItem("musai_daily_rolls", JSON.stringify({ date: new Date().toDateString(), rolls }));
}
const wpUser   = parseInt(wpConfig.userId) ? {
  id:       wpConfig.userId,
  name:     wpConfig.userName ?? "Artista",
  avatar:   wpConfig.userAvatar ?? "👩‍🎨",
  provider: "wordpress",
} : null;

/* Si hay usuario WP, saltamos tutorial/login */
function startScreen() {
  if (parseInt(wpConfig.profileUserId)) return "publicProfile";
  if (!wpUser) {
    const seenIntro = localStorage.getItem("musai_seen_intro");
    return seenIntro ? "login" : "intro";
  }
  return "home";
}

function shouldShowTutorial() {
  if (!wpUser) return false;
  if (WP_TUTORIAL_PENDING) return true;
  if (WP_TUTORIAL_DONE) return false;
  return !localStorage.getItem("musai_tutorial_done");
}

const initialProfile = wpConfig.userId ? {
  username:            wpConfig.userName ?? "artista",
  displayName:         wpConfig.displayName ?? "Artista",
  avatar:              wpConfig.userAvatar ?? "",
  avatarUrl:           wpConfig.avatarUrl ?? "",
  bio:                 wpConfig.userBio ?? "",
  email:               wpConfig.userEmail ?? "",
  completedChallenges: wpConfig.challenges ?? 0,
  streak:              wpConfig.streak ?? 0,
  followers:           wpConfig.followers ?? 0,
  following:           wpConfig.following ?? 0,
  totalLikes:          wpConfig.totalLikes ?? 0,
  totalInspires:       wpConfig.totalInspires ?? 0,
  totalTries:          wpConfig.totalTries ?? 0,
  pomodorosCompleted:  wpConfig.pomodoros ?? 0,
  socials:             wpConfig.socials ?? { instagram:"", tiktok:"", pinterest:"" },
  handle:              wpConfig.userHandle ?? "",
} : {
  username: "jesska_art", displayName: "Jesska", avatar: "👩‍🎨",
  handle: "jesska_art",
  bio: "Ilustrando ideas raras ✨",
  completedChallenges: 7, streak: 4, followers: 1240, following: 89,
  totalLikes: 239, totalInspires: 158, totalTries: 73, pomodorosCompleted: 12,
  socials: { instagram: "jesska.art", tiktok: "jesska_art", pinterest: "" },
};

export const initialState = {
  screen:           startScreen(),
  user:             wpUser,
  favoriteTechniques: JSON.parse(localStorage.getItem("musai_techniques") || "[]"),
  savedIdeas:       (() => {
    const raw = JSON.parse(localStorage.getItem("musai_saved") || "[]")
      .map(idea => idea._id ? idea : { ...idea, _id: Math.random().toString(36).slice(2) });
    const seen = new Set();
    return raw.filter(idea => {
      const key = JSON.stringify((idea.variables ?? []).map(v => (typeof v === "string" ? v : v.value)).sort());
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 5);
  })(),
  displacedIdea:    null,
  selectedParams:   ["Emociones", "Animales", "Eventos"],
  /* idea = { variables: [...], params: [...] } — guarda los params usados */
  currentIdea:      null,
  musicSrcs:        { ...(wpConfig.musicSrcs ?? {}) },
  rollsLeft:        wpConfig.userId
    ? Math.max(0, WP_ROLLS - WP_ROLLS_USED)
    : getLocalRolls(WP_ROLLS),
  timerConfig:      null,
  activeSeason:     wpConfig.activeSeason ?? ACTIVE_SEASON,
  profile:          initialProfile,
  viewingUserId:    parseInt(wpConfig.profileUserId) || null,
  followListUserId: null,
  followListType:   "following",
  profileInitialTab: null,
  unreadNotifs:     0,
  lang:             getLang(),
  slotFlow:         wpConfig.slotFlow ?? "classic",
  tutorialStep:     shouldShowTutorial() ? 0 : null,
  apiParams:        {},
  levels:           LEVELS,   // overridden by /config API response
  seasonLabels:     {},        // overridden by /config API response: { Primavera: "Spring", ... }
  rarityLabels:     {},        // overridden by /config API response: { "Común": { name, name_en }, ... }
};

export function reducer(state, action) {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, screen: action.screen, profileInitialTab: action.profileTab ?? null };

    case "CLEAR_PROFILE_TAB":
      return { ...state, profileInitialTab: null };

    case "LOGIN":
      return { ...state, user: action.user, screen: "home" };

    case "SET_TECHNIQUES": {
      localStorage.setItem("musai_techniques", JSON.stringify(action.techniques));
      return { ...state, favoriteTechniques: action.techniques, screen: "home" };
    }

    case "SET_PARAMS":
      return { ...state, selectedParams: action.params };

    case "SET_IDEA": {
      const left = Math.max(0, state.rollsLeft - 1);
      if (!wpConfig.userId) saveLocalRolls(left);
      return {
        ...state,
        currentIdea: { variables: action.idea, params: action.params },
        rollsLeft: left,
      };
    }

    case "SET_MUSIC_SRCS":
      return { ...state, musicSrcs: { ...state.musicSrcs, ...action.srcs } };

    case "RESET_ROLLS":
      return { ...state, rollsLeft: WP_ROLLS };

    case "LOGOUT":
      return { ...state, user: null, screen: "login" };

    case "SET_TIMER_CONFIG":
      return { ...state, timerConfig: action.config };

    case "COMPLETE_CHALLENGE":
      return {
        ...state,
        screen: "upload",
        profile: {
          ...state.profile,
          completedChallenges: state.profile.completedChallenges + 1,
          pomodorosCompleted:  state.profile.pomodorosCompleted + 1,
        },
      };

    case "UPDATE_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.data } };

    case "SAVE_IDEA": {
      const MAX = 5;
      const ideaKey = (idea) =>
        JSON.stringify((idea.variables ?? []).map(v => (typeof v === "string" ? v : v.value)).sort());
      if (state.savedIdeas.some(s => ideaKey(s) === ideaKey(action.idea))) return state;
      const withId = { ...action.idea, _id: Math.random().toString(36).slice(2) };
      const prepended = [withId, ...state.savedIdeas];
      const displaced = prepended.length > MAX ? prepended[MAX] : null;
      const newSaved = prepended.slice(0, MAX);
      localStorage.setItem("musai_saved", JSON.stringify(newSaved));
      return { ...state, savedIdeas: newSaved, displacedIdea: displaced };
    }

    case "UNDO_SAVE": {
      if (!state.displacedIdea) return { ...state, displacedIdea: null };
      const restored = [...state.savedIdeas, state.displacedIdea];
      localStorage.setItem("musai_saved", JSON.stringify(restored));
      return { ...state, savedIdeas: restored, displacedIdea: null };
    }

    case "CLEAR_DISPLACED":
      return { ...state, displacedIdea: null };

    case "SET_SAVED_IDEAS": {
      localStorage.setItem("musai_saved", JSON.stringify(action.ideas));
      return { ...state, savedIdeas: action.ideas };
    }

    case "REMOVE_IDEA": {
      const filtered = state.savedIdeas.filter((_, i) => i !== action.index);
      localStorage.setItem("musai_saved", JSON.stringify(filtered));
      return { ...state, savedIdeas: filtered };
    }

    case "REMOVE_IDEA_BY_ID": {
      const filtered = state.savedIdeas.filter(idea => idea._id !== action.id);
      localStorage.setItem("musai_saved", JSON.stringify(filtered));
      return { ...state, savedIdeas: filtered };
    }

    case "VIEW_USER":
      return { ...state, viewingUserId: action.userId, screen: "publicProfile" };

    case "CLEAR_VIEW_USER":
      return { ...state, viewingUserId: null, screen: action.returnScreen ?? "feed" };

    case "VIEW_FOLLOW_LIST":
      return { ...state, followListUserId: action.userId, followListType: action.listType ?? "following", screen: "followList" };

    case "CLEAR_FOLLOW_LIST":
      return { ...state, followListUserId: null, followListType: "following", screen: action.returnScreen ?? "profile" };

    case "SET_UNREAD_NOTIFS":
      return { ...state, unreadNotifs: Math.max(0, action.count) };

    case "CLEAR_UNREAD_NOTIFS":
      return { ...state, unreadNotifs: 0 };

    case "SET_LANG":
      localStorage.setItem("musai_lang", action.lang);
      return { ...state, lang: action.lang };

    case "SET_API_PARAMS":
      return { ...state, apiParams: action.params };

    case "SET_CONFIG":
      return {
        ...state,
        ...(action.levels?.length  && { levels: action.levels }),
        ...(action.seasonLabels    && { seasonLabels: action.seasonLabels }),
        ...(action.rarityLabels    && { rarityLabels: action.rarityLabels }),
      };

    case "TUTORIAL_NEXT": {
      const step = TUTORIAL_STEPS[state.tutorialStep];
      const nextStep = state.tutorialStep + 1;
      const nextScreen = step?.nextScreen ?? state.screen;
      return {
        ...state,
        tutorialStep: nextStep < TUTORIAL_STEPS.length ? nextStep : null,
        screen: nextScreen,
      };
    }

    case "TUTORIAL_GOTO": {
      const nextScreen = action.screen ?? state.screen;
      return { ...state, tutorialStep: action.step, screen: nextScreen };
    }

    case "TUTORIAL_SKIP":
    case "TUTORIAL_END": {
      localStorage.setItem("musai_tutorial_done", "1");
      markTutorialDone().catch(() => {});
      return { ...state, tutorialStep: null, screen: "home" };
    }

    default:
      return state;
  }
}
