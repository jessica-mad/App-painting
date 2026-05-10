import { createContext, useContext, useReducer } from "react";
import { ACTIVE_SEASON } from "./parameters";

export const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

const initialState = {
  screen: "tutorial",
  user: null,
  favoriteTechniques: [],
  selectedParams: ["Emociones", "Animales", "Eventos"],
  currentIdea: null,
  rollsLeft: 3,
  timerConfig: null,
  activeSeason: ACTIVE_SEASON,
  adminMode: false,
  profile: {
    username: "jesska_art",
    displayName: "Jesska",
    avatar: "👩‍🎨",
    bio: "Ilustrando ideas raras ✨",
    completedChallenges: 7,
    streak: 4,
    followers: 1240,
    following: 89,
    totalLikes: 239,
    totalInspires: 158,
    totalTries: 73,
    pomodorosCompleted: 12,
    socials: { instagram: "jesska.art", tiktok: "jesska_art", pinterest: "" },
    shareLink: "inkrush.app/u/jesska_art",
  },
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_SCREEN":
      return { ...state, screen: action.screen };
    case "LOGIN":
      return {
        ...state,
        user: action.user,
        screen: state.favoriteTechniques.length >= 3 ? "home" : "onboarding",
      };
    case "SET_TECHNIQUES":
      return {
        ...state,
        favoriteTechniques: action.techniques,
        screen: "home",
      };
    case "SET_PARAMS":
      return { ...state, selectedParams: action.params };
    case "SET_IDEA":
      return { ...state, currentIdea: action.idea, rollsLeft: Math.max(0, state.rollsLeft - 1) };
    case "RESET_ROLLS":
      return { ...state, rollsLeft: 3 };
    case "SET_TIMER_CONFIG":
      return { ...state, timerConfig: action.config };
    case "COMPLETE_CHALLENGE":
      return {
        ...state,
        profile: {
          ...state.profile,
          completedChallenges: state.profile.completedChallenges + 1,
          pomodorosCompleted: state.profile.pomodorosCompleted + 1,
        },
        screen: "upload",
      };
    case "UPDATE_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.data } };
    default:
      return state;
  }
}

export { initialState, reducer };
