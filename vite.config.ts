import path from 'path'
import webExtension from '@samrum/vite-plugin-web-extension'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { getManifest } from './src/manifest'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  const enableSentryUpload = isProduction && !!process.env.SENTRY_AUTH_TOKEN

  return {
    plugins: [
      react(),
      !process.env.DISABLE_WEBEXTENSION
        ? webExtension({
            manifest: getManifest(),
            useDynamicUrlWebAccessibleResources: false,
            additionalInputs: {
              scripts: ['src/entries/contentScript/primary/main.tsx'],
              html: [
                'src/entries/background/offscreen.html',
                'src/entries/tabs/main.html',
              ],
            },
          })
        : undefined,
      enableSentryUpload
        ? sentryVitePlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: 'maltoze',
            project: 'sgreen',
            sourcemaps: {
              filesToDeleteAfterUpload: ['dist/**/*.map'],
            },
          })
        : undefined,
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
      sourcemap: enableSentryUpload,
    },
  }
})
