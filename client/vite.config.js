import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import netlify from "@netlify/vite-plugin";

const clientDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: clientDirectory,
  plugins: [react(), netlify()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001"
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
