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

export async function resetSupabaseClient(config?: SupabaseConfig | null) {
  // Clear the instance WITHOUT signing out
  // Signing out clears the session from localStorage, which breaks retries
  // We preserve the session so the new client can recover it immediately
  supabaseInstance = null
  if (typeof window !== 'undefined') {
    delete (window as any).__supabaseInstance
  }

  // If config is provided, create a new client immediately
  if (config) {
    return createSupabaseClient(config)
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

    // Use direct HTTP fetch instead of createClient() to avoid triggering
    // "Multiple GoTrueClient instances detected" warnings. A second GoTrueClient
    // shares the same localStorage key as the main client even with persistSession: false,
    // which causes the warning and can interfere with the auth state.
    //
    // Note: Changed from /rest/v1/ to /auth/v1/health on 2026-03-06
    // due to Supabase deprecation of OpenAPI spec access via anon key.
    // See: https://github.com/orgs/supabase/discussions/42949
    const response = await fetch(`${config.url}/auth/v1/health`, {
      headers: {
        'apikey': config.anonKey,
      }
    })

    // 200 OK          → endpoint reachable, anon key accepted
    // 401 Unauthorized → endpoint reachable, but anon access restricted (still a valid connection)
    // Anything else is likely a network or configuration error
    return response.ok || response.status === 401

  } catch (err) {
    console.error('Connection test failed:', err)
    return false
  }
}

// @MX:NOTE: Soft delete functions for transaction recovery
// These functions call RPC functions created in migration_soft_delete_transactions.sql
// Soft delete marks records as deleted but retains them for 1 year for recovery

/**
 * Soft delete a transaction (marks as deleted, keeps record for 1 year)
 * @param transactionId UUID of the transaction to soft delete
 * @returns Promise<boolean> true if successful, false otherwise
 */
export async function softDeleteTransaction(transactionId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase.rpc('soft_delete_transaction', {
    transaction_id: transactionId
  } as any)

  if (error) {
    console.error('Error soft deleting transaction:', error)
    return false
  }

  return data || false
}

/**
 * Restore a soft-deleted transaction
 * @param transactionId UUID of the transaction to restore
 * @returns Promise<boolean> true if successful, false otherwise
 */
export async function restoreTransaction(transactionId: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc('restore_transaction', {
    transaction_id: transactionId
  } as any)

  if (error) {
    console.error('Error restoring transaction:', error)
    return false
  }

  return data || false
}

/**
 * Permanently delete a transaction (irreversible)
 * @param transactionId UUID of the transaction to permanently delete
 * @returns Promise<boolean> true if successful, false otherwise
 */
export async function permanentlyDeleteTransaction(transactionId: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc('permanently_delete_transaction', {
    transaction_id: transactionId
  } as any)

  if (error) {
    console.error('Error permanently deleting transaction:', error)
    return false
  }

  return data || false
}

/**
 * Cleanup old soft-deleted transactions (older than 1 year)
 * This is typically called via a scheduled job or admin function
 * @returns Promise<number> Number of transactions permanently deleted
 */
export async function cleanupOldDeletedTransactions(): Promise<number> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc('cleanup_old_deleted_transactions')

  if (error) {
    console.error('Error cleaning up old transactions:', error)
    return 0
  }

  return data || 0
}
