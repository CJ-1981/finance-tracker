// Invitation cleanup utilities
import { getSupabaseClient } from './supabase'

/**
 * Mark expired invitations as 'expired' in the database
 * NOTE: This function is deprecated since invitations no longer expire.
 * It's kept for backward compatibility but does nothing.
 * @deprecated Invitations no longer expire
 */
export async function markExpiredInvitations(): Promise<number> {
  // No-op since invitations no longer expire
  return 0
}

/**
 * Clean up old accepted invitations (older than 30 days)
 * Call this periodically to keep the invitations table clean
 * NOTE: Expired invitations cleanup removed since invitations no longer expire
 */
export async function cleanupOldInvitations(): Promise<number> {
  try {
    const supabase = getSupabaseClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Delete accepted invitations older than 30 days
    const { error } = await (supabase
      .from('invitations') as any)
      .delete()
      .eq('status', 'accepted')
      .lt('created_at', thirtyDaysAgo)

    if (error) throw error

    return 1 // Success indicator (exact count would require additional queries)
  } catch (error) {
    console.error('Error cleaning up old invitations:', error)
    return 0
  }
}

/**
 * Check if an email already has a pending invitation for a project
 */
export async function getPendingInvitation(
  projectId: string,
  email: string
): Promise<any | null> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await (supabase
      .from('invitations') as any)
      .select('*')
      .eq('project_id', projectId)
      .eq('email', email)
      .eq('status', 'pending')
      // Filter: (expires_at IS NULL) OR (expires_at >= now())
      // This handles both non-expiring invitations and those with expiration
      .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error checking pending invitation:', error)
    return null
  }
}
