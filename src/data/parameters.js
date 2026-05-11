// Rarity tiers
export const RARITY = {
  COMUN: "Común",
  RARO: "Raro",
  EPICO: "Épico",
  LEGENDARIO: "Legendario",
};

export const RARITY_COLORS = {
  [RARITY.COMUN]: { bg: "#E8E8E8", text: "#555555", border: "#BBBBBB" },
  [RARITY.RARO]: { bg: "#C8F0FF", text: "#0077AA", border: "#66CCEE" },
  [RARITY.EPICO]: { bg: "#EFE8FF", text: "#6600CC", border: "#BB88FF" },
  [RARITY.LEGENDARIO]: { bg: "#FFE066", text: "#AA3300", border: "#FF9900" },
};

export const RARITY_EMOJI = {
  [RARITY.COMUN]: "⚪",
  [RARITY.RARO]: "🔵",
  [RARITY.EPICO]: "🟣",
  [RARITY.LEGENDARIO]: "🌟",
};

// Seasons / events for special parameter tags
export const SEASONS = {
  PRIMAVERA: "Primavera",
  VERANO: "Verano",
  OTONO: "Otoño",
  INVIERNO: "Invierno",
  NAVIDAD: "Navidad",
  HALLOWEEN: "Halloween",
  SANVALENTIN: "San Valentín",
};

// Current active season/event (admin can change this)
export const ACTIVE_SEASON = SEASONS.PRIMAVERA;

// Parameter categories
export const PARAM_CATEGORIES = [
  { id: "Lugares", label: "Lugares", icon: "📍", color: "#D6F5FF" },
  { id: "Emociones", label: "Emociones", icon: "🙂", color: "#FFD6E7" },
  { id: "Personajes", label: "Personajes", icon: "🧑‍🎤", color: "#EFE8FF" },
  { id: "Objetos", label: "Objetos", icon: "🍎", color: "#D6FFE8" },
  { id: "Animales", label: "Animales", icon: "🐾", color: "#FFF3D6" },
  { id: "Acciones", label: "Acciones", icon: "🕺", color: "#FFE8D6" },
  { id: "Eventos", label: "Eventos", icon: "🎪", color: "#D6E8FF" },
];

// Full parameter values with rarity and optional season tag
export const PARAMETERS = {
  Lugares: [
    // Común
    { value: "bosque oscuro", rarity: RARITY.COMUN },
    { value: "cafetería pequeña", rarity: RARITY.COMUN },
    { value: "parque solitario", rarity: RARITY.COMUN },
    { value: "calle lluviosa", rarity: RARITY.COMUN },
    { value: "habitación caótica", rarity: RARITY.COMUN },
    { value: "azotea de ciudad", rarity: RARITY.COMUN },
    { value: "mercado nocturno", rarity: RARITY.COMUN },
    { value: "playa al amanecer", rarity: RARITY.COMUN },
    { value: "estación de tren", rarity: RARITY.COMUN },
    { value: "museo vacío", rarity: RARITY.COMUN },
    // Raro
    { value: "biblioteca infinita", rarity: RARITY.RARO },
    { value: "metro abandonado", rarity: RARITY.RARO },
    { value: "jardín japonés", rarity: RARITY.RARO },
    { value: "fábrica abandonada", rarity: RARITY.RARO },
    { value: "mundo submarino", rarity: RARITY.RARO },
    { value: "cementerio victoriano", rarity: RARITY.RARO },
    { value: "desierto rojo", rarity: RARITY.RARO },
    { value: "pueblo fantasma", rarity: RARITY.RARO },
    { value: "bosque de hongos gigantes", rarity: RARITY.RARO },
    { value: "pantano brillante", rarity: RARITY.RARO },
    // Épico
    { value: "templo sumergido", rarity: RARITY.EPICO },
    { value: "castillo flotante", rarity: RARITY.EPICO },
    { value: "ciudad cyberpunk", rarity: RARITY.EPICO },
    { value: "laboratorio secreto", rarity: RARITY.EPICO },
    { value: "tren infinito", rarity: RARITY.EPICO },
    { value: "parque de diversiones vacío", rarity: RARITY.EPICO },
    { value: "isla volcánica", rarity: RARITY.EPICO },
    { value: "azotea futurista", rarity: RARITY.EPICO },
    // Legendario
    { value: "dimensión surrealista", rarity: RARITY.LEGENDARIO },
    { value: "espacio entre mundos", rarity: RARITY.LEGENDARIO },
    { value: "umbral del tiempo", rarity: RARITY.LEGENDARIO },
    // Seasonal
    { value: "jardín en flor primaveral", rarity: RARITY.RARO, season: SEASONS.PRIMAVERA },
    { value: "campo de cerezos", rarity: RARITY.EPICO, season: SEASONS.PRIMAVERA },
    { value: "bosque nevado", rarity: RARITY.RARO, season: SEASONS.INVIERNO },
    { value: "aldea navideña", rarity: RARITY.EPICO, season: SEASONS.NAVIDAD },
    { value: "mansión embrujada", rarity: RARITY.EPICO, season: SEASONS.HALLOWEEN },
  ],

  Emociones: [
    { value: "melancolía", rarity: RARITY.COMUN },
    { value: "ansiedad", rarity: RARITY.COMUN },
    { value: "alegría", rarity: RARITY.COMUN },
    { value: "miedo", rarity: RARITY.COMUN },
    { value: "nostalgia", rarity: RARITY.COMUN },
    { value: "soledad", rarity: RARITY.COMUN },
    { value: "rabia", rarity: RARITY.COMUN },
    { value: "ternura", rarity: RARITY.COMUN },
    { value: "esperanza", rarity: RARITY.COMUN },
    { value: "paz", rarity: RARITY.COMUN },
    { value: "euforia", rarity: RARITY.RARO },
    { value: "confusión", rarity: RARITY.RARO },
    { value: "obsesión", rarity: RARITY.RARO },
    { value: "agotamiento", rarity: RARITY.RARO },
    { value: "culpa", rarity: RARITY.RARO },
    { value: "alivio", rarity: RARITY.RARO },
    { value: "enamoramiento", rarity: RARITY.RARO },
    { value: "paranoia", rarity: RARITY.RARO },
    { value: "caos interno", rarity: RARITY.EPICO },
    { value: "vacío emocional", rarity: RARITY.EPICO },
    { value: "adrenalina pura", rarity: RARITY.EPICO },
    { value: "calma absoluta", rarity: RARITY.EPICO },
    { value: "inspiración divina", rarity: RARITY.EPICO },
    { value: "curiosidad voraz", rarity: RARITY.EPICO },
    { value: "dualidad interior", rarity: RARITY.LEGENDARIO },
    { value: "trascendencia emocional", rarity: RARITY.LEGENDARIO },
    { value: "amor cósmico", rarity: RARITY.LEGENDARIO },
    { value: "amor primaveral", rarity: RARITY.RARO, season: SEASONS.PRIMAVERA },
    { value: "terror festivo", rarity: RARITY.RARO, season: SEASONS.HALLOWEEN },
    { value: "nostalgia navideña", rarity: RARITY.RARO, season: SEASONS.NAVIDAD },
  ],

  Personajes: [
    { value: "bruja", rarity: RARITY.COMUN },
    { value: "detective", rarity: RARITY.COMUN },
    { value: "músico callejero", rarity: RARITY.COMUN },
    { value: "niño perdido", rarity: RARITY.COMUN },
    { value: "pirata", rarity: RARITY.COMUN },
    { value: "bailarina", rarity: RARITY.COMUN },
    { value: "samurái", rarity: RARITY.COMUN },
    { value: "astronauta", rarity: RARITY.COMUN },
    { value: "artista callejero", rarity: RARITY.COMUN },
    { value: "chef maldito", rarity: RARITY.RARO },
    { value: "vampiro elegante", rarity: RARITY.RARO },
    { value: "mago torpe", rarity: RARITY.RARO },
    { value: "fantasma amigable", rarity: RARITY.RARO },
    { value: "princesa rebelde", rarity: RARITY.RARO },
    { value: "payaso triste", rarity: RARITY.RARO },
    { value: "ninja silencioso", rarity: RARITY.RARO },
    { value: "hacker futurista", rarity: RARITY.RARO },
    { value: "viajero temporal", rarity: RARITY.EPICO },
    { value: "cazador de monstruos", rarity: RARITY.EPICO },
    { value: "científica loca", rarity: RARITY.EPICO },
    { value: "robot oxidado", rarity: RARITY.EPICO },
    { value: "médium paranormal", rarity: RARITY.EPICO },
    { value: "alquimista", rarity: RARITY.EPICO },
    { value: "motociclista cyberpunk", rarity: RARITY.EPICO },
    { value: "dios antiguo", rarity: RARITY.LEGENDARIO },
    { value: "guardián celestial", rarity: RARITY.LEGENDARIO },
    { value: "rey olvidado", rarity: RARITY.LEGENDARIO },
    { value: "hada de primavera", rarity: RARITY.RARO, season: SEASONS.PRIMAVERA },
    { value: "duende navideño", rarity: RARITY.RARO, season: SEASONS.NAVIDAD },
    { value: "lich vampírico", rarity: RARITY.EPICO, season: SEASONS.HALLOWEEN },
  ],

  Objetos: [
    { value: "reloj roto", rarity: RARITY.COMUN },
    { value: "paraguas transparente", rarity: RARITY.COMUN },
    { value: "cámara antigua", rarity: RARITY.COMUN },
    { value: "carta quemada", rarity: RARITY.COMUN },
    { value: "guitarra eléctrica", rarity: RARITY.COMUN },
    { value: "diario secreto", rarity: RARITY.COMUN },
    { value: "televisor retro", rarity: RARITY.COMUN },
    { value: "botella con mensaje", rarity: RARITY.COMUN },
    { value: "cassette maldito", rarity: RARITY.RARO },
    { value: "máscara dorada", rarity: RARITY.RARO },
    { value: "espejo infinito", rarity: RARITY.RARO },
    { value: "llave misteriosa", rarity: RARITY.RARO },
    { value: "corona oxidada", rarity: RARITY.RARO },
    { value: "marioneta", rarity: RARITY.RARO },
    { value: "brújula rota", rarity: RARITY.RARO },
    { value: "flor negra", rarity: RARITY.RARO },
    { value: "collar encantado", rarity: RARITY.EPICO },
    { value: "espada luminosa", rarity: RARITY.EPICO },
    { value: "libro prohibido", rarity: RARITY.EPICO },
    { value: "esfera brillante", rarity: RARITY.EPICO },
    { value: "lámpara mágica", rarity: RARITY.EPICO },
    { value: "joystick arcade", rarity: RARITY.EPICO },
    { value: "origami vivo", rarity: RARITY.EPICO },
    { value: "cuchillo ceremonial", rarity: RARITY.EPICO },
    { value: "artefacto del tiempo", rarity: RARITY.LEGENDARIO },
    { value: "cristal dimensional", rarity: RARITY.LEGENDARIO },
    { value: "reliquia cósmica", rarity: RARITY.LEGENDARIO },
    { value: "flor de cerezo mágica", rarity: RARITY.RARO, season: SEASONS.PRIMAVERA },
    { value: "calabaza tallada", rarity: RARITY.RARO, season: SEASONS.HALLOWEEN },
    { value: "estrella de navidad", rarity: RARITY.RARO, season: SEASONS.NAVIDAD },
  ],

  Animales: [
    { value: "gato negro", rarity: RARITY.COMUN },
    { value: "cuervo", rarity: RARITY.COMUN },
    { value: "perro callejero", rarity: RARITY.COMUN },
    { value: "mariposa", rarity: RARITY.COMUN },
    { value: "conejo", rarity: RARITY.COMUN },
    { value: "pez koi", rarity: RARITY.COMUN },
    { value: "murciélago", rarity: RARITY.COMUN },
    { value: "pingüino aventurero", rarity: RARITY.COMUN },
    { value: "panda triste", rarity: RARITY.RARO },
    { value: "zorro", rarity: RARITY.RARO },
    { value: "lobo blanco", rarity: RARITY.RARO },
    { value: "medusa transparente", rarity: RARITY.RARO },
    { value: "búho sabio", rarity: RARITY.RARO },
    { value: "mapache ladrón", rarity: RARITY.RARO },
    { value: "araña cristalina", rarity: RARITY.RARO },
    { value: "tiburón fantasma", rarity: RARITY.RARO },
    { value: "serpiente luminosa", rarity: RARITY.EPICO },
    { value: "conejo mecánico", rarity: RARITY.EPICO },
    { value: "ciervo espiritual", rarity: RARITY.EPICO },
    { value: "pez abisal", rarity: RARITY.EPICO },
    { value: "tigre dorado", rarity: RARITY.EPICO },
    { value: "pulpo gigante", rarity: RARITY.EPICO },
    { value: "camaleón neón", rarity: RARITY.EPICO },
    { value: "cabra demoníaca", rarity: RARITY.EPICO },
    { value: "fénix", rarity: RARITY.LEGENDARIO },
    { value: "ballena cósmica", rarity: RARITY.LEGENDARIO },
    { value: "dragón primigenio", rarity: RARITY.LEGENDARIO },
    { value: "mariposa de cerezo", rarity: RARITY.RARO, season: SEASONS.PRIMAVERA },
    { value: "cuervo de medianoche", rarity: RARITY.EPICO, season: SEASONS.HALLOWEEN },
    { value: "reno mágico", rarity: RARITY.RARO, season: SEASONS.NAVIDAD },
  ],

  Acciones: [
    { value: "escapando", rarity: RARITY.COMUN },
    { value: "llorando", rarity: RARITY.COMUN },
    { value: "durmiendo", rarity: RARITY.COMUN },
    { value: "pintando", rarity: RARITY.COMUN },
    { value: "corriendo bajo lluvia", rarity: RARITY.COMUN },
    { value: "leyendo secretos", rarity: RARITY.COMUN },
    { value: "cocinando", rarity: RARITY.COMUN },
    { value: "observando estrellas", rarity: RARITY.COMUN },
    { value: "cantando", rarity: RARITY.COMUN },
    { value: "bailando", rarity: RARITY.RARO },
    { value: "flotando", rarity: RARITY.RARO },
    { value: "escondiéndose", rarity: RARITY.RARO },
    { value: "destruyendo algo", rarity: RARITY.RARO },
    { value: "robando", rarity: RARITY.RARO },
    { value: "meditando", rarity: RARITY.RARO },
    { value: "tocando piano", rarity: RARITY.RARO },
    { value: "abrazando", rarity: RARITY.RARO },
    { value: "persiguiendo algo", rarity: RARITY.RARO },
    { value: "cayendo al vacío", rarity: RARITY.EPICO },
    { value: "transformándose", rarity: RARITY.EPICO },
    { value: "soñando despierto", rarity: RARITY.EPICO },
    { value: "haciendo magia", rarity: RARITY.EPICO },
    { value: "viajando en tren", rarity: RARITY.EPICO },
    { value: "huyendo de monstruos", rarity: RARITY.EPICO },
    { value: "despertando", rarity: RARITY.EPICO },
    { value: "atravesando dimensiones", rarity: RARITY.LEGENDARIO },
    { value: "reescribiendo la realidad", rarity: RARITY.LEGENDARIO },
    { value: "fusionándose con el cosmos", rarity: RARITY.LEGENDARIO },
    { value: "floreciendo", rarity: RARITY.RARO, season: SEASONS.PRIMAVERA },
    { value: "truco o trato", rarity: RARITY.RARO, season: SEASONS.HALLOWEEN },
    { value: "envolviendo regalos", rarity: RARITY.RARO, season: SEASONS.NAVIDAD },
  ],

  Eventos: [
    { value: "carnaval", rarity: RARITY.COMUN },
    { value: "concierto underground", rarity: RARITY.COMUN },
    { value: "tormenta eléctrica", rarity: RARITY.COMUN },
    { value: "apagón global", rarity: RARITY.COMUN },
    { value: "fiesta en azotea", rarity: RARITY.COMUN },
    { value: "competencia callejera", rarity: RARITY.COMUN },
    { value: "eclipse solar", rarity: RARITY.RARO },
    { value: "festival nocturno", rarity: RARITY.RARO },
    { value: "boda surrealista", rarity: RARITY.RARO },
    { value: "ceremonia mágica", rarity: RARITY.RARO },
    { value: "lluvia de meteoritos", rarity: RARITY.RARO },
    { value: "nevada eterna", rarity: RARITY.RARO },
    { value: "tormenta de arena", rarity: RARITY.RARO },
    { value: "carrera mortal", rarity: RARITY.RARO },
    { value: "ritual prohibido", rarity: RARITY.EPICO },
    { value: "desfile futurista", rarity: RARITY.EPICO },
    { value: "rebelión robótica", rarity: RARITY.EPICO },
    { value: "explosión dimensional", rarity: RARITY.EPICO },
    { value: "apertura de portal", rarity: RARITY.EPICO },
    { value: "caída de la luna", rarity: RARITY.EPICO },
    { value: "fiesta infinita", rarity: RARITY.EPICO },
    { value: "coronación imperial", rarity: RARITY.EPICO },
    { value: "fin del mundo", rarity: RARITY.LEGENDARIO },
    { value: "guerra intergaláctica", rarity: RARITY.LEGENDARIO },
    { value: "inversión temporal", rarity: RARITY.LEGENDARIO },
    { value: "festival de flores", rarity: RARITY.RARO, season: SEASONS.PRIMAVERA },
    { value: "noche de brujas", rarity: RARITY.EPICO, season: SEASONS.HALLOWEEN },
    { value: "nochebuena mágica", rarity: RARITY.EPICO, season: SEASONS.NAVIDAD },
  ],
};

export const TECHNIQUES = [
  { id: "acuarela", label: "Acuarela", icon: "🫧", color: "#D6F5FF" },
  { id: "tinta", label: "Tinta", icon: "⚫", color: "#E8E8E8" },
  { id: "digital", label: "Digital", icon: "🖊️", color: "#EFE8FF" },
  { id: "lapiz", label: "Lápiz", icon: "✏️", color: "#FFF3D6" },
  { id: "oleo", label: "Óleo", icon: "🎨", color: "#FFD6E7" },
  { id: "manga", label: "Manga", icon: "🌸", color: "#FFE8F0" },
  { id: "pixel", label: "Pixel Art", icon: "👾", color: "#D6E8FF" },
  { id: "gouache", label: "Gouache", icon: "🖌️", color: "#D6FFE8" },
  { id: "carboncillo", label: "Carboncillo", icon: "🪨", color: "#F0F0F0" },
];

export const MUSIC_TRACKS = [
  { id: "lofi",   icon: "🌙", title: "Midnight Lofi",    mood: "beat suave infinito", color: "#1a1a2e" },
  { id: "rain",   icon: "🌧️", title: "Rain Studio",       mood: "lluvia relajante",    color: "#2c5f7a" },
  { id: "coffee", icon: "☕", title: "Coffee Shop",        mood: "cafetería creativa",  color: "#6b3a2a" },
  { id: "forest", icon: "🌲", title: "Forest Sketching",  mood: "bosque tranquilo",    color: "#1a4a2e" },
  { id: "piano",  icon: "🎹", title: "Soft Piano",         mood: "piano relajante",     color: "#2a2a4a" },
  { id: "analog", icon: "📼", title: "Analog Chill",       mood: "cinta vintage",       color: "#4a3a1a" },
  { id: "synth",  icon: "🪐", title: "Synth Chill",        mood: "espacial suave",      color: "#1a1a5a" },
  { id: "night",  icon: "🕯️", title: "Night Studio",       mood: "estudio nocturno",    color: "#2a1a3a" },
];

export const DURATIONS = [
  { label: "10 min", seconds: 10 * 60, emoji: "⚡" },
  { label: "15 min", seconds: 15 * 60, emoji: "🎯" },
  { label: "30 min", seconds: 30 * 60, emoji: "🔥" },
  { label: "Sin límite", seconds: null, emoji: "∞" },
];

// User levels
export const LEVELS = [
  { id: 1, name: "Nuevo Artista",    minChallenges: 0,  color: "#E8E8E8", emoji: "🌱", desc: "el primer paso" },
  { id: 2, name: "Artista Activo",   minChallenges: 5,  color: "#C8F0FF", emoji: "🎨", desc: "ya no hay vuelta atrás" },
  { id: 3, name: "Creador Constante",minChallenges: 10, color: "#EFE8FF", emoji: "⭐", desc: "esto ya es una rutina" },
  { id: 4, name: "Inspirador",       minChallenges: 20, color: "#FFE066", emoji: "✨", desc: "la gente te sigue" },
  { id: 5, name: "Maestro del Reto", minChallenges: 30, color: "#FF9966", emoji: "🏆", desc: "eso ya no te lo quita nadie" },
];

export function getUserLevel(completedChallenges) {
  return [...LEVELS].reverse().find(l => completedChallenges >= l.minChallenges) || LEVELS[0];
}

export function getOverallRarity(variables) {
  const rarities = variables.map(v => v.rarity);
  if (rarities.includes(RARITY.LEGENDARIO)) return RARITY.LEGENDARIO;
  if (rarities.includes(RARITY.EPICO)) return RARITY.EPICO;
  if (rarities.includes(RARITY.RARO)) return RARITY.RARO;
  return RARITY.COMUN;
}

export function generatePrompt(variables) {
  const vals = variables.map(v => v.value);
  if (vals.length === 1) return `Ilustra: ${vals[0]}.`;
  if (vals.length === 2) return `Ilustra ${vals[0]} con ${vals[1]}.`;
  if (vals.length === 3) return `Ilustra ${vals[0]} encontrando ${vals[1]} en ${vals[2]}.`;
  return `Ilustra una escena donde ${vals.join(", ")} se entrelazan de forma inesperada.`;
}

export function pickVariables(paramIds, activeSeason = null) {
  return paramIds.map(paramId => {
    const pool = PARAMETERS[paramId];
    let filtered = activeSeason
      ? pool.filter(v => !v.season || v.season === activeSeason)
      : pool.filter(v => !v.season);
    if (filtered.length === 0) filtered = pool;
    // Weighted random: Legendario 5%, Épico 15%, Raro 30%, Común 50%
    const weights = { [RARITY.COMUN]: 50, [RARITY.RARO]: 30, [RARITY.EPICO]: 15, [RARITY.LEGENDARIO]: 5 };
    const weighted = [];
    filtered.forEach(item => {
      const w = weights[item.rarity] || 10;
      for (let i = 0; i < w; i++) weighted.push(item);
    });
    return weighted[Math.floor(Math.random() * weighted.length)];
  });
}

// Sample posts for feed
export const SAMPLE_POSTS = [
  {
    id: "p1", userId: "luna_sketch", username: "LunaSketch", avatar: "🌙",
    technique: "Tinta", variables: ["melancolía", "cuervo", "carnaval"],
    prompt: "Ilustra melancolía encontrando cuervo en carnaval.",
    params: ["Emociones", "Animales", "Eventos"], duration: "30 min",
    likes: 128, inspires: 45, tries: 32, rarity: RARITY.EPICO,
    gradient: "from-purple-400 via-pink-300 to-slate-700",
  },
  {
    id: "p2", userId: "mika_draws", username: "MikaDraws", avatar: "🎨",
    technique: "Acuarela", variables: ["nostalgia", "gato negro", "biblioteca infinita"],
    prompt: "Ilustra nostalgia encontrando gato negro en biblioteca infinita.",
    params: ["Emociones", "Animales", "Lugares"], duration: "15 min",
    likes: 94, inspires: 38, tries: 21, rarity: RARITY.RARO,
    gradient: "from-cyan-200 via-blue-300 to-indigo-400",
  },
  {
    id: "p3", userId: "neko_art", username: "NekoArt", avatar: "🌸",
    technique: "Manga", variables: ["euforia", "zorro", "festival nocturno"],
    prompt: "Ilustra euforia encontrando zorro en festival nocturno.",
    params: ["Emociones", "Animales", "Eventos"], duration: "10 min",
    likes: 210, inspires: 76, tries: 50, rarity: RARITY.RARO,
    gradient: "from-pink-300 via-rose-300 to-orange-300",
  },
  {
    id: "p4", userId: "digital_dawn", username: "DigitalDawn", avatar: "⚡",
    technique: "Digital", variables: ["dualidad interior", "fénix", "fin del mundo"],
    prompt: "Ilustra dualidad interior encontrando fénix en fin del mundo.",
    params: ["Emociones", "Animales", "Eventos"], duration: "30 min",
    likes: 389, inspires: 142, tries: 88, rarity: RARITY.LEGENDARIO,
    gradient: "from-yellow-300 via-orange-400 to-red-500",
  },
];
