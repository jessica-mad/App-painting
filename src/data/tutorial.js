export const TUTORIAL_STEPS = [
  // 0 — Home: racha
  { screen: "home",       target: "tut-streak",      textKey: "tut.0",  interactive: false },
  // 1 — Home: botón La Musa → al "Siguiente" navega a random
  { screen: "home",       target: "tut-muse-cta",    textKey: "tut.1",  interactive: false, nextScreen: "random" },
  // 2 — Random: elegir parámetros (chips clicables)
  { screen: "random",     target: "tut-cat-chips",   textKey: "tut.2",  interactive: true },
  // 3 — Random: palanca (clicable, tirada sin decrementar, fuerza Común)
  { screen: "random",     target: "tut-lever",       textKey: "tut.3",  interactive: true,  waitForAction: "roll" },
  // 4 — Random: caja blanca con resultado
  { screen: "random",     target: "tut-result-box",  textKey: "tut.4",  interactive: false },
  // 5 — Random: barra de botones
  { screen: "random",     target: "tut-action-bar",  textKey: "tut.5",  interactive: true,  waitForAction: "accept" },
  // 6 — SetupTimer: selección de duración
  { screen: "setupTimer", target: "tut-duration",    textKey: "tut.6",  interactive: true },
  // 7 — SetupTimer: sección de música → el usuario elige pista y pulsa Iniciar
  { screen: "setupTimer", target: "tut-music",       textKey: "tut.7",  interactive: true,  waitForAction: "start" },
  // 8 — Timer: lluvia de ideas y cambio de canción
  { screen: "timer",      target: "tut-brainstorm",  textKey: "tut.8",  interactive: false },
  // 9 — Timer: botón "Ya terminé"
  { screen: "timer",      target: "tut-done-btn",    textKey: "tut.9",  interactive: true,  waitForAction: "done" },
  // 10 — Upload: zona de foto + descripción
  { screen: "upload",     target: "tut-upload-zone", textKey: "tut.10", interactive: false },
  // 11 — Upload: botón "Finalizar tour"
  { screen: "upload",     target: "tut-finish-btn",  textKey: "tut.11", interactive: true,  isLast: true },
];
