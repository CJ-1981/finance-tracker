import React from 'react'
import ReactDOM from 'react-dom/client'
import { Providers } from './providers'
import App from './App'
import './index.css'

// Initialize Supabase BEFORE any React components render
import './lib/initSupabase'

// Initialize config from invite URL parameters (overrides localStorage)
import './lib/initInviteConfig'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
)
