import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Pede Direto - Contactos que resolvem",
        short_name: "Pede Direto",
        description: "Encontre rapidamente o contacto que resolve o seu problema. Restaurantes, serviços, lojas e profissionais.",
        theme_color: "#16a34a",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        categories: ["business", "utilities", "lifestyle"],
        icons: [
          {
            src: "/favicon.ico",
            sizes: "64x64",
            type: "image/x-icon",
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // Cache API calls to categories and subcategories
            urlPattern: /\/rest\/v1\/categories/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "categories-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /\/rest\/v1\/subcategories/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "subcategories-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            // Cache active businesses for offline access
            urlPattern: /\/rest\/v1\/businesses/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "businesses-cache",
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 12, // 12 hours
              },
            },
          },
          {
            // Cache business subcategories
            urlPattern: /\/rest\/v1\/business_subcategories/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "business-subcategories-cache",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 12,
              },
            },
          },
          {
            // Cache images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
