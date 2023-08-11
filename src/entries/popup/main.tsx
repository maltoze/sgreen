import '../enableDevHmr'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { getCurrentTab, hasOffscreenDocument } from '~/lib/utils'
import App from './App'

async function main() {
  const hasOffscreen = await hasOffscreenDocument()
  if (hasOffscreen) {
    chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen',
    })
    const tab = await getCurrentTab()
    tab.id && chrome.tabs.sendMessage(tab.id, { type: 'stop-recording' })
  } else {
    ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  }
}

main()
