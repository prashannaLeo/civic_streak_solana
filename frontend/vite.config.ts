import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
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
=======
  base: "./",
  root: ".",
  publicDir: "public",
>>>>>>> 9b4bc66 (Add frontend and PDA logic)
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  server: {
    port: 3000,
    open: true,
  },
<<<<<<< HEAD
=======
  define: {
    "process.env": {},
    global: "window",
  },
  resolve: {
    alias: {
      Buffer: "buffer/",
    },
  },
  optimizeDeps: {
    include: ["buffer"],
  },
>>>>>>> 9b4bc66 (Add frontend and PDA logic)
});
