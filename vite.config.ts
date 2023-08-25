import path from 'path'
import webExtension from '@samrum/vite-plugin-web-extension'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { getManifest } from './src/manifest'

// https://vitejs.dev/config/
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
    ],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 4173,
    },
  }
})
