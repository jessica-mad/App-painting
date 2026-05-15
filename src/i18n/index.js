import { useApp } from "../data/store";
import es from "./es";
import en from "./en";

const DICTS = { es, en };

export function useT() {
  const { state } = useApp();
  const dict = DICTS[state.lang] ?? es;
  return (key, vars) => {
    let str = dict[key] ?? es[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return str;
  };
}

export function getLang() {
  const stored = localStorage.getItem("inkrush_lang");
  if (stored === "es" || stored === "en") return stored;
  return navigator.language?.startsWith("es") ? "es" : "en";
}
