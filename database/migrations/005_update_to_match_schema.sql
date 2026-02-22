-- Migration: Update existing database to match main schema.sql
-- Run this in your Supabase SQL Editor if you have an existing database
-- This script updates your database to match the latest schema.sql

-- ============================================================================
-- 1. Add missing columns to categories table
-- ============================================================================

-- Add order column if not exists
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Update existing categories with order values
WITH numbered_categories AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) - 1 as row_num
  FROM public.categories
  WHERE "order" IS NULL
)
UPDATE public.categories
SET "order" = numbered_categories.row_num
FROM numbered_categories
WHERE public.categories.id = numbered_categories.id;

-- ============================================================================
-- 2. Update invitations table with status tracking
-- ============================================================================

-- Add status column if not exists
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired'));

-- Add accepted_at column if not exists
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- Drop old 'accepted' column if it exists (replaced by status)
ALTER TABLE public.invitations DROP COLUMN IF EXISTS accepted;

-- ============================================================================
-- 3. Update transactions table - separate currency from amount
-- ============================================================================

-- Add currency_code column if not exists
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD';

-- Migrate data: copy from old currency field if currency_code is null
UPDATE public.transactions
SET currency_code = currency
WHERE currency_code IS NULL;

-- Add custom_data column for custom fields
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS custom_data JSONB;

-- ============================================================================
-- 4. Create missing indexes
-- ============================================================================

-- Categories order index
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(project_id, "order");

-- Transactions currency index
CREATE INDEX IF NOT EXISTS idx_transactions_currency ON public.transactions(project_id, currency_code);

-- Invitations status index
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Verify changes
SELECT 'Schema updated successfully!' as status;

-- Check table structures
SELECT
  'categories' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'categories'
UNION ALL
SELECT
  'transactions' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
UNION ALL
SELECT
  'invitations' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invitations'
ORDER BY table_name, column_name;
