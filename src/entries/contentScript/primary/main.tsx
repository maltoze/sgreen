import '../../enableDevHmr'
import React from 'react'
import ReactDOM from 'react-dom/client'
import renderContent from '../renderContent'
import App from './App'
import '~/style.css'
import * as Sentry from '@sentry/react'
import { useStore } from '~/entries/store'

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://d12dd277a192c6ca69ba59ebb958e6e2@o82598.ingest.sentry.io/4505787043479552',
  })
}

chrome.runtime.onMessage.addListener((message, _sener, _sendResponse) => {
  switch (message.type) {
    case 'show-controlbar':
      useStore.setState({ showControlbar: true })
      break
    case 'stop-recording':
      useStore.setState({ isRecording: false })
      break
    default:
      break
  }
})

renderContent(import.meta.PLUGIN_WEB_EXT_CHUNK_CSS_PATHS, (appRoot) => {
  ReactDOM.createRoot(appRoot).render(
    <React.StrictMode>
      <App appRoot={appRoot} />
    </React.StrictMode>
  )
})
