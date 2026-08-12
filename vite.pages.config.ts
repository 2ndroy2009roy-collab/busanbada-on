import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// GitHub Pages serves static files. Keep this build separate from the
// Vinext/worker build used by the existing project.
export default defineConfig({
  root: resolve(import.meta.dirname, "github-pages"),
  publicDir: resolve(import.meta.dirname, "public"),
  base: process.env.GITHUB_ACTIONS ? "/busanbada-on/" : "/",
  plugins: [react()],
  define: {
    "process.env.NEXT_PUBLIC_KAKAO_MAP_KEY": JSON.stringify(
      process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? process.env.VITE_KAKAO_MAP_KEY ?? "",
    ),
  },
  build: {
    outDir: resolve(import.meta.dirname, "gh-pages-dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(import.meta.dirname, "github-pages/index.html"),
    },
  },
});
