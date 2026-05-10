import { motion } from "framer-motion";
import { useApp } from "../data/store";

const NAV_ITEMS = [
  { id: "home", icon: "⌂", label: "Inicio" },
  { id: "feed", icon: "✦", label: "Feed" },
  { id: "random", icon: "+", label: "Reto", special: true },
  { id: "saved", icon: "♡", label: "Guardados" },
  { id: "profile", icon: "◉", label: "Perfil" },
];

export function BottomNav({ current }) {
  const { dispatch } = useApp();

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[72px] border-t-2 border-black bg-white/90 backdrop-blur-sm grid grid-cols-5 z-50">
      {NAV_ITEMS.map(item => (
        <motion.button
          key={item.id}
          whileTap={{ scale: 0.85 }}
          onClick={() => dispatch({ type: "SET_SCREEN", screen: item.id })}
          className="flex flex-col items-center justify-center gap-0.5"
        >
          {item.special ? (
            <div className={`w-12 h-12 rounded-full border-2 border-black bg-[#DFFF23] flex items-center justify-center text-2xl font-black shadow-[3px_3px_0_#111] ${current === item.id ? "shadow-none translate-x-[3px] translate-y-[3px]" : ""}`}>
              {item.icon}
            </div>
          ) : (
            <>
              <span className={`text-xl font-black ${current === item.id ? "text-black" : "text-neutral-400"}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-black ${current === item.id ? "text-black" : "text-neutral-400"}`}>
                {item.label}
              </span>
            </>
          )}
        </motion.button>
      ))}
    </div>
  );
}
