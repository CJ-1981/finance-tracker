-- Migration: Automatic invitation cleanup and management
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- Function: Mark expired invitations as 'expired'
-- This function should be called periodically or triggered manually
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Mark pending invitations that have expired as 'expired'
  UPDATE public.invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW()
    AND accepted_at IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.mark_expired_invitations() TO authenticated;

-- ============================================================================
-- Function: Clean up old expired/accepted invitations (older than 30 days)
-- Call this periodically to keep the invitations table clean
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_invitations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete invitations that are expired or accepted and older than 30 days
  DELETE FROM public.invitations
  WHERE (
    (status = 'expired' AND created_at < NOW() - INTERVAL '30 days')
    OR
    (status = 'accepted' AND created_at < NOW() - INTERVAL '30 days')
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.cleanup_old_invitations() TO authenticated;

-- ============================================================================
-- Optional: Create a scheduled job (requires pg_cron extension)
-- This will automatically mark expired invitations daily
-- ============================================================================

-- Enable pg_cron extension (if available)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup job to run daily at 2 AM
-- SELECT cron.schedule(
--   'mark-expired-invitations',
--   '0 2 * * *',
--   'SELECT public.mark_expired_invitations();'
-- );

-- Schedule the cleanup job to run weekly on Sunday at 3 AM
-- SELECT cron.schedule(
--   'cleanup-old-invitations',
--   '0 3 * * 0',
--   'SELECT public.cleanup_old_invitations();'
-- );

-- ============================================================================
-- Usage instructions
-- ============================================================================

-- To manually mark expired invitations:
-- SELECT public.mark_expired_invitations();

-- To manually clean up old invitations:
-- SELECT public.cleanup_old_invitations();

-- To check invitation status:
-- SELECT
--   status,
--   COUNT(*),
--   COUNT(*) FILTER (WHERE expires_at < NOW()) AS expired_count
-- FROM public.invitations
-- GROUP BY status;
