import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// GitHub Pages serves project sites under /<repo>/. The deploy workflow sets BASE_PATH.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon-32x32.png', 'apple-touch-icon*.png'],
      manifest: {
        id: base,
        name: 'ALPIN MAP – Outdoor GPS & Wanderkarte',
        short_name: 'ALPIN MAP',
        description:
          'Offline-Navigations-App für Wandern und Bergtouren mit topografischen Karten, GPX-Import/Export, Höhenprofilen und Offline-Karten.',
        lang: 'de',
        dir: 'ltr',
        display: 'standalone',
        display_override: ['standalone', 'fullscreen'],
        orientation: 'any',
        background_color: '#020617',
        theme_color: '#020617',
        categories: ['navigation', 'sports', 'travel'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['**/splash/**'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Elevation lookups: network first, fall back to last known answer offline
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'elevation-api',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          leaflet: ['leaflet'],
          motion: ['motion'],
        },
      },
    },
  },
});
