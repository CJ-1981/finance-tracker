// Initialize config from invite URL parameters BEFORE React renders
// This must be imported early in the app bootstrap

import { saveConfig } from './config'
import { createSupabaseClient } from './supabase'
import { decodeConfigFromInvite } from './inviteConfig'

export function initializeInviteConfig() {
  try {
    // Check if we're on an invite page with config
    const urlParams = new URLSearchParams(window.location.search)
    const configParam = urlParams.get('config')

    if (configParam) {
      console.log('Found config in URL parameters, applying...')
      const config = decodeConfigFromInvite(configParam)

      if (config) {
        saveConfig(config)
        createSupabaseClient(config)
        console.log('Config from invite link applied successfully')

        // Clean URL to remove config parameter (optional, for cleaner URL)
        urlParams.delete('config')
        const cleanUrl = urlParams.toString()
        if (cleanUrl) {
          window.history.replaceState({}, '', `${window.location.pathname}?${cleanUrl}`)
        } else {
          window.history.replaceState({}, '', window.location.pathname)
        }

        return true
      }
    }
  } catch (error) {
    console.error('Failed to initialize config from invite URL:', error)
  }
  return false
}

// Initialize immediately when module loads
initializeInviteConfig()
