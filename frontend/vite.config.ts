import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/civic_streak_solana/',
  root: '.',
  publicDir: 'public',
  // Solana deps expect Buffer/global in the browser.
  // `src/main.tsx` sets `window.Buffer = Buffer`; this ensures the `buffer` package is bundled.
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    open: true,
  },
});
