import { createContext, useContext } from "react";
import { ACTIVE_SEASON } from "./parameters";
import { WP_ROLLS, WP_ROLLS_USED } from "../utils/api";

export const AppContext = createContext(null);
export function useApp() { return useContext(AppContext); }

/* Lee config inyectada por WordPress (wp_localize_script) */
const wpConfig = window.InkRushConfig ?? {};

function getLocalRolls(maxRolls) {
  try {
    const stored = localStorage.getItem("inkrush_daily_rolls");
    if (!stored) return maxRolls;
    const { date, rolls } = JSON.parse(stored);
    return date === new Date().toDateString() ? Math.min(rolls, maxRolls) : maxRolls;
  } catch {
    return maxRolls;
  }
}

function saveLocalRolls(rolls) {
  localStorage.setItem("inkrush_daily_rolls", JSON.stringify({ date: new Date().toDateString(), rolls }));
}
const wpUser   = wpConfig.userId ? {
  id:       wpConfig.userId,
  name:     wpConfig.userName ?? "Artista",
  avatar:   wpConfig.userAvatar ?? "👩‍🎨",
  provider: "wordpress",
} : null;

/* Si hay usuario WP, saltamos tutorial/login */
function startScreen() {
  if (!wpUser) {
    const seenIntro = localStorage.getItem("inkrush_seen_intro");
    return seenIntro ? "login" : "intro";
  }
  const techniques = JSON.parse(localStorage.getItem("inkrush_techniques") || "[]");
  return techniques.length >= 1 ? "home" : "onboarding";
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
  shareLink:           wpConfig.shareLink ?? "",
} : {
  username: "jesska_art", displayName: "Jesska", avatar: "👩‍🎨",
  bio: "Ilustrando ideas raras ✨",
  completedChallenges: 7, streak: 4, followers: 1240, following: 89,
  totalLikes: 239, totalInspires: 158, totalTries: 73, pomodorosCompleted: 12,
  socials: { instagram: "jesska.art", tiktok: "jesska_art", pinterest: "" },
  shareLink: "inkrush.app/u/jesska_art",
};

export const initialState = {
  screen:           startScreen(),
  user:             wpUser,
  favoriteTechniques: JSON.parse(localStorage.getItem("inkrush_techniques") || "[]"),
  savedIdeas:       JSON.parse(localStorage.getItem("inkrush_saved") || "[]"),
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
  viewingUserId:    null,
  followListUserId: null,
  followListType:   "following",
};

export function reducer(state, action) {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, screen: action.screen };

    case "LOGIN":
      return { ...state, user: action.user,
        screen: state.favoriteTechniques.length >= 1 ? "home" : "onboarding" };

    case "SET_TECHNIQUES": {
      localStorage.setItem("inkrush_techniques", JSON.stringify(action.techniques));
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
      const ideaKey = (idea) =>
        JSON.stringify((idea.variables ?? []).map(v => (typeof v === "string" ? v : v.value)).sort());
      if (state.savedIdeas.some(s => ideaKey(s) === ideaKey(action.idea))) return state;
      const newSaved = [...state.savedIdeas, action.idea];
      localStorage.setItem("inkrush_saved", JSON.stringify(newSaved));
      return { ...state, savedIdeas: newSaved };
    }

    case "REMOVE_IDEA": {
      const filtered = state.savedIdeas.filter((_, i) => i !== action.index);
      localStorage.setItem("inkrush_saved", JSON.stringify(filtered));
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

    default:
      return state;
  }
}
