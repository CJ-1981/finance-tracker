-- Add missing RLS policies for categories
-- Run this in your Supabase SQL Editor

-- 1. Add UPDATE policy for categories
DROP POLICY IF EXISTS "Members can update categories" ON public.categories;
CREATE POLICY "Members can update categories"
  ON public.categories FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role IN ('member', 'owner')
    )
  );

-- 2. Add DELETE policy for categories
DROP POLICY IF EXISTS "Members can delete categories" ON public.categories;
CREATE POLICY "Members can delete categories"
  ON public.categories FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role IN ('member', 'owner')
    )
  );
