import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useSupabase } from './hooks/useSupabase'
import ConfigPage from './pages/ConfigPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import TransactionsPage from './pages/TransactionsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import InvitePage from './pages/InvitePage'

// Routes that should NOT be saved as redirect targets (public/auth routes)
const PUBLIC_PATHS = ['/', '/login', '/config', '/invite']

function App() {
  const { user, loading: authLoading } = useAuth()
  const { loading: configLoading } = useSupabase()
  const location = useLocation()

  if (authLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Save the current path so we can redirect back after login
    // but only if it's a protected route (not a public page)
    const isProtectedPath = !PUBLIC_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))
    if (isProtectedPath && location.pathname !== '/') {
      sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search)
    }

    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/invite" element={<InvitePage />} />
        {/* Redirect to login page so user can sign back in */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Show config page if authenticated but explicitly navigating to /config
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="/dashboard" element={<Navigate to="/projects" replace />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/transactions/:projectId" element={<TransactionsPage />} />
      <Route path="/invite" element={<InvitePage />} />
      <Route path="/config" element={<ConfigPage />} />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}

export default App
