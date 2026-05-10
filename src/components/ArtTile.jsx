/* Faux riso artwork placeholder — SVG compositions */
const palettes = [
  { a: "var(--rose)",   b: "var(--coral)",    c: "var(--ink-blue)" },
  { a: "var(--sky)",    b: "var(--ink-blue)", c: "var(--acid)" },
  { a: "var(--mint)",   b: "var(--coral)",    c: "var(--ink)" },
  { a: "var(--butter)", b: "var(--coral)",    c: "var(--ink-blue)" },
  { a: "var(--lilac)",  b: "var(--coral)",    c: "var(--ink)" },
  { a: "var(--acid)",   b: "var(--ink-blue)", c: "var(--coral)" },
];

export function ArtTile({ kind = 0, height = 120 }) {
  const p = palettes[kind % palettes.length];
  const k = kind % 6;

  const compositions = [
    /* halftone moon */
    <svg key="0" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="200" height="200" fill={p.a}/>
      <defs><pattern id={"h" + kind} width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.4" fill={p.c}/></pattern></defs>
      <circle cx="130" cy="80" r="56" fill={p.b}/>
      <circle cx="130" cy="80" r="56" fill={`url(#h${kind})`} opacity="0.55"/>
      <path d="M0 160 Q50 130 100 160 T200 160 V200 H0 Z" fill={p.c}/>
    </svg>,
    /* sun rays */
    <svg key="1" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="200" height="200" fill={p.a}/>
      <g stroke={p.c} strokeWidth="2">
        {Array.from({length: 12}).map((_, i) => {
          const ang = (i * 30) * Math.PI / 180;
          return <line key={i} x1={100} y1={100} x2={100 + Math.cos(ang) * 120} y2={100 + Math.sin(ang) * 120}/>;
        })}
      </g>
      <circle cx="100" cy="100" r="38" fill={p.b} stroke={p.c} strokeWidth="2"/>
      <circle cx="92" cy="92" r="6" fill={p.c}/>
    </svg>,
    /* mountains */
    <svg key="2" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="200" height="200" fill={p.a}/>
      <circle cx="160" cy="50" r="22" fill={p.b}/>
      <path d="M0 160 L60 90 L100 130 L160 60 L200 110 L200 200 L0 200 Z" fill={p.c}/>
      <path d="M0 160 L60 90 L100 130 L160 60 L200 110" fill="none" stroke={p.b} strokeWidth="2" opacity="0.5"/>
    </svg>,
    /* rings */
    <svg key="3" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="200" height="200" fill={p.a}/>
      <g fill="none" stroke={p.c} strokeWidth="3">
        <circle cx="100" cy="100" r="20"/>
        <circle cx="100" cy="100" r="40"/>
        <circle cx="100" cy="100" r="60"/>
        <circle cx="100" cy="100" r="80"/>
      </g>
      <circle cx="100" cy="100" r="14" fill={p.b}/>
    </svg>,
    /* face */
    <svg key="4" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="200" height="200" fill={p.a}/>
      <ellipse cx="100" cy="120" rx="58" ry="74" fill={p.b}/>
      <circle cx="80" cy="105" r="5" fill={p.c}/>
      <circle cx="120" cy="105" r="5" fill={p.c}/>
      <path d="M80 140 Q100 156 120 140" stroke={p.c} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M100 70 q-25 -30 -50 0" stroke={p.c} strokeWidth="3" fill="none"/>
    </svg>,
    /* leaves */
    <svg key="5" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="200" height="200" fill={p.a}/>
      <g stroke={p.c} strokeWidth="2" fill={p.b}>
        <path d="M40 160 q40 -80 80 -100 q-20 60 -80 100z"/>
        <path d="M100 180 q40 -80 80 -100 q-20 60 -80 100z" opacity="0.6"/>
      </g>
    </svg>,
  ];

  return (
    <div style={{
      height,
      position: "relative",
      borderRadius: 14,
      overflow: "hidden",
      border: "2px solid var(--ink)"
    }}>
      {compositions[k]}
    </div>
  );
}
