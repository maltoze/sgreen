import '../../enableDevHmr'
import React from 'react'
import ReactDOM from 'react-dom/client'
import renderContent from '../renderContent'
import App from './App'
import '~/style.css'
import {
  setIsRecording,
  setRecordingData,
  setShowCountdown,
  setTabId,
} from './store'

chrome.runtime.sendMessage({
  type: 'request-tab-id',
  target: 'background',
})

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  switch (message.type) {
    case 'start-recording':
      setIsRecording(true)
      setRecordingData(message.data)
      setShowCountdown(true)
      break
    case 'stop-recording':
      setIsRecording(false)
      break
    case 'response-tab-id':
      setTabId(message.tabId)
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
