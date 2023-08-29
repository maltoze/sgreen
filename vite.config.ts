import path from 'path'
import webExtension from '@samrum/vite-plugin-web-extension'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { getManifest } from './src/manifest'

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      !process.env.DISABLE_WEBEXTENSION
        ? webExtension({
            manifest: getManifest(),
            additionalInputs: {
              scripts: ['src/entries/contentScript/primary/main.tsx'],
              html: [
                'src/entries/background/offscreen.html',
                'src/entries/tabs/main.html',
              ],
            },
          })
        : undefined,
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: 'maltoze',
        project: 'sgreen',
      }),
    ],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 4173,
    },
    build: {
      sourcemap: true,
    },
  }
})
