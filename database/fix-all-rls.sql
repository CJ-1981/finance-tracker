-- Complete RLS Fix for Finance Tracker
-- Run this in Supabase SQL Editor to fix all 500 errors

-- ============================================
-- PROFILES TABLE - Allow service to insert
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate with INSERT policy for the trigger
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- IMPORTANT: Allow inserts (for the trigger and user creation)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow service role to insert (for the trigger)
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- ============================================
-- PROJECTS TABLE - Allow owners to view
-- ============================================

DROP POLICY IF EXISTS "Members can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Owners and members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;

CREATE POLICY "Owners and members can view projects"
  ON public.projects FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own projects"
  ON public.projects FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own projects"
  ON public.projects FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================
-- PROJECT_MEMBERS TABLE - Fix circular dep
-- ============================================

DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can insert members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.project_members;

-- Allow viewing project members if you're the owner or a member
CREATE POLICY "Members can view project members"
  ON public.project_members FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE owner_id = auth.uid()
    )
    OR
    user_id = auth.uid()
  );

CREATE POLICY "Owners can insert members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete members"
  ON public.project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- ============================================
-- VERIFY FIXES
-- ============================================

-- Check if your profile exists (run this to verify)
SELECT id, email, name FROM public.profiles WHERE id = auth.uid();

-- Check if you can see projects (run this to verify)
SELECT id, name, owner_id FROM public.projects WHERE owner_id = auth.uid();

-- Check if you can see project_members (run this to verify)
SELECT * FROM public.project_members WHERE user_id = auth.uid();

-- Expected results:
-- - Profile query should return your user record
-- - Projects query should return empty (if no projects) or your projects
-- - Project_members query should return empty (if no projects) or your memberships
