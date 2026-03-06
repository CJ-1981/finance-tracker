-- Migration: Add admin role for project management (SPEC-AUTH-002)
-- Safe to run on existing databases - no data loss
-- This migration only adds a new role value and updates permissions

-- 1. Update project_members.role CHECK constraint to include 'admin'
-- Note: PostgreSQL doesn't support ALTER CONSTRAINT directly, so we drop and recreate
ALTER TABLE public.project_members 
DROP CONSTRAINT project_members_role_check;

ALTER TABLE public.project_members 
ADD CONSTRAINT project_members_role_check 
CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

-- 2. Update restore_transaction function to allow admins
CREATE OR REPLACE FUNCTION public.restore_transaction(transaction_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.transactions t
  SET
    deleted_at = NULL,
    deleted_by = NULL
  WHERE t.id = transaction_id
  AND t.deleted_at IS NOT NULL
  AND (public.is_project_owner(t.project_id) OR public.is_project_member_with_role(project_id, ARRAY['admin']));

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. Update RLS policies to include admin permissions
-- Drop old policies
DROP POLICY IF EXISTS "Owners can insert members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.project_members;
DROP POLICY IF EXISTS "Members can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Members can update categories" ON public.categories;
DROP POLICY IF EXISTS "Members can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Members can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Creators can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Members can soft delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Owners can view deleted transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view project invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can update invitation status to accepted" ON public.invitations;
DROP POLICY IF EXISTS "Owners can insert invitations" ON public.invitations;
DROP POLICY IF EXISTS "Owners can delete invitations" ON public.invitations;

-- Create updated policies with admin permissions
CREATE POLICY "Admins and owners can insert members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "Admins and owners can delete non-admin members"
  ON public.project_members FOR DELETE
  USING (
    public.is_project_owner(project_id) OR
    (public.is_project_member_with_role(project_id, ARRAY['owner', 'admin']) AND
     NOT EXISTS (
       SELECT 1 FROM public.project_members AS pm
       WHERE pm.id = project_members.id
       AND pm.role IN ('owner', 'admin')
     ))
  );

CREATE POLICY "Owners and admins can update member roles with restrictions"
  ON public.project_members FOR UPDATE
  USING (
    public.is_project_owner(project_id) OR
    (public.is_project_member_with_role(project_id, ARRAY['admin']) AND
     NOT EXISTS (
       SELECT 1 FROM public.project_members AS pm
       WHERE pm.id = project_members.id
       AND pm.role = 'owner'
     ) AND
     NOT EXISTS (
       SELECT 1 FROM public.project_members AS pm
       WHERE pm.id = project_members.id
       AND pm.role = 'admin'
       AND pm.user_id != auth.uid()
     ) AND
     role != 'owner')
  );

CREATE POLICY "Members can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin', 'member'])
  );

CREATE POLICY "Members can update categories"
  ON public.categories FOR UPDATE
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin', 'member'])
  );

CREATE POLICY "Members can delete categories"
  ON public.categories FOR DELETE
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin', 'member'])
  );

CREATE POLICY "Members can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    deleted_at IS NULL AND (
      public.is_project_owner(project_id) OR
      public.is_project_member_with_role(project_id, ARRAY['owner', 'admin', 'member'])
    )
  );

CREATE POLICY "Creators can update own transactions"
  ON public.transactions FOR UPDATE
  USING (
    deleted_at IS NULL AND (
      created_by = auth.uid() OR
      public.is_project_owner(project_id) OR
      public.is_project_member_with_role(project_id, ARRAY['owner', 'admin'])
    )
  );

CREATE POLICY "Members can soft delete transactions"
  ON public.transactions FOR UPDATE
  USING (
    deleted_at IS NULL AND (
      created_by = auth.uid() OR
      public.is_project_owner(project_id) OR
      public.is_project_member_with_role(project_id, ARRAY['owner', 'admin'])
    )
  )
  WITH CHECK (
    deleted_at = NOW() AND
    deleted_by = auth.uid()
  );

CREATE POLICY "Owners and admins can view deleted transactions"
  ON public.transactions FOR SELECT
  USING (
    deleted_at IS NOT NULL AND
    (public.is_project_owner(project_id) OR public.is_project_member_with_role(project_id, ARRAY['admin']))
  );

CREATE POLICY "Users can view project invitations"
  ON public.invitations FOR SELECT
  USING (
    email = public.current_user_email() OR
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin', 'member'])
  );

CREATE POLICY "Users can update invitation status to accepted"
  ON public.invitations FOR UPDATE
  USING (
    email = public.current_user_email() OR
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (status = 'accepted');

CREATE POLICY "Admins and owners can insert invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "Admins and owners can delete invitations"
  ON public.invitations FOR DELETE
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin'])
  );
