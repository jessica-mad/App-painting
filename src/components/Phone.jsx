export function Phone({ children, dark = false }) {
  return (
    <div className={"phone grain-soft " + (dark ? "phone-dark" : "")} style={{ position: "relative" }}>
      <div className="notch" />
      <StatusBar dark={dark} />
      {children}
    </div>
  );
}

function StatusBar({ dark }) {
  return (
    <div className="status" style={{ color: dark ? "#fff" : "var(--ink)" }}>
      <span>9:41</span>
      <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
          <rect x="0" y="6" width="3" height="4" rx="1"/>
          <rect x="4" y="4" width="3" height="6" rx="1"/>
          <rect x="8" y="2" width="3" height="8" rx="1"/>
          <rect x="12" y="0" width="3" height="10" rx="1"/>
        </svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M1 5a8 8 0 0 1 12 0M3 7a5 5 0 0 1 8 0"/>
          <circle cx="7" cy="9" r="0.8" fill="currentColor"/>
        </svg>
        <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="0.6" y="0.6" width="18" height="8.8" rx="2"/>
          <rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor"/>
          <rect x="19.6" y="3" width="1.6" height="4" rx="0.5" fill="currentColor"/>
        </svg>
      </span>
    </div>
  );
}
