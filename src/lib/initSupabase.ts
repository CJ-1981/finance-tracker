// Initialize Supabase immediately when this module loads
// This must be imported before any component that uses Supabase

import { getConfig, validateConfig } from './config'
import { createSupabaseClient } from './supabase'

export function initializeSupabase() {
  try {
    const config = getConfig()
    if (config) {
      console.log('Found stored config:', config.url?.substring(0, 20) + '...')
      const validation = validateConfig(config)
      if (validation.valid) {
        createSupabaseClient(config)
        console.log('Supabase client initialized successfully')
        return true
      } else {
        console.warn('Stored config validation failed:', validation.errors)
      }
    } else {
      console.log('No stored config found in localStorage')
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error)
  }
  return false
}

// Initialize immediately
initializeSupabase()
