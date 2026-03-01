-- Migration: Fix invitation permission error
-- Run this if you already ran schema.sql and are getting policy errors

-- Drop old and new policies that might exist
DROP POLICY IF EXISTS "Anyone with valid invitation can join project" ON public.project_members;
DROP POLICY IF EXISTS "Invitees can join project" ON public.project_members;

DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;
DROP POLICY IF EXISTS "Users can view project invitations" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can update invitation status to accepted" ON public.invitations;
DROP POLICY IF EXISTS "Owners can insert invitations" ON public.invitations;
DROP POLICY IF EXISTS "Owners can delete invitations" ON public.invitations;

-- Add the critical helper function if it doesn't exist
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Recreate project_members policies with proper email access
CREATE POLICY "Invitees can join project"
  ON public.project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invitations
      WHERE invitations.project_id = project_id
        AND invitations.email = public.current_user_email()
        AND invitations.status = 'pending'
    )
  );

-- Recreate invitations policies with proper email access
CREATE POLICY "Users can view project invitations"
  ON public.invitations FOR SELECT
  USING (
    email = public.current_user_email() OR
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'member'])
  );

CREATE POLICY "Users can update invitation status to accepted"
  ON public.invitations FOR UPDATE
  USING (
    email = public.current_user_email() OR
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  )
  WITH CHECK (status = 'accepted');

CREATE POLICY "Owners can insert invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  );

CREATE POLICY "Owners can delete invitations"
  ON public.invitations FOR DELETE
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  );

-- Verify the function was created
SELECT
  current_user_email() as user_email,
  is_project_owner(id) as owner_check
FROM public.projects
LIMIT 1;
