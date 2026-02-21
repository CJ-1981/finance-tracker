import { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <BrowserRouter basename="/finance-tracker">
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  )
}
