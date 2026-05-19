import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'plugin-assets',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: 'app.js',
        assetFileNames: (info) => {
          if (info.names?.[0]?.endsWith('.css') || info.name?.endsWith('.css')) return 'app.css';
          return info.names?.[0] ?? info.name ?? 'asset.[ext]';
        },
      },
    },
  },
})
