import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  server: {
    port: 3000,
    open: true,
  },
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
});
