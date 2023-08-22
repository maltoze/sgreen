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
      webExtension({
        manifest: getManifest(),
        additionalInputs: {
          html: [
            'src/entries/background/offscreen.html',
            'src/entries/tabs/main.html',
            'src/entries/tabs/content.html',
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 4173,
    }
  }
})
