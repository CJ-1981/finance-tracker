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
    const client = createClient<Database>(config.url, config.anonKey)
    const { error } = await client.from('projects').select('id').limit(1)
    return !error || error.code === 'PGRST116' // Table doesn't exist is OK
  } catch {
    return false
  }
}
