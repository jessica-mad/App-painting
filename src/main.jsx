import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Soporte para ambos IDs: inkrush-root (WordPress plugin) y root (desarrollo local)
const mountNode = document.getElementById('inkrush-root') || document.getElementById('root');

if (mountNode) {
  createRoot(mountNode).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Click sound on all buttons
(function () {
  const audio = new Audio(import.meta.env.BASE_URL + "tap.MP3");
  audio.volume = 0.35;
  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest("button, [role=button], a");
    if (!el) return;
    const clone = new Audio(audio.src);
    clone.volume = audio.volume;
    clone.play().catch(() => {});
  }, { passive: true });
})();

