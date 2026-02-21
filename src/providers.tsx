import { useEffect, ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { getConfig, validateConfig } from './lib/config'

// Initialize Supabase from localStorage before any hooks run
let isSupabaseInitialized = false

function initSupabaseFromStorage() {
  if (isSupabaseInitialized) return
  
  try {
    const config = getConfig()
    if (config) {
      const validation = validateConfig(config)
      if (validation.valid) {
        // Import here to avoid circular dependency
        const { createSupabaseClient } = require('./lib/supabase')
        createSupabaseClient(config)
        isSupabaseInitialized = true
      }
    }
  } catch (error) {
    console.error('Failed to initialize Supabase from storage:', error)
  }
}

function SupabaseInitWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    initSupabaseFromStorage()
  }, [])
  
  return <>{children}</>
}

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <BrowserRouter>
      <SupabaseInitWrapper>
        <AuthProvider>
          {children}
        </AuthProvider>
      </SupabaseInitWrapper>
    </BrowserRouter>
  )
}
