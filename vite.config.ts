import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages: https://tinsleyfok.github.io/TinsleyToolbox/
// Use command === "build" (not NODE_ENV) — CI often has no NODE_ENV when config loads.
const repoBase = "/TinsleyToolbox/";

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === "build" ? repoBase : "/",
  server: {
    open: true,
    port: 5173,
  },
}));
