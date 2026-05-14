/* Monoline SVG icon set — 2px stroke, replaces emoji icons */
const Icon = ({ d, s = 20, sw = 2, fill = "none", stroke = "currentColor", style, className }) => (
  <svg
    width={s} height={s} viewBox="0 0 24 24"
    fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}
  >
    {d}
  </svg>
);

export const IHome     = (p) => <Icon {...p} d={<><path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></>}/>;
export const IFeed     = (p) => <Icon {...p} d={<><path d="M12 3l2.4 5.6L20 9l-4 3.8 1 5.7L12 16l-5 2.5 1-5.7L4 9l5.6-.4z"/></>}/>;
export const IPlus     = (p) => <Icon {...p} d={<><path d="M12 5v14M5 12h14"/></>}/>;
export const IHeart    = (p) => <Icon {...p} d={<><path d="M12 20s-7-4.5-9-9.5C2 7 4 4 7 4c2 0 3 1 5 3 2-2 3-3 5-3 3 0 5 3 4 6.5C19 15.5 12 20 12 20z"/></>}/>;
export const IBookmark = (p) => <Icon {...p} d={<><path d="M6 3h12v18l-6-4-6 4z"/></>}/>;
export const IUser     = (p) => <Icon {...p} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>}/>;
export const IDice     = (p) => <Icon {...p} d={<><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/></>}/>;
export const ITimer    = (p) => <Icon {...p} d={<><circle cx="12" cy="13" r="8"/><path d="M12 13V8M9 3h6"/></>}/>;
export const IMusic    = (p) => <Icon {...p} d={<><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></>}/>;
export const ISpark    = (p) => <Icon {...p} d={<><path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l4 4M14 14l4 4M18 6l-4 4M10 14l-4 4"/></>}/>;
export const IStar     = (p) => <Icon {...p} d={<><path d="M12 4l2.4 5.4 5.6.5-4.2 3.8 1.2 5.6L12 16l-5 3.3 1.2-5.6L4 9.9l5.6-.5z"/></>}/>;
export const IBolt     = (p) => <Icon {...p} d={<><path d="M13 3L4 14h7l-1 7 9-11h-7z"/></>}/>;
export const IFlame    = (p) => <Icon {...p} d={<><path d="M12 3c1 4 5 4 5 9a5 5 0 1 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-8z"/></>}/>;
export const IArrowR   = (p) => <Icon {...p} d={<><path d="M5 12h14M13 6l6 6-6 6"/></>}/>;
export const IArrowL   = (p) => <Icon {...p} d={<><path d="M19 12H5M11 6l-6 6 6 6"/></>}/>;
export const IPlay     = (p) => <Icon {...p} d={<><path d="M7 4v16l13-8z"/></>}/>;
export const IPause    = (p) => <Icon {...p} d={<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>}/>;
export const IReload   = (p) => <Icon {...p} d={<><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></>}/>;
export const IShare    = (p) => <Icon {...p} d={<><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 11l6-3M9 13l6 3"/></>}/>;
export const ICam      = (p) => <Icon {...p} d={<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13" r="3.5"/></>}/>;
export const IBrush    = (p) => <Icon {...p} d={<><path d="M15 3l6 6-9 9-3-3z"/><path d="M8 17l-3 3 3-1 1-3z"/></>}/>;
export const ILock     = (p) => <Icon {...p} d={<><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>}/>;
export const ICheck    = (p) => <Icon {...p} d={<><path d="M5 12l4 4 10-10"/></>}/>;
export const IX        = (p) => <Icon {...p} d={<><path d="M6 6l12 12M18 6L6 18"/></>}/>;
export const IDiamond  = (p) => <Icon {...p} d={<><path d="M12 3l8 9-8 9-8-9z"/><path d="M4 12h16"/></>}/>;
export const ICircle   = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="8"/></>}/>;
export const ITriangle = (p) => <Icon {...p} d={<><path d="M12 4l9 16H3z"/></>}/>;
export const ICross    = (p) => <Icon {...p} d={<><path d="M12 4v16M4 12h16"/></>}/>;
export const IInspire  = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/></>}/>;
export const ITrash    = (p) => <Icon {...p} d={<><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/></>}/>;
export const IDotsV    = (p) => <Icon {...p} d={<><circle cx="12" cy="5"  r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="2" fill="currentColor" stroke="none"/></>}/>;
export const IEyeOff   = (p) => <Icon {...p} d={<><path d="M17.9 17.9A10 10 0 0 1 12 20C7 20 3 16 2 12a10 10 0 0 1 4.1-5.9M9.9 5.2A10 10 0 0 1 12 5c5 0 9 4 10 9a10 10 0 0 1-2 4.3M3 3l18 18"/></>}/>;
export const IFlag     = (p) => <Icon {...p} d={<><path d="M5 3v18M5 3h12l-2 5h2l-2 5H5"/></>}/>;
export const ICopy     = (p) => <Icon {...p} d={<><rect x="8" y="3" width="13" height="13" rx="2"/><path d="M16 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h3"/></>}/>;
export const ILink     = (p) => <Icon {...p} d={<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/></>}/>;

/* Technique icons */
export const ITinta      = (p) => <Icon {...p} d={<><path d="M9 21l3-8 8-8 3 3-8 8z"/><path d="M14 9l3 3"/><path d="M12 13l-1 4 4-1"/><path d="M12.5 14.5l1 1"/></>}/>;
export const IPencil     = (p) => <Icon {...p} d={<><path d="M4 20l3-1 11-11-2-2L5 17z"/><path d="M14 6l2 2"/><path d="M18 4l2 2-1.5 1.5-2-2z"/></>}/>;
export const ICharcoal   = (p) => <Icon {...p} d={<><rect x="11" y="2" width="6" height="11" rx="1" transform="rotate(28 14 7.5)"/><path d="M3 20c4-1 8-1 14-2" strokeWidth={2.5}/></>}/>;
export const IPastel     = (p) => <Icon {...p} d={<><rect x="11" y="2" width="6" height="11" rx="1" transform="rotate(28 14 7.5)"/><path d="M3 20h2M7 19.5h2M11 19h2M15 18.5h2M19 18h1.5" strokeWidth={2.5}/></>}/>;
export const IOil        = (p) => <Icon {...p} d={<><rect x="4" y="4" width="16" height="13" rx="1"/><ellipse cx="12" cy="10.5" rx="4" ry="3"/><path d="M9 17l-2 4M15 17l2 4M12 17v4"/></>}/>;
export const IDigital    = (p) => <Icon {...p} d={<><rect x="2" y="5" width="15" height="14" rx="2"/><path d="M5 8h9M5 11h6" strokeWidth={1.4}/><path d="M22 5l-2-2-7 7-1 3 3-1z"/><path d="M18 7l2 2"/></>}/>;
export const IGouache    = (p) => <Icon {...p} d={<><path d="M14 3l4 4-6 6-3-3z"/><path d="M9 10l-3 3 3 3"/><path d="M4 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" strokeWidth={2}/></>}/>;
export const IMarker     = (p) => <Icon {...p} d={<><path d="M14 3l5 5-10 10H4v-5z"/><path d="M11 6l5 5"/><path d="M4 21h16" strokeDasharray="3 2"/></>}/>;
export const IWatercolor = (p) => <Icon {...p} d={<><path d="M14 3l4 4-6 6-3-3z"/><path d="M9 10l-3 3 3 3"/><path d="M4 20h16" strokeWidth={2.5}/><circle cx="6" cy="17" r="1.2" fill="currentColor"/></>}/>;
export const ISketchbook = (p) => <Icon {...p} d={<><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M17 3l-2 18" strokeWidth={2.2}/><path d="M9 8h3" strokeWidth={1.4} opacity="0.55"/></>}/>;
export const ISettings   = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></>}/>;
export const IChevronD   = (p) => <Icon {...p} d={<><path d="M6 9l6 6 6-6"/></>}/>;
export const IGrip       = (p) => <Icon {...p} d={<><circle cx="9" cy="5"  r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="5"  r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="19" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="19" r="1.4" fill="currentColor" stroke="none"/></>}/>;
export const IUndo       = (p) => <Icon {...p} d={<><path d="M3 10h11a6 6 0 0 1 0 12h-4"/><path d="M3 10l4-4M3 10l4 4"/></>}/>;

/* Convenience bundle for spread usage */
export const Icons = {
  home: IHome, feed: IFeed, plus: IPlus, heart: IHeart, bookmark: IBookmark,
  user: IUser, dice: IDice, timer: ITimer, music: IMusic, spark: ISpark,
  star: IStar, bolt: IBolt, flame: IFlame, arrowR: IArrowR, arrowL: IArrowL,
  play: IPlay, pause: IPause, reload: IReload, share: IShare, cam: ICam,
  brush: IBrush, lock: ILock, check: ICheck, x: IX, diamond: IDiamond,
  circle: ICircle, triangle: ITriangle, cross: ICross, inspire: IInspire,
  trash: ITrash, copy: ICopy, link: ILink,
  tinta: ITinta, pencil: IPencil, charcoal: ICharcoal, pastel: IPastel,
  oil: IOil, digital: IDigital, gouache: IGouache, marker: IMarker,
  watercolor: IWatercolor, sketchbook: ISketchbook, settings: ISettings, chevronD: IChevronD,
};

export default Icons;
