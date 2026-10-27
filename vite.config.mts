/// <reference types="vitest/config" />
import { cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const src = fileURLToPath(new URL('./src', import.meta.url));

// Vite no copia las carpetas ocultas de public/, y ahí está .well-known/security.txt
const copyWellKnown = () => ({
  name: 'copy-well-known',
  apply: 'build' as const,
  closeBundle() {
    cpSync('public/.well-known', 'build/.well-known', { recursive: true });
  },
});

export default defineConfig({
  plugins: [react(), copyWellKnown()],
  // Mismo prefijo que con Create React App, para no cambiar las variables en Netlify
  envPrefix: 'REACT_APP_',
  resolve: {
    // Imports absolutos desde src (components/..., utils/..., i18n), como con baseUrl en tsconfig
    alias: [
      { find: /^(assets|components|hooks|locales|pages|styles|utils)\//, replacement: `${src}/$1/` },
      { find: /^(config|i18n)$/, replacement: `${src}/$1` },
    ],
  },
  build: {
    // build/ y build/static/ como antes: los usan netlify.toml (caché), server.js y el Dockerfile
    outDir: 'build',
    assetsDir: 'static',
    // La página de resultados pesa ~800 kB (mapas y gráficos); ya se carga aparte de la portada
    chunkSizeWarningLimit: 900,
  },
  server: { port: 3000 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
});
