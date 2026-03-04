import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSupabase } from '../hooks/useSupabase'
import { testConnection } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../contexts/ThemeContext'
import { decodeConfigFromInvite } from '../lib/inviteConfig'
import type { SupabaseConfig } from '../types'
import versionInfo from '../version.json'
import QRScannerModal from '../components/QRScannerModal'

/**
 * Truncate a string in the middle for security (show prefix...suffix)
 * @param str - String to truncate
 * @param showChars - Number of characters to show on each end
 * @returns Truncated string or original if short enough
 */
function truncateMiddle(str: string | undefined, showChars: number): string {
  if (!str) return 'Not configured'
  if (str.length <= showChars * 2) return str
  return `${str.substring(0, showChars)}...${str.slice(-showChars)}`
}

export default function ConfigPage() {
  const { t } = useTranslation()
  const { updateConfig } = useSupabase()
  const { user, signIn, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [config, setConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
  })
  const [errors, setErrors] = useState<string[]>([])
  const [testing, setTesting] = useState(false)
  const [mode, setMode] = useState<'configure' | 'signin' | 'authenticated'>('configure')
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  })
  const [signingIn, setSigningIn] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [debugPanelEnabled, setDebugPanelEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('debugPanelEnabled') === 'true'
    }
    return false
  })

  const toggleDebugPanel = () => {
    const newValue = !debugPanelEnabled
    setDebugPanelEnabled(newValue)
    if (typeof window !== 'undefined') {
      localStorage.setItem('debugPanelEnabled', String(newValue))
    }
  }

  // Check if Supabase is already configured and if user is authenticated
  useEffect(() => {
    const forceConfigure = searchParams.get('mode') === 'configure'
    const storedConfig = localStorage.getItem('supabase_config')
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig)
        if (parsed.url && parsed.anonKey) {
          setConfig(parsed)
          // Only change mode if not forcing configure mode
          if (!forceConfigure) {
            // If user is already authenticated, show authenticated mode
            if (user) {
              setMode('authenticated')
            } else {
              setMode('signin')
            }
          }
          // If forceConfigure is true, stay in configure mode but load the values
        }
      } catch (e) {
        // Invalid config, stay in configure mode
      }
    }
  }, [user, searchParams])

  // Allow reconfiguration when mode is 'signin' or 'authenticated' and user clicks to edit
  const handleReconfigure = () => {
    setMode('configure')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors([])

    if (!config.url || !config.anonKey) {
      setErrors([t('config.fillAllFields')])
      return
    }

    setTesting(true)

    try {
      const isValid = await testConnection(config)

      if (isValid) {
        await updateConfig(config)

        // Check if this was triggered from an invitation link
        const tokenParam = searchParams.get('token')
        const tokensParam = searchParams.get('tokens')

        if (tokenParam || tokensParam) {
          // Redirect back to invite page with the token
          const params = new URLSearchParams()
          if (tokenParam) params.set('token', tokenParam)
          if (tokensParam) params.set('tokens', tokensParam)
          navigate(`/invite?${params.toString()}`)
          return
        }

        if (user) {
          setMode('authenticated')
        } else {
          setMode('signin')
        }
      } else {
        setErrors([t('config.failedConnection')])
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : t('config.connectionFailed')])
    } finally {
      setTesting(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors([])

    if (!signInData.email || !signInData.password) {
      setErrors([t('config.fillAllFields')])
      return
    }

    setSigningIn(true)

    try {
      const { error } = await signIn(signInData.email, signInData.password)

      if (error) {
        setErrors([error.message])
      } else {
        setMode('authenticated')
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : t('config.signInFailed')])
    } finally {
      setSigningIn(false)
    }
  }

  const handleResetConfig = () => {
    // Only clear localStorage configuration, not the Supabase database
    localStorage.removeItem('supabase_config')
    setConfig({ url: '', anonKey: '' })
    setMode('configure')
  }

  const handleQRScan = useCallback((scannedUrl: string) => {
    try {
      // Parse URL to extract config parameter
      const urlObj = new URL(scannedUrl)
      const configParam = urlObj.searchParams.get('config')

      if (configParam) {
        // Decode config from URL parameter
        const decodedConfig = decodeConfigFromInvite(configParam)
        if (decodedConfig) {
          setConfig(decodedConfig)
          // Show success message
          alert(t('qr.configExtracted'))
        } else {
          alert(t('qr.invalidQR'))
        }
      } else {
        // Check if this is just an invite link without config
        const token = urlObj.searchParams.get('token') || urlObj.searchParams.get('tokens')
        if (token) {
          alert(t('qr.inviteOnly'))
          // Could redirect to invite page here if needed
        } else {
          alert(t('qr.invalidQR'))
        }
      }
    } catch (error) {
      console.error('Failed to process QR code:', error)
      alert(t('qr.invalidQR'))
    }
  }, [t, setConfig])

  const handleCloseQRScanner = useCallback(() => {
    setShowQRScanner(false)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('auth.financialTracker')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {mode === 'configure' ? t('config.setupConfiguration') :
              mode === 'signin' ? t('auth.signInToAccount') :
                t('config.supabaseConfig')}
          </p>
        </div>

        <div className="card">
          {mode === 'configure' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('config.projectUrl')}
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
                <label htmlFor="anonKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('config.anonKey')}
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
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="text-sm text-red-800 dark:text-red-400">
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
                {testing ? t('config.testingConnection') : t('config.saveConfig')}
              </button>

              <button
                type="button"
                onClick={() => setShowQRScanner(true)}
                className="w-full btn btn-secondary"
              >
                {t('qr.scanQR')}
              </button>

              <div className="text-sm text-gray-500 dark:text-gray-400 max-w-full">
                <p className="font-medium mb-2 text-xs sm:text-sm">{t('config.whereToFindCredentials')}</p>
                <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm">
                  <li>{t('config.goToProject')}</li>
                  <li>{t('config.navigateToAPI')}</li>
                  <li>{t('config.copyURLandKey')}</li>
                </ol>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full btn btn-secondary text-sm"
                >
                  {t('config.backToHome')}
                </button>

                {config.url && config.anonKey && !user && (
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="w-full btn btn-secondary"
                  >
                    {t('config.alreadyConfiguredSignIn')}
                  </button>
                )}
              </div>
            </form>
          )}

          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.email')}
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.password')}
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
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="text-sm text-red-800 dark:text-red-400">
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
                {signingIn ? t('common.loading') : t('auth.signIn')}
              </button>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full btn btn-secondary text-sm"
                >
                  {t('config.backToHome')}
                </button>
                <button
                  type="button"
                  onClick={handleReconfigure}
                  className="w-full btn btn-secondary text-sm"
                >
                  {t('config.editConfiguration')}
                </button>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="w-full btn btn-secondary text-sm !text-red-600 dark:!text-red-400 hover:!text-red-700 dark:hover:!text-red-300"
                  >
                    {t('config.clearAppConfig')}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                    {t('config.clearConfigWarning')}
                  </p>
                </div>
              </div>
            </form>
          )}

          {mode === 'authenticated' && (
            <div className="space-y-6">
              <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('config.signedInAs')}</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{user?.email}</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => navigate('/projects')}
                  className="w-full btn btn-primary"
                >
                  {t('config.backToProjectsList')}
                </button>
                <button
                  onClick={handleReconfigure}
                  className="w-full btn btn-secondary"
                >
                  {t('config.editSupabaseConfig')}
                </button>
                <button
                  onClick={toggleDebugPanel}
                  className={`w-full btn ${debugPanelEnabled ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {debugPanelEnabled ? '🐛 Debug Enabled' : '🐛 Enable Debug Panel'}
                </button>
                <button
                  onClick={() => {
                    if (theme === 'light') setTheme('dark')
                    else if (theme === 'dark') setTheme('system')
                    else setTheme('light')
                  }}
                  className="w-full btn btn-secondary"
                >
                  {theme === 'light' ? '🌙 Dark Mode: Off' : theme === 'dark' ? '🌙 Dark Mode: On' : '🌙 Dark Mode: Auto'}
                </button>
                <button
                  onClick={async () => {
                    await signOut()
                    window.location.reload()
                  }}
                  className="w-full btn btn-secondary"
                >
                  {t('auth.signOut')}
                </button>

                <div className="space-y-2">
                  <button
                    onClick={handleResetConfig}
                    className="w-full btn btn-secondary !text-red-600 dark:!text-red-400 hover:!text-red-700 dark:hover:!text-red-300"
                  >
                    {t('config.clearAppConfig')}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                    {t('config.clearConfigWarning')}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-400">
                <p className="font-medium mb-2">{t('config.currentConfiguration')}</p>
                <p className="text-xs">URL: {truncateMiddle(config.url, 30)}</p>
                <p className="text-xs">Key: {truncateMiddle(config.anonKey, 10)}</p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium mb-2">{t('config.appInfo', { defaultValue: 'App Information' })}</p>
                <p className="text-xs">Version: {versionInfo.version}</p>
                <p className="text-xs">Build Time: {new Date(versionInfo.buildTime).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={handleCloseQRScanner}
        onScan={handleQRScan}
        t={t}
        darkMode={theme === 'dark'}
      />
    </div>
  )
}
