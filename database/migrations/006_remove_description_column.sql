-- Migration: Remove description column from transactions table
-- Run this in your Supabase SQL Editor
-- This removes the description column as users can create custom fields instead

-- Note: This will permanently delete all description data!
-- Make sure to export any important data before running this migration.

-- Drop the description column
ALTER TABLE public.transactions DROP COLUMN IF EXISTS description;

-- Verify change
SELECT 'Description column removed from transactions table' as status;

-- Check table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
ORDER BY ordinal_position;
