import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"],
      manifest: {
        name: "Doa Donatur",
        short_name: "Doa",
        description: "Aplikasi jadwal doa donatur",
        start_url: "/#/dashboard",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#17151d",
        theme_color: "#563b91",
        categories: ["productivity", "lifestyle"],
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{html,js,css,png,svg,webmanifest}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        runtimeCaching: []
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ]
});
