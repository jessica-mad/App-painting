export function Phone({ children, bg = "bg-[#FFFDF3]" }) {
  return (
    <div className={`phone-frame ${bg} flex flex-col`}>
      {/* Status bar */}
      <div className="flex justify-between px-6 pt-3 text-xs font-black shrink-0">
        <span>9:41</span>
        <div className="flex gap-1 items-center">
          <span>▌▌▌</span>
          <span>WiFi</span>
          <span>🔋</span>
        </div>
      </div>
      {children}
    </div>
  );
}
