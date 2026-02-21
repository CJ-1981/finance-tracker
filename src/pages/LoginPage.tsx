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
            navigate('/dashboard')
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
    setLoading(true)

    try {
      const { getSupabaseClient } = await import('../lib/supabase')
      const supabase = getSupabaseClient()

      if (isSignUp) {
        // Sign up
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        if (data.user && !data.session) {
          // Email confirmation required
          setError('Please check your email for a confirmation link.')
        } else {
          setError('Account created! You can now sign in.')
          setIsSignUp(false)
        }
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // After successful login, redirect to invite or dashboard
        // The auth state change will trigger a redirect, but we can use navigate to be explicit
        setTimeout(() => {
          if (inviteToken) {
            navigate(`/invite?token=${inviteToken}`)
          }
          // Otherwise, let the auth state change handle the redirect
        }, 100)
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finance Tracker</h1>
          <p className="text-gray-600 mt-2">
            {isSignUp ? 'Create an account' : 'Sign in to continue'}
          </p>
        </div>

        <div className="card">
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className={`rounded-md p-4 text-sm ${
                error.includes('check your email')
                  ? 'bg-blue-50 text-blue-800'
                  : 'bg-red-50 text-red-800'
              }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          {/* Toggle Sign In/Sign Up */}
          <p className="mt-4 text-center text-sm text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          <p className="mt-2 text-xs text-gray-500 text-center">
            Your data is secured with Supabase Auth
          </p>
        </div>
      </div>
    </div>
  )
}
