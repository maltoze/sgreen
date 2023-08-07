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
      {
        name: 'p',
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
            next()
          })
        },
      },
      webExtension({
        manifest: getManifest(),
        additionalInputs: {
          html: [
            'src/entries/background/offscreen.html',
            'src/entries/tabs/main.html',
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
    build: {
      minify: false,
      sourcemap: true,
    },
  }
})
