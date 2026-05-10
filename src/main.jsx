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
