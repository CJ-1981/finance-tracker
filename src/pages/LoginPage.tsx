import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Check if user was redirected from invite page
  const inviteToken = location.state?.inviteToken

  useEffect(() => {
    // If user is already logged in and has invite token, redirect to invite
    const checkAuth = async () => {
      try {
        const { getSupabaseClient } = await import('../lib/supabase')
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
        // Ignore auth check errors
      }
    }
    checkAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const { getSupabaseClient } = await import('../lib/supabase')
      const supabase = getSupabaseClient()

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
        setMessage('Registration successful! Please check your email for a confirmation link.')
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
      const errorMessage = err.message || 'Authentication failed'
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('Please confirm your email address. Check your inbox for the confirmation link.')
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial <span className="text-primary-600">Tracker</span></h1>
          <p className="text-slate-500 mt-2 font-medium">
            {isSignUp ? 'Create your new account' : 'Welcome back! Please sign in'}
          </p>
        </div>

        <div className="card shadow-xl border-t-4 border-t-primary-500">
          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
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
                Password
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
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
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
              {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500 text-center">
            Your data is secured with Supabase Auth
          </p>
        </div>
      </div>
    </div>
  )
}
