import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isConfigured, setIsConfigured] = useState(true)

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
            navigate('/projects')
          }
        }
      } catch (err) {
        // Supabase not configured - stay on login page, will redirect on submit
      }
    }
    checkConfig()
  }, [inviteToken, navigate])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setMessage('')
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

      if (isSignUp) {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + import.meta.env.BASE_URL + 'login'
          }
        })
        if (error) throw error
        setMessage(t('auth.registrationSuccess'))
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        // After successful login, redirect to invite or projects
        setTimeout(() => {
          if (inviteToken) {
            navigate(`/invite?token=${inviteToken}`)
          } else {
            navigate('/projects')
          }
        }, 100)
      }
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-80 h-80 bg-primary-100/50 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-secondary-100/50 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('auth.financialTrackerFull')}</h1>
          <p className="text-slate-500 mt-2 font-medium">
            {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
          </p>
        </div>

        <div className="card shadow-xl border-t-4 border-t-primary-500">
          {!isConfigured && (
            <div className="rounded-md bg-amber-50 p-4 mb-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">{t('auth.databaseNotConfigured')}</p>
                  <p className="text-xs text-amber-700 mt-2">
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="rounded-md p-4 text-sm bg-red-50 text-red-800">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-md p-4 text-sm bg-green-50 text-green-800">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : (isSignUp ? t('auth.signUp') : t('auth.signIn'))}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setMessage('')
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isSignUp ? t('auth.toggleToSignIn') : t('auth.toggleToSignUp')}
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500 text-center">
            {t('auth.securedWithSupabase')}
          </p>
        </div>
      </div>
    </div>
  )
}
