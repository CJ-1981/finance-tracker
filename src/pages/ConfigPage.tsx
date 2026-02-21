import { useState } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { testConnection } from '../lib/supabase'
import type { SupabaseConfig } from '../types'

export default function ConfigPage() {
  const { updateConfig } = useSupabase()
  const [config, setConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
  })
  const [errors, setErrors] = useState<string[]>([])
  const [testing, setTesting] = useState(false)

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
        window.location.reload()
      } else {
        setErrors(['Failed to connect to Supabase. Please check your credentials.'])
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Connection failed'])
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finance Tracker</h1>
          <p className="text-gray-600 mt-2">Setup your Supabase configuration</p>
        </div>

        <div className="card">
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
          </form>
        </div>
      </div>
    </div>
  )
}
