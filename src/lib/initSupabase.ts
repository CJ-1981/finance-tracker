// Initialize Supabase immediately when this module loads
// This must be imported before any component that uses Supabase

import { getConfig, validateConfig } from './config'
import { createSupabaseClient } from './supabase'

export function initializeSupabase() {
  // Skip initialization if we're on the public cash counter route
  // This check runs at module load time before React renders
  if (typeof window !== 'undefined' && window.location.pathname === '/cashcounter') {
    console.log('Skipping Supabase initialization for public cash counter route')
    return false
  }

  try {
    const config = getConfig()
    if (config) {
      // Only log sensitive info in development
      if (import.meta.env.DEV) {
        console.log('Found stored config:', config.url?.substring(0, 20) + '...')
      } else {
        console.log('Stored config found')
      }

      const validation = validateConfig(config)
      if (validation.valid) {
        createSupabaseClient(config)
        console.log('Supabase client initialized successfully')
        return true
      } else {
        // Only log validation errors in development
        if (import.meta.env.DEV) {
          console.warn('Stored config validation failed:', validation.errors)
        } else {
          console.warn('Stored config validation failed')
        }
      }
    } else {
      console.log('No stored config found')
    }
  } catch (error) {
    console.error('Failed to initialize Supabase')
    if (import.meta.env.DEV) {
      console.error('Details:', error)
    }
  }
  return false
}

// Initialize immediately (but skip on cash counter route)
initializeSupabase()
