/* eslint-disable import/no-extraneous-dependencies */

import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import robots from './vite-plugins/robots';
import createSvgoPlugin from './vite-plugins/svgo';
import umami from './vite-plugins/umami';

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.md'],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "/src/assets/styles/helpers.scss" as *;',
      },
    },
  },
  define: {
    global: 'globalThis', // without this LightningFS breaks in workers
  },
  plugins: [
    createSvgoPlugin({
      include: 'src/assets/icons/**/*.svg',
      svgo: {
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                convertColors: {
                  currentColor: true,
                },
              },
            },
          },
          {
            name: 'removeAttrs',
            params: {
              attrs: ['id', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
            },
          },
          'sortAttrs',
          'removeDimensions',
          'removeTitle',
          'removeScripts',
        ],
      },
    }),
    vue(),
    umami(),
    robots(),
    VitePWA({
      devOptions: {
        enabled: true,
      },
      // includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'safari-pinned-tab.svg'],
      manifest: {
        background_color: '#f4f3ff',
        description: 'Build Schemas and intuitively manage content in this headless CMS that runs right on your device',
        display: 'standalone',
        icons: [
          {
            src: 'img/icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'img/icons/android-chrome-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'img/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'img/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'img/icons/android-chrome-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        name: 'Mattrbld',
        orientation: 'portrait',
        screenshots: [],
        short_name: 'Mattrbld',
        start_url: '/',
        theme_color: '#6c5ce7',
      },
      manifestFilename: 'manifest.json',
      workbox: {
        globPatterns: ['**/*.{js,jsx,css,html,png,svg,woff,woff2,ico,webp}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 8080,
    host: false,
  },
});
