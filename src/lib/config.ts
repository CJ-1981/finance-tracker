import type { SupabaseConfig } from '../types'

const CONFIG_KEY = 'supabase_config'

export function getConfig(): SupabaseConfig | null {
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (!stored) return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function saveConfig(config: SupabaseConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_KEY)
}

export function validateConfig(config: SupabaseConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.url) {
    errors.push('Supabase URL is required')
  } else if (!isValidUrl(config.url)) {
    errors.push('Invalid Supabase URL format')
  }

  if (!config.anonKey) {
    errors.push('Anon key is required')
  } else if (config.anonKey.length < 20) {
    errors.push('Invalid anon key format')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
