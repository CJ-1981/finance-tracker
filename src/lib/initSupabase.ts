// Initialize Supabase immediately when this module loads
// This must be imported before any component that uses Supabase

import { getConfig, validateConfig } from './config'
import { createSupabaseClient } from './supabase'

export function initializeSupabase() {
  try {
    const config = getConfig()
    if (config) {
      const validation = validateConfig(config)
      if (validation.valid) {
        createSupabaseClient(config)
        return true
      }
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error)
  }
  return false
}

// Initialize immediately
initializeSupabase()
