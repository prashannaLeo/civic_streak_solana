import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/civic_streak_solana/',
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  server: {
    port: 3000,
    host: "127.0.0.1",  // Use 127.0.0.1 instead of localhost for Phantom compatibility
    allowedHosts: ["shena-areosystyle-perorally.ngrok-free.dev"],
    strictPort: false,
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  resolve: {
    alias: {
      Buffer: "buffer/",
    },
  },
});
