import { useEffect, useState } from 'react'
import { createSupabaseClient } from '../lib/supabase'
import { getConfig, validateConfig, saveConfig } from '../lib/config'
import type { SupabaseConfig } from '../types'

export function useSupabase(options?: { skip?: boolean }) {
  const [isConfigured, setIsConfigured] = useState(false)
  const [config, setConfig] = useState<SupabaseConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Skip initialization if requested (for public routes like cash counter)
    if (options?.skip) {
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    // Dead-man fallback: if initialization never completes (network issue, corrupted config, etc.),
    // unblock the UI after 5 seconds and show an error if appropriate.
    const timeoutId = setTimeout(() => {
      if (!cancelled && loading) {
        console.warn('Supabase initialization timed out after 5s — forcing loading to false.')
        const storedConfig = getConfig()
        if (!storedConfig) {
          setError(null) // No config is OK on first visit
        } else {
          setError('Initialization timed out. Please refresh the page.')
        }
        setLoading(false)
      }
    }, 5000)

    try {
      const storedConfig = getConfig()
      if (storedConfig) {
        const validation = validateConfig(storedConfig)
        if (validation.valid) {
          createSupabaseClient(storedConfig)
          if (!cancelled) {
            setConfig(storedConfig)
            setIsConfigured(true)
            setError(null)
          }
        } else {
          // Config is invalid - this shouldn't happen normally
          console.error('Invalid Supabase config found:', validation.errors)
          if (!cancelled) {
            setError('Invalid configuration. Please reconfigure your Supabase settings.')
          }
        }
      }
      // No config is OK on first visit - user will be redirected to /config
    } catch (err) {
      // Catch any unexpected errors during initialization
      console.error('Error initializing Supabase:', err)
      if (!cancelled) {
        setError('Failed to initialize. Please refresh the page.')
      }
    } finally {
      if (!cancelled) {
        clearTimeout(timeoutId)
        setLoading(false)
      }
    }

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [])

  const updateConfig = async (newConfig: SupabaseConfig) => {
    const validation = validateConfig(newConfig)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }

    saveConfig(newConfig)
    createSupabaseClient(newConfig)
    setConfig(newConfig)
    setIsConfigured(true)
    setError(null)
  }

  return {
    isConfigured,
    config,
    loading,
    error,
    updateConfig,
  }
}
