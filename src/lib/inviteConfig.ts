// Invite link configuration encoding/decoding
import type { SupabaseConfig } from '../types'
import { validateConfig } from './config'

/**
 * Validate and encode Supabase config for invite link
 * Uses Unicode-safe base64 encoding to obfuscate the credentials
 * Note: This is NOT encryption, just encoding. For production, consider using JWT.
 * @throws Error if config is invalid
 */
export function encodeConfigForInvite(config: SupabaseConfig): string {
  // Validate config before encoding
  const validation = validateConfig(config)
  if (!validation.valid) {
    throw new Error(`Invalid config: ${validation.errors.join(', ')}`)
  }

  const jsonString = JSON.stringify(config)
  // Unicode-safe Base64 encoding for browser environments
  const utf8Bytes = encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g,
    (_match, p1) => String.fromCharCode(parseInt(p1, 16)))
  return btoa(utf8Bytes)
}

/**
 * Decode and validate Supabase config from invite link
 * Uses Unicode-safe base64 decoding
 * @returns Validated config or null if decoding/validation fails
 */
export function decodeConfigFromInvite(encoded: string): SupabaseConfig | null {
  try {
    // Unicode-safe Base64 decoding for browser environments
    const binaryString = atob(encoded)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const decodedString = new TextDecoder().decode(bytes)
    const config = JSON.parse(decodedString) as SupabaseConfig

    // Validate decoded config
    const validation = validateConfig(config)
    if (!validation.valid) {
      console.error('Decoded config validation failed:', validation.errors)
      return null
    }

    return config
  } catch (error) {
    console.error('Failed to decode config from invite:', error)
    return null
  }
}

/**
 * Generate invite link with embedded config
 * Supports both single token and multiple tokens (array)
 * @param baseUrl - The base URL (e.g., window.location.origin)
 * @param token - Single token string or array of tokens
 * @param config - Optional Supabase configuration to embed
 * @param invitePath - Optional invite path (default: '/invite')
 */
export function generateInviteLink(
  baseUrl: string,
  token: string | string[],
  config?: SupabaseConfig,
  invitePath: string = '/invite'
): string {
  // Build invite path using BASE_URL for deployment flexibility
  const basePath = import.meta.env.BASE_URL || ''
  const fullInvitePath = basePath.endsWith('/') ? `${basePath}${invitePath.replace(/^\//, '')}` : `${basePath}/${invitePath.replace(/^\//, '')}`

  // Use URL constructor with base to properly resolve paths
  const url = new URL(fullInvitePath, baseUrl)

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
