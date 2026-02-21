-- Migration: Add order field to categories table
-- Run this in your Supabase SQL Editor

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
