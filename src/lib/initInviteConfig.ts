// Initialize config from invite URL parameters BEFORE React renders
// This must be imported early in the app bootstrap

import { saveConfig } from './config'
import { createSupabaseClient } from './supabase'
import { decodeConfigFromInvite } from './inviteConfig'

function hasInviteToken(): boolean {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.has('token') || urlParams.has('tokens')
}

function isInviteRoute(): boolean {
  // Check if current path is /invite or ends with /invite
  const path = window.location.pathname
  return path === '/invite' || path.endsWith('/invite')
}

export function initializeInviteConfig() {
  try {
    // Only apply config if we're on an invite route AND have a valid invite token
    if (!isInviteRoute() || !hasInviteToken()) {
      return false
    }

    // Check if we have config in URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const configParam = urlParams.get('config')

    if (configParam) {
      console.log('Invite link contains Supabase configuration, applying...')
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
