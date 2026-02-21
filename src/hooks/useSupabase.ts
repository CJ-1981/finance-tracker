import { useEffect, useState } from 'react'
import { createSupabaseClient } from '../lib/supabase'
import { getConfig, validateConfig, saveConfig } from '../lib/config'
import type { SupabaseConfig } from '../types'

export function useSupabase() {
  const [isConfigured, setIsConfigured] = useState(false)
  const [config, setConfig] = useState<SupabaseConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedConfig = getConfig()
    if (storedConfig) {
      const validation = validateConfig(storedConfig)
      if (validation.valid) {
        createSupabaseClient(storedConfig)
        setConfig(storedConfig)
        setIsConfigured(true)
      }
    }
    setLoading(false)
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
  }

  return {
    isConfigured,
    config,
    loading,
    updateConfig,
  }
}
