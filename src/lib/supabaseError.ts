/**
 * Supabase error utilities
 * Handles common authentication and session errors
 */

export type SupabaseError = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

/**
 * Check if an error is an authentication/session error
 */
export function isAuthError(error: any): error is SupabaseError {
  if (!error) return false

  // Supabase auth error codes
  const authErrorCodes = [
    'PGRST301', // Auth required
    'PGRST302', // Invalid API key
    'JWT expired',
    'Invalid JWT',
  ]

  // Check error code
  if (error.code && authErrorCodes.includes(error.code)) {
    return true
  }

  // Check error message
  const message = error.message || String(error)
  const authErrorPatterns = [
    'JWT',
    'token',
    'expired',
    'unauthorized',
    'authentication',
    'session',
  ]

  return authErrorPatterns.some(pattern =>
    message.toLowerCase().includes(pattern)
  )
}

/**
 * Wrap a Supabase operation with error handling
 * Signs out the user if an auth error is detected
 *
 * @example
 * const { data } = await withAuthError(
 *   supabase.from('projects').select('*'),
 *   signOut
 * )
 */
export async function withAuthError<T>(
  operation: Promise<T>,
  signOut?: () => void
): Promise<{ data?: T; error: Error | null }> {
  try {
    const data = await operation
    return { data, error: null }
  } catch (error: any) {
    // If it's an auth error and we have a signOut function, sign the user out
    if (isAuthError(error) && signOut) {
      console.warn('Auth error detected, signing out:', error)
      // Fire and forget - don't await the signOut
      try {
        signOut()
      } catch (e) {
        console.error('Error during sign out:', e)
      }
      // Use BASE_URL to respect deployment path (e.g., /finance-tracker/)
      const basePath = typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL || '' : ''
      window.location.href = window.location.origin + basePath + 'login'
      return { error: new Error('Session expired. Please sign in again.') }
    }

    // Otherwise, return the error normally
    return {
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

/**
 * Get a user-friendly error message from a Supabase error
 */
export function getErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred'

  if (isAuthError(error)) {
    return 'Your session has expired. Please sign in again.'
  }

  if (error.message) {
    return error.message
  }

  if (error.code) {
    return `Error ${error.code}: Please try again.`
  }

  return 'An error occurred. Please try again.'
}
