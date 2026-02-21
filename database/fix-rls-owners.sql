-- Fix RLS Policies for Owners
-- Run this in Supabase SQL Editor if you can see projects in the Table Editor
-- but the app shows a 500 error or no projects

-- Drop the old policy that only checks project_members
DROP POLICY IF EXISTS "Members can view own projects" ON public.projects;

-- Create a new policy that allows:
-- 1. Owners to view their own projects
-- 2. Members to view projects they belong to
CREATE POLICY "Owners and members can view projects"
  ON public.projects FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- Also make sure owners can update their projects
DROP POLICY IF EXISTS "Owners can update own projects" ON public.projects;

CREATE POLICY "Owners can update own projects"
  ON public.projects FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Also make sure owners can delete their projects
DROP POLICY IF EXISTS "Owners can delete own projects" ON public.projects;

CREATE POLICY "Owners can delete own projects"
  ON public.projects FOR DELETE
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
