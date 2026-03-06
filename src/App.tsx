import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useSupabase } from './hooks/useSupabase'
import { ThemeProvider } from './contexts/ThemeContext'
import ConfigPage from './pages/ConfigPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import TransactionsPage from './pages/TransactionsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import InvitePage from './pages/InvitePage'
import CashCounterPage from './pages/CashCounterPage'

// Routes that should NOT be saved as redirect targets (public/auth routes)
const PUBLIC_PATHS = ['/', '/login', '/config', '/invite', '/cashcounter']

function App() {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()
  const isPublicRoute = PUBLIC_PATHS.some(p => location.pathname === p || location.hash === `#${p}`)
  // Only load Supabase for authenticated routes (not cash counter)
  const { loading: configLoading, error: configError } = useSupabase({
    skip: location.pathname === '/cashcounter' || location.hash === '#/cashcounter'
  })

  // Show loading spinner during initialization (only for authenticated routes)
  if (!isPublicRoute && (authLoading || configLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show error if initialization failed
  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full mx-4 bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Initialization Error</h3>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">{configError}</p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Save the current path so we can redirect back after login
    // but only if it's a protected route (not a public page)
    const isProtectedPath = !PUBLIC_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))
    if (isProtectedPath && location.pathname !== '/' && location.pathname !== '/login') {
      // Only save redirect if not already on login page to prevent redirect loops
      sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search)
    }

    return (
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/invite" element={<InvitePage />} />
          <Route path="/cashcounter" element={<CashCounterPage />} />
          {/* Redirect to login page so user can sign back in */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ThemeProvider>
    )
  }

  // Show config page if authenticated but explicitly navigating to /config
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/dashboard" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/transactions/:projectId" element={<TransactionsPage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/cashcounter" element={<CashCounterPage />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App
