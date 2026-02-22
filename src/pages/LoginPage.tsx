import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
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
    setLoading(true)

    try {
      const { getSupabaseClient } = await import('../lib/supabase')
      const supabase = getSupabaseClient()

      // Sign in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // After successful login, redirect to invite or projects
      // The auth state change will trigger a redirect, but we can use navigate to be explicit
      setTimeout(() => {
        if (inviteToken) {
          navigate(`/invite?token=${inviteToken}`)
        } else {
          navigate('/projects')
        }
      }, 100)
    } catch (err: any) {
      const errorMessage = err.message || 'Authentication failed'
      // Provide helpful error messages
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finance Tracker</h1>
          <p className="text-gray-600 mt-2">
            Sign in to your account
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
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className={`rounded-md p-4 text-sm ${
                error.includes('confirm your email')
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
              {loading ? 'Loading...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Don't have an account?</p>
            <ol className="text-left mt-2 space-y-1 text-xs">
              <li>1. Create a Supabase account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">supabase.com</a></li>
              <li>2. Create a new project</li>
              <li>3. Configure this app with your project's URL and anon key</li>
              <li>4. Come back here to sign in</li>
            </ol>
          </div>

          <p className="mt-4 text-xs text-gray-500 text-center">
            Your data is secured with Supabase Auth
          </p>
        </div>
      </div>
    </div>
  )
}
