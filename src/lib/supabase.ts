import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SupabaseConfig } from '../types'
import type { Database } from '../types/database'
import { getConfig, validateConfig } from './config'

// Use a global variable to persist the Supabase instance across HMR reloads in development
const globalRef = (typeof window !== 'undefined' ? window : {}) as any
let supabaseInstance: SupabaseClient<Database> | null = globalRef.__supabaseInstance || null

export function createSupabaseClient(config: SupabaseConfig): SupabaseClient<Database> {
  // Return existing instance if already created with same config
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create new instance
  supabaseInstance = createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      // LockManager handling:
      // - Chrome's LockManager blocks getSession() and INITIAL_SESSION when locks
      //   are held, causing 6-15s hangs. Safari handles this gracefully.
      // - Default: no-op lock (bypass) for single-user personal finance app
      // - Set VITE_SUPABASE_ENABLE_LOCK=true to enable normal LockManager behavior
      // Trade-off with bypass: no cross-tab token-refresh coordination
      ...(import.meta.env.VITE_SUPABASE_ENABLE_LOCK
        ? {}
        : {
            lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn(),
          }
      ),
    } as any,
  })

  // Store in global reference
  if (typeof window !== 'undefined') {
    ; (window as any).__supabaseInstance = supabaseInstance
  }

  return supabaseInstance
}

export function getSupabaseClient(): SupabaseClient<Database> {
  // If instance doesn't exist, try to initialize from localStorage
  if (!supabaseInstance) {
    if (import.meta.env.DEV) {
      console.log('Supabase instance is null, attempting auto-initialization from localStorage...')
    }
    const config = getConfig()
    if (config) {
      if (import.meta.env.DEV) {
        console.log('Found config in localStorage, validating...')
      }
      const validation = validateConfig(config)
      if (validation.valid) {
        if (import.meta.env.DEV) {
          console.log('Config is valid, creating Supabase client...')
        }
        createSupabaseClient(config)
        if (supabaseInstance) {
          if (import.meta.env.DEV) {
            console.log('Supabase client auto-initialized successfully')
          }
          return supabaseInstance
        }
      } else {
        // Only log validation errors in development
        if (import.meta.env.DEV) {
          console.warn('Stored config validation failed:', validation.errors)
        } else {
          console.warn('Stored config validation failed')
        }
      }
    } else {
      if (import.meta.env.DEV) {
        console.log('No config found in localStorage')
      }
    }
    throw new Error('Supabase client not initialized and automatic initialization failed; call createSupabaseClient to initialize explicitly.')
  }
  return supabaseInstance
}

export function resetSupabaseClient() {
  supabaseInstance = null
  if (typeof window !== 'undefined') {
    delete (window as any).__supabaseInstance
  }
}

export async function testConnection(config: SupabaseConfig): Promise<boolean> {
  try {
    // Validate URL format
    new URL(config.url)

    // Validate anon key format (should be a JWT)
    if (!config.anonKey || config.anonKey.length < 20) {
      return false
    }

    // Try to create a temporary client for connection testing
    // We disable auth persistence and refresh to avoid "Multiple GoTrueClient instances" warnings
    // and lock contention with the main client.
    const client = createClient<Database>(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    })

    // Try a simple query that should work even without auth
    // Just checking if Supabase responds
    const { error } = await client
      .from('projects')
      .select('id')
      .limit(1)

    // If error is "relation does not exist", that's OK - it means tables aren't set up yet
    // but the connection works
    if (error?.code === 'PGRST116' || error?.code === '42P01') {
      return true
    }

    // If we got data, connection works
    if (!error) {
      return true
    }

    // Other errors might be RLS-related, let's check if the error mentions auth
    if (error.message?.includes('JWT') || error.message?.includes('auth')) {
      return false // Invalid credentials
    }

    // For any other error, try the endpoint directly
    try {
      const response = await fetch(`${config.url}/rest/v1/`, {
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`
        }
      })
      return response.ok || response.status === 404 // 404 is OK, means endpoint exists
    } catch {
      return false
    }
  } catch (err) {
    console.error('Connection test failed:', err)
    return false
  }
}
