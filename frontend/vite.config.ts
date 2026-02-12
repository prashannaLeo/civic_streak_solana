import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/civic_streak_solana/",
  root: ".",
  // envDir removed - .env file is in the same directory as vite.config.ts
  envPrefix: ["VITE_"],
  publicDir: "public",
  // Solana deps expect Buffer/global in the browser.
  // `src/main.tsx` sets `window.Buffer = Buffer`; this ensures the `buffer` package is bundled.
  define: {
    global: "window",
    "process.env": {},
  },
  resolve: {
    alias: {
      buffer: "buffer",
      Buffer: "buffer/",
    },
  },
  optimizeDeps: {
    include: ["buffer"],
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  server: {
    port: 3000,
    open: true,
  },
});
