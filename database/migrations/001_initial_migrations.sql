-- Initial Migrations for Finance Tracker
-- Run this in your Supabase SQL Editor
-- This file applies all necessary schema updates for existing databases

-- ============================================================================
-- Migration 1: Add order field to categories table
-- ============================================================================

-- Add the order column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Update existing categories to have sequential order values based on creation time
WITH numbered_categories AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) - 1 as row_num
  FROM public.categories
)
UPDATE public.categories
SET "order" = numbered_categories.row_num
FROM numbered_categories
WHERE public.categories.id = numbered_categories.id;

-- Create index on order for better sorting performance
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(project_id, "order");

COMMENT ON COLUMN public.categories.order IS 'Display order for categories within a project (0-based)';

-- ============================================================================
-- Migration 2: Update invitations table with status tracking
-- ============================================================================

-- Add status column if it doesn't exist
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired'));

-- Add accepted_at column if it doesn't exist
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- Drop the old 'accepted' column if it exists (replaced by status)
ALTER TABLE public.invitations DROP COLUMN IF EXISTS accepted;

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

COMMENT ON COLUMN public.invitations.status IS 'Invitation status: pending, accepted, or expired';
COMMENT ON COLUMN public.invitations.accepted_at IS 'Timestamp when invitation was accepted';

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Verify changes
SELECT 'Categories table updated with order column' as status;
SELECT 'Invitations table updated with status tracking' as status;
