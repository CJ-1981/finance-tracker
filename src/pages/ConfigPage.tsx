import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabase } from '../hooks/useSupabase'
import { testConnection } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { SupabaseConfig } from '../types'

export default function ConfigPage() {
  const { updateConfig } = useSupabase()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [config, setConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
  })
  const [errors, setErrors] = useState<string[]>([])
  const [testing, setTesting] = useState(false)
  const [mode, setMode] = useState<'configure' | 'signin'>('configure')
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  })
  const [signingIn, setSigningIn] = useState(false)

  // Check if Supabase is already configured
  useEffect(() => {
    const storedConfig = localStorage.getItem('supabase_config')
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig)
        if (parsed.url && parsed.anonKey) {
          setMode('signin')
          setConfig(parsed)
        }
      } catch (e) {
        // Invalid config, stay in configure mode
      }
    }
  }, [])

  // Allow reconfiguration when mode is 'signin' and user clicks to edit
  const handleReconfigure = () => {
    setMode('configure')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors([])

    if (!config.url || !config.anonKey) {
      setErrors(['Please fill in all fields'])
      return
    }

    setTesting(true)

    try {
      const isValid = await testConnection(config)

      if (isValid) {
        await updateConfig(config)
        setMode('signin')
      } else {
        setErrors(['Failed to connect to Supabase. Please check your credentials.'])
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Connection failed'])
    } finally {
      setTesting(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors([])

    if (!signInData.email || !signInData.password) {
      setErrors(['Please fill in all fields'])
      return
    }

    setSigningIn(true)

    try {
      const { error } = await signIn(signInData.email, signInData.password)

      if (error) {
        setErrors([error.message])
      } else {
        navigate('/projects')
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Sign in failed'])
    } finally {
      setSigningIn(false)
    }
  }

  const handleResetConfig = () => {
    localStorage.removeItem('supabase_config')
    setConfig({ url: '', anonKey: '' })
    setMode('configure')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finance Tracker</h1>
          <p className="text-gray-600 mt-2">
            {mode === 'configure' ? 'Setup your Supabase configuration' : 'Sign in to your account'}
          </p>
        </div>

        <div className="card">
          {mode === 'configure' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  Supabase URL
                </label>
                <input
                  id="url"
                  type="url"
                  className="input"
                  placeholder="https://your-project.supabase.co"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="anonKey" className="block text-sm font-medium text-gray-700 mb-2">
                  Anon Key
                </label>
                <input
                  id="anonKey"
                  type="password"
                  className="input"
                  placeholder="your-anon-key-here"
                  value={config.anonKey}
                  onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                  required
                />
              </div>

              {errors.length > 0 && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-800">
                    <ul className="list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={testing}
                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? 'Testing connection...' : 'Save Configuration'}
              </button>

              <div className="text-sm text-gray-500">
                <p className="font-medium mb-2">Where to find these credentials:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to your Supabase project</li>
                  <li> Navigate to Project Settings → API</li>
                  <li>Copy the Project URL and anon public key</li>
                </ol>
              </div>

              {config.url && config.anonKey && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="w-full btn btn-secondary"
                  >
                    Already configured? Sign In
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
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
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  required
                />
              </div>

              {errors.length > 0 && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-800">
                    <ul className="list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={signingIn}
                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signingIn ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <button
                  type="button"
                  onClick={handleReconfigure}
                  className="w-full btn btn-secondary text-sm"
                >
                  Edit Configuration
                </button>
                <button
                  type="button"
                  onClick={handleResetConfig}
                  className="w-full btn btn-secondary text-sm text-red-600 hover:text-red-700"
                >
                  Reset & Clear Configuration
                </button>
                <p className="text-center text-sm text-gray-500">
                  Don't have an account?{' '}
                  <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign up
                  </a>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
