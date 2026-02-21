import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useSupabase } from './hooks/useSupabase'
import ConfigPage from './pages/ConfigPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import TransactionsPage from './pages/TransactionsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'

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

  // Redirect to login if not authenticated
  if (!user) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/transactions/:projectId" element={<TransactionsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
