import React from 'react'
import ReactDOM from 'react-dom/client'
import CashCounterPage from './pages/CashCounterPage'
import { FontSizeProvider } from './contexts/FontSizeContext'
import './index.css'

// Initialize i18n directly here to avoid other dependencies
import './lib/i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FontSizeProvider>
      <CashCounterPage />
    </FontSizeProvider>
  </React.StrictMode>,
)
