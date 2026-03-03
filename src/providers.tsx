import { ReactNode } from 'react'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <HashRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </HashRouter>
  )
}
