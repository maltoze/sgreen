import '../../enableDevHmr'
import React from 'react'
import ReactDOM from 'react-dom/client'
import renderContent from '../renderContent'
import App from './App'
import '~/style.css'
import { setIsRecording, setRecordingData, setShowCountdown } from './store'

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  console.log('------', message)
  switch (message.type) {
    case 'start-recording':
      setRecordingData(message.data)
      setShowCountdown(true)
      break
    case 'stop-recording':
      setIsRecording(false)
      break
    default:
      break
  }
})

renderContent(import.meta.PLUGIN_WEB_EXT_CHUNK_CSS_PATHS, (appRoot) => {
  ReactDOM.createRoot(appRoot).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
