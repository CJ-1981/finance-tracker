// Invite link configuration encoding/decoding
import type { SupabaseConfig } from '../types'

/**
 * Encode Supabase config for invite link
 * Uses base64 encoding to obfuscate the credentials
 * Note: This is NOT encryption, just encoding. For production, consider using JWT.
 */
export function encodeConfigForInvite(config: SupabaseConfig): string {
  const jsonString = JSON.stringify(config)
  return btoa(jsonString)
}

/**
 * Decode Supabase config from invite link
 */
export function decodeConfigFromInvite(encoded: string): SupabaseConfig | null {
  try {
    const jsonString = atob(encoded)
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Failed to decode config from invite:', error)
    return null
  }
}

/**
 * Generate invite link with embedded config
 * Supports both single token and multiple tokens (array)
 */
export function generateInviteLink(
  baseUrl: string,
  token: string | string[],
  config?: SupabaseConfig
): string {
  const url = new URL(baseUrl)
  url.pathname = '/finance-tracker/invite'

  // Handle single token or multiple tokens
  if (Array.isArray(token)) {
    url.searchParams.set('tokens', token.join(','))
  } else {
    url.searchParams.set('token', token)
  }

  if (config) {
    const encodedConfig = encodeConfigForInvite(config)
    url.searchParams.set('config', encodedConfig)
  }

  return url.toString()
}
