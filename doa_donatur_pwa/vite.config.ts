import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

function normalizeBasePath(value: string | undefined) {
  const raw = (value || "/").trim();
  if (!raw || raw === "/") return "/";

  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const lifecycleEvent = process.env.npm_lifecycle_event || "";
  const isPublishBuild = mode === "devpublish" || lifecycleEvent === "build:production";
  const basePath = normalizeBasePath(env.VITE_PWA_BASE || (isPublishBuild ? "/pwa/" : "/"));

  return {
    base: basePath,
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"],
        manifest: {
          name: "Doa Donatur",
          short_name: "Doa",
          description: "Aplikasi jadwal doa donatur",
          start_url: `${basePath}#/dashboard`,
          scope: basePath,
          display: "standalone",
          orientation: "portrait",
          background_color: "#17151d",
          theme_color: "#563b91",
          categories: ["productivity", "lifestyle"],
          icons: [
            {
              src: `${basePath}icons/icon-192.png`,
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: `${basePath}icons/icon-512.png`,
              sizes: "512x512",
              type: "image/png"
            },
            {
              src: `${basePath}icons/maskable-512.png`,
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        },
        workbox: {
          globPatterns: ["**/*.{html,js,css,png,svg,webmanifest}"],
          navigateFallback: `${basePath}index.html`,
          cleanupOutdatedCaches: true,
          runtimeCaching: []
        },
        devOptions: {
          enabled: true,
          type: "module"
        }
      })
    ]
  };
});
