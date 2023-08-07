import '../../enableDevHmr'
import React from 'react'
import ReactDOM from 'react-dom/client'
import renderContent from '../renderContent'
import App from './App'
import '~/style.css'
import { setDockVisible } from './store'

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  switch (message.type) {
    case 'show-dock':
      setDockVisible(true)
      break
    case 'hide-dock':
      setDockVisible(false)
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
