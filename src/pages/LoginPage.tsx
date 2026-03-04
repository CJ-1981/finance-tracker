import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isConfigured, setIsConfigured] = useState(true)

  // Helper: navigate to the saved redirect path after login, then clear it
  const navigateAfterLogin = (fallback = '/projects') => {
    const saved = sessionStorage.getItem('redirectAfterLogin')
    if (saved) {
      sessionStorage.removeItem('redirectAfterLogin')
      navigate(saved, { replace: true })
    } else {
      navigate(fallback, { replace: true })
    }
  }

  // Check if user was redirected from invite page
  const inviteToken = location.state?.inviteToken || searchParams.get('token')

  useEffect(() => {
    // Check if Supabase is configured and handle session
    const checkConfig = async () => {
      const { getSupabaseClient } = await import('../lib/supabase')

      // Check if Supabase is configured
      try {
        getSupabaseClient()
        setIsConfigured(true)
      } catch (err) {
        setIsConfigured(false)
        return
      }

      // If user is already logged in and has invite token, redirect to invite
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          if (inviteToken) {
            navigate(`/invite?token=${inviteToken}`)
          } else {
            navigateAfterLogin()
          }
        }
      } catch (err) {
        // Supabase not configured - stay on login page, will redirect on submit
      }
    }
    checkConfig()
  }, [inviteToken, navigate])

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { getSupabaseClient } = await import('../lib/supabase')
      let supabase
      try {
        supabase = getSupabaseClient()
      } catch (configErr) {
        // Supabase not configured
        navigate('/config')
        return
      }

      // Sign in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // After successful login, redirect to saved path or projects
      setTimeout(() => {
        if (inviteToken) {
          navigate(`/invite?token=${inviteToken}`)
        } else {
          navigateAfterLogin()
        }
      }, 100)
    } catch (err: any) {
      const errorMessage = err.message || t('auth.authenticationFailed')
      if (errorMessage.includes('Invalid login credentials')) {
        setError(t('auth.invalidCredentials'))
      } else if (errorMessage.includes('Email not confirmed')) {
        setError(t('auth.emailNotConfirmed'))
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 relative overflow-hidden" data-testid="login-page">
      <div className="absolute top-0 -left-20 w-80 h-80 bg-primary-100/50 dark:bg-primary-900/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-secondary-100/50 dark:bg-secondary-900/20 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t('auth.financialTrackerFull')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {t('auth.welcomeBack')}
          </p>
        </div>

        <div className="card shadow-xl border-t-4 border-t-primary-500" data-testid="login-card">
          {!isConfigured && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 p-4 mb-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('auth.databaseNotConfigured')}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                    {t('auth.configureSupabaseFirst')}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/config')}
                    className="mt-2 w-full btn btn-secondary text-xs py-2"
                  >
                    {t('auth.goToConfiguration')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                data-testid="email-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                data-testid="password-input"
              />
            </div>

            {error && (
              <div className="rounded-md p-4 text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400" data-testid="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-button"
            >
              {loading ? t('common.loading') : t('auth.signIn')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <a
              href="https://supabase.com/dashboard/sign-up"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              data-testid="signup-link"
            >
              {t('auth.needAccount')}
            </a>
          </div>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('auth.securedWithSupabase')}
          </p>
        </div>
      </div>
    </div>
  )
}
