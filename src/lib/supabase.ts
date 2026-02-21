import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SupabaseConfig } from '../types'
import type { Database } from '../types/database'

let supabaseInstance: SupabaseClient<Database> | null = null

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
    },
  })

  return supabaseInstance
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    throw new Error('Supabase client not initialized. Call createSupabaseClient first.')
  }
  return supabaseInstance
}

export function resetSupabaseClient() {
  supabaseInstance = null
}

export async function testConnection(config: SupabaseConfig): Promise<boolean> {
  try {
    // Validate URL format
    new URL(config.url)

    // Validate anon key format (should be a JWT)
    if (!config.anonKey || config.anonKey.length < 20) {
      return false
    }

    // Try to create a client (this will fail if credentials are invalid)
    const client = createClient<Database>(config.url, config.anonKey)

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
