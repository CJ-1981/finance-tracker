// Invitation cleanup utilities
import { getSupabaseClient } from './supabase'

/**
 * Mark expired invitations as 'expired' in the database
 * Call this periodically or on app initialization
 */
export async function markExpiredInvitations(): Promise<number> {
  try {
    const supabase = getSupabaseClient()

    // Mark pending invitations that have expired
    const { error } = await (supabase
      .from('invitations') as any)
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .is('accepted_at', null)

    if (error) throw error

    // Return count using a separate query
    const { count } = await (supabase
      .from('invitations') as any)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired')

    return count || 0
  } catch (error) {
    console.error('Error marking expired invitations:', error)
    return 0
  }
}

/**
 * Clean up old invitations (expired/accepted older than 30 days)
 * Call this periodically to keep the invitations table clean
 */
export async function cleanupOldInvitations(): Promise<number> {
  try {
    const supabase = getSupabaseClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Delete expired invitations older than 30 days
    const { error: error1 } = await (supabase
      .from('invitations') as any)
      .delete()
      .eq('status', 'expired')
      .lt('created_at', thirtyDaysAgo)

    if (error1) throw error1

    // Delete accepted invitations older than 30 days
    const { error: error2 } = await (supabase
      .from('invitations') as any)
      .delete()
      .eq('status', 'accepted')
      .lt('created_at', thirtyDaysAgo)

    if (error2) throw error2

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
      .gte('expires_at', new Date().toISOString())
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
