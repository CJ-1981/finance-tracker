import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useSupabase } from './hooks/useSupabase'
import ConfigPage from './pages/ConfigPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import TransactionsPage from './pages/TransactionsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import InvitePage from './pages/InvitePage'

function App() {
  const { user, loading: authLoading } = useAuth()
  const { isConfigured, loading: configLoading } = useSupabase()

  if (authLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirect to config if not configured
  if (!isConfigured) {
    return <ConfigPage />
  }

  // Redirect to landing/login if not authenticated
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

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
