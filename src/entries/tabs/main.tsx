import '../enableDevHmr'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../../style.css'

if (import.meta.env.MODE === 'production') {
  void import('@sentry/react').then(({ init }) =>
    init({
      dsn: 'https://d12dd277a192c6ca69ba59ebb958e6e2@o82598.ingest.sentry.io/4505787043479552',
    }),
  )
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
