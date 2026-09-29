import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:3001" },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Phaser is loaded only when Quest Mode starts; its engine bundle is intentionally larger.
    chunkSizeWarningLimit: 1800,
  },
});
