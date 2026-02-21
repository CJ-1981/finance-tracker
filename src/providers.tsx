import { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import App from './App'

// Simple wrapper for Supabase config using localStorage
function SupabaseWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function Providers() {
  return (
    <BrowserRouter>
      <SupabaseWrapper>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SupabaseWrapper>
    </BrowserRouter>
  )
}
