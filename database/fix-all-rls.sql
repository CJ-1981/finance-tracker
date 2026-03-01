-- ============================================================
-- COMPLETE RLS FIX - Finance Tracker
-- Solves: 403 Forbidden, infinite recursion (42P17)
-- Run this entire script in your Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- STEP 1: Create SECURITY DEFINER helper functions
-- These run with elevated privileges, bypassing RLS entirely,
-- which is the ONLY safe way to avoid infinite recursion.
-- ============================================================

-- Returns true if the current user owns the given project
CREATE OR REPLACE FUNCTION public.is_project_owner(p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Returns true if the current user is a member of the given project
CREATE OR REPLACE FUNCTION public.is_project_member(p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Returns true if the current user is a member with a specific role
CREATE OR REPLACE FUNCTION public.is_project_member_with_role(p_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_id AND user_id = auth.uid() AND role = ANY(allowed_roles)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Returns the current user's email from auth.users
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';


-- ============================================================
-- STEP 2: PROFILES TABLE
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- ============================================================
-- STEP 3: PROJECTS TABLE
-- Uses is_project_member() security definer to avoid self-referencing recursion
-- ============================================================

DROP POLICY IF EXISTS "Members can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Owners and members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete own projects" ON public.projects;

-- Use the security definer function for the member check to prevent recursion
CREATE POLICY "Owners and members can view projects"
  ON public.projects FOR SELECT
  USING (
    owner_id = auth.uid() OR
    public.is_project_member(id)
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


-- ============================================================
-- STEP 4: PROJECT_MEMBERS TABLE
-- Uses security definer functions to avoid referencing projects with active RLS
-- ============================================================

DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can insert members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.project_members;
DROP POLICY IF EXISTS "Anyone with valid invitation can join project" ON public.project_members;

CREATE POLICY "Members can view project members"
  ON public.project_members FOR SELECT
  USING (
    public.is_project_member(project_id) OR
    public.is_project_owner(project_id)
  );

CREATE POLICY "Owners can insert members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  );
-- Note: Duplicate owner checks (is_project_owner + is_project_member_with_role with 'owner')
-- are intentional for defense-in-depth and to tolerate drift between projects.owner_id
-- and project_members.role entries.

CREATE POLICY "Owners can delete members"
  ON public.project_members FOR DELETE
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  );

-- Invitees can insert themselves when they have a valid pending invitation
CREATE POLICY "Invitees can join project"
  ON public.project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.invitations AS inv
      WHERE inv.project_id = project_members.project_id
        AND inv.email = public.current_user_email()
        AND inv.status = 'pending'
    )
  );


-- ============================================================
-- STEP 5: CATEGORIES TABLE
-- ============================================================

DROP POLICY IF EXISTS "Members can view project categories" ON public.categories;
DROP POLICY IF EXISTS "Members can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Members can update categories" ON public.categories;
DROP POLICY IF EXISTS "Members can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Owners and members can view categories" ON public.categories;
DROP POLICY IF EXISTS "Owners and members can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Owners and members can update categories" ON public.categories;
DROP POLICY IF EXISTS "Owners and members can delete categories" ON public.categories;

CREATE POLICY "Members can view project categories"
  ON public.categories FOR SELECT
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member(project_id)
  );

CREATE POLICY "Members can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['member', 'owner'])
  );

CREATE POLICY "Members can update categories"
  ON public.categories FOR UPDATE
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['member', 'owner'])
  );

CREATE POLICY "Members can delete categories"
  ON public.categories FOR DELETE
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['member', 'owner'])
  );


-- ============================================================
-- STEP 6: TRANSACTIONS TABLE
-- ============================================================

DROP POLICY IF EXISTS "Members can view project transactions" ON public.transactions;
DROP POLICY IF EXISTS "Members can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Members and owners can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Creators can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Creators can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Owners and members can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Owners and members can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Creators and owners can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Creators and owners can delete transactions" ON public.transactions;

CREATE POLICY "Members can view project transactions"
  ON public.transactions FOR SELECT
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member(project_id)
  );

CREATE POLICY "Members can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['member', 'owner'])
  );

CREATE POLICY "Creators can update own transactions"
  ON public.transactions FOR UPDATE
  USING (
    created_by = auth.uid() OR
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  );

CREATE POLICY "Creators can delete own transactions"
  ON public.transactions FOR DELETE
  USING (
    created_by = auth.uid() OR
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  );


-- ============================================================
-- STEP 7: INVITATIONS TABLE
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can update invitation status to accepted" ON public.invitations;
DROP POLICY IF EXISTS "Owners can insert invitations" ON public.invitations;
DROP POLICY IF EXISTS "Owners can view project invitations" ON public.invitations;
DROP POLICY IF EXISTS "Owners can delete invitations" ON public.invitations;

-- SELECT: Allow viewing invitations if you are the recipient, own the project, or are a member
CREATE POLICY "Users can view project invitations"
  ON public.invitations FOR SELECT
  USING (
    -- Recipient can view their own invitation
    email = public.current_user_email() OR
    -- Project owners and members can view
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'member'])
  );

-- UPDATE: Allow invitation recipient to accept, or project owners to update
CREATE POLICY "Users can update invitation status to accepted"
  ON public.invitations FOR UPDATE
  USING (
    -- Recipient can update their own invitation
    email = public.current_user_email() OR
    -- Project owners can update
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  )
  WITH CHECK (status = 'accepted');

-- INSERT: Project owners can create invitations
CREATE POLICY "Owners can insert invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    -- Note: is_project_member_with_role check included for redundancy
    -- to handle cases where project.owner_id might differ from project_members entries
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  );

-- DELETE: Project owners can revoke pending invitations
CREATE POLICY "Owners can delete invitations"
  ON public.invitations FOR DELETE
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  );


-- ============================================================
-- STEP 8: Verify (optional, check output in Results pane)
-- ============================================================

SELECT id, email, name FROM public.profiles WHERE id = auth.uid();
SELECT id, name, owner_id FROM public.projects LIMIT 5;
