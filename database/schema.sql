-- Database Schema for Finance Tracker
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID,
  settings JSONB DEFAULT '{"currency": "USD", "date_format": "YYYY-MM-DD", "notifications_enabled": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Members table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  currency_code TEXT DEFAULT 'USD',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  custom_data JSONB,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_project ON public.categories(project_id);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(project_id, "order");
CREATE INDEX IF NOT EXISTS idx_transactions_project ON public.transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_currency ON public.transactions(project_id, currency_code);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON public.transactions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_by ON public.transactions(deleted_by);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create a function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create or replace function for new project owners
CREATE OR REPLACE FUNCTION public.handle_new_project_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger to create project owner membership on project creation
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project_owner();

-- Security definer function to check project membership without recursion
CREATE OR REPLACE FUNCTION public.is_project_member(p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Returns true if the current user owns the given project
CREATE OR REPLACE FUNCTION public.is_project_owner(p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_id AND owner_id = auth.uid()
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

-- Soft delete functions for transactions
CREATE OR REPLACE FUNCTION public.soft_delete_transaction(transaction_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.transactions t
  SET
    deleted_at = NOW(),
    deleted_by = auth.uid()
  WHERE t.id = transaction_id
  AND t.deleted_at IS NULL
  AND (
    t.created_by = auth.uid()
    OR public.is_project_owner(t.project_id)
    OR public.is_project_member_with_role(t.project_id, ARRAY['owner'])
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.restore_transaction(transaction_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.transactions t
  SET
    deleted_at = NULL,
    deleted_by = NULL
  WHERE t.id = transaction_id
    AND t.deleted_at IS NOT NULL
    AND (public.is_project_owner(project_id) OR public.is_project_member_with_role(project_id, ARRAY['admin']))

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_transactions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.transactions
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '1 year';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.permanently_delete_transaction(transaction_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.transactions t
  WHERE t.id = transaction_id
    AND t.deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = t.project_id
        AND p.owner_id = auth.uid()
    );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- RLS Policies

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

DROP POLICY IF EXISTS "Members can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Owners and members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete own projects" ON public.projects;

DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can insert members" ON public.project_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.project_members;
DROP POLICY IF EXISTS "Anyone with valid invitation can join project" ON public.project_members;

DROP POLICY IF EXISTS "Members can view project categories" ON public.categories;
DROP POLICY IF EXISTS "Members can insert categories" ON public.categories;

DROP POLICY IF EXISTS "Members can view project transactions" ON public.transactions;
DROP POLICY IF EXISTS "Members and owners can insert transactions" ON public.transactions;

DROP POLICY IF EXISTS "Owners can view project invitations" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can update invitation status to accepted" ON public.invitations;
DROP POLICY IF EXISTS "Owners can insert invitations" ON public.invitations;
DROP POLICY IF EXISTS "Owners can delete invitations" ON public.invitations;

-- Profiles: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profiles: Allow inserts (for the trigger and new user signup)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- Projects: Owners and members can view projects
CREATE POLICY "Owners and members can view projects"
  ON public.projects FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- Projects: Owners can update their projects
CREATE POLICY "Owners can update own projects"
  ON public.projects FOR UPDATE
  USING (
    owner_id = auth.uid()
  );

-- Projects: Owners can delete their projects
CREATE POLICY "Owners can delete own projects"
  ON public.projects FOR DELETE
  USING (
    owner_id = auth.uid()
  );

-- Projects: Users can insert projects (they become owner)
CREATE POLICY "Users can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
  );

-- Project Members: Members can view membership for their projects
CREATE POLICY "Members can view project members"
  ON public.project_members FOR SELECT
  USING (
    public.is_project_member(project_id) OR
    public.is_project_owner(project_id)
  );

-- Project Members: Owners can insert members
-- Project Members: Owners can insert members
-- Note: Duplicate owner checks (is_project_owner + is_project_member_with_role with 'owner')
-- are intentional for defense-in-depth and to tolerate drift between projects.owner_id
-- and project_members.role entries. See is_project_owner and is_project_member_with_role functions.
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

-- Project Members: Owners can update member roles, admins can update non-owner roles
CREATE POLICY "Owners and admins can update member roles with restrictions"
  ON public.project_members FOR UPDATE
  USING (
    -- Owners can update any role
    public.is_project_owner(project_id) OR
    -- Admins can update roles except:
    -- 1. Cannot promote to owner
    -- 2. Cannot change owner members
    -- 3. Cannot change other admins
    (public.is_project_member_with_role(project_id, ARRAY['admin']) AND
     NOT EXISTS (
       -- Target member is not an owner
       SELECT 1 FROM public.project_members AS pm
       WHERE pm.id = project_members.id
       AND pm.role = 'owner'
     ) AND
     NOT EXISTS (
       -- Target member is not another admin
       SELECT 1 FROM public.project_members AS pm
       WHERE pm.id = project_members.id
       AND pm.role = 'admin'
       AND pm.user_id != auth.uid()
     ) AND
     -- Cannot promote to owner
     role != 'owner')
  );

-- Categories: Members can view categories from their projects
CREATE POLICY "Members can view project categories"
  ON public.categories FOR SELECT
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member(project_id)
  );

-- Categories: Members can insert categories
CREATE POLICY "Members can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin', 'member'])
  );

-- Categories: Members can update categories
CREATE POLICY "Members can update categories"
  ON public.categories FOR UPDATE
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin', 'member'])
  );

-- Categories: Members can delete categories
CREATE POLICY "Members can delete categories"
  ON public.categories FOR DELETE
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin', 'member'])
  );

-- Transactions: Members can view active (non-deleted) transactions, owners can view all (including deleted)
CREATE POLICY "Members can view active transactions"
  ON public.transactions FOR SELECT
  USING (
    deleted_at IS NULL AND (
      public.is_project_owner(project_id) OR
      public.is_project_member(project_id)
    )
  );

CREATE POLICY "Owners can view deleted transactions"
  ON public.transactions FOR SELECT
  USING (
    deleted_at IS NOT NULL AND (
      public.is_project_owner(project_id) OR
      public.is_project_member_with_role(project_id, ARRAY['admin'])
    )
  );

-- Transactions: Members can insert transactions (only active)
CREATE POLICY "Members can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    deleted_at IS NULL AND (
      public.is_project_owner(project_id) OR
      public.is_project_member_with_role(project_id, ARRAY['owner', 'admin', 'member'])
    )
  );

-- Transactions: Creators, admins, and owners can update active transactions only
CREATE POLICY "Creators can update own transactions"
  ON public.transactions FOR UPDATE
  USING (
    deleted_at IS NULL AND (
      created_by = auth.uid() OR
      public.is_project_owner(project_id) OR
      public.is_project_member_with_role(project_id, ARRAY['owner', 'admin'])
    )
  );

-- Transactions: Soft delete only (no hard delete through RLS)
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

-- Invitations: Recipients, owners, and members can view invitations
CREATE POLICY "Users can view project invitations"
  ON public.invitations FOR SELECT
  USING (
    -- Recipient can view their own invitation
    email = public.current_user_email() OR
    -- Project owners and members can view
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin', 'member'])
  );

-- Invitations: Recipient or project owners can update
CREATE POLICY "Users can update invitation status to accepted"
  ON public.invitations FOR UPDATE
  USING (
    -- Recipient can update their own invitation
    email = public.current_user_email() OR
    -- Project owners can update
    public.is_project_owner(project_id)
  )
  WITH CHECK (
    -- Only recipient or owner can set status to accepted
    (email = public.current_user_email() OR public.is_project_owner(project_id)) AND
    status = 'accepted'
  );

-- Invitations: Project owners can create invitations
CREATE POLICY "Admins and owners can insert invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    -- Note: is_project_member_with_role check included for redundancy
    -- to handle cases where project.owner_id might differ from project_members entries
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin'])
  );

-- Invitations: Project owners and admins can revoke pending invitations
CREATE POLICY "Admins and owners can delete invitations"
  ON public.invitations FOR DELETE
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin'])
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant execute permissions on soft delete functions
GRANT EXECUTE ON FUNCTION public.soft_delete_transaction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_transaction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.permanently_delete_transaction(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_deleted_transactions() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_deleted_transactions() TO service_role;

-- Enable Realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
