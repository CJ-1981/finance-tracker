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
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer')),
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
  description TEXT,
  date DATE NOT NULL,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  custom_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('member', 'viewer')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE sql SECURITY DEFINER;

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

DROP POLICY IF EXISTS "Members can view project categories" ON public.categories;
DROP POLICY IF EXISTS "Members can insert categories" ON public.categories;

DROP POLICY IF EXISTS "Members can view project transactions" ON public.transactions;
DROP POLICY IF EXISTS "Members and owners can insert transactions" ON public.transactions;

DROP POLICY IF EXISTS "Owners can view project invitations" ON public.invitations;
DROP POLICY IF EXISTS "Owners can insert invitations" ON public.invitations;

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
  USING ( public.is_project_member(project_id) );

-- Project Members: Owners can insert members
CREATE POLICY "Owners can insert members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Project Members: Owners can delete members
CREATE POLICY "Owners can delete members"
  ON public.project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Categories: Members can view categories from their projects
CREATE POLICY "Members can view project categories"
  ON public.categories FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- Categories: Members can insert categories
CREATE POLICY "Members can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role IN ('member', 'owner')
    )
  );

-- Transactions: Members can view transactions from their projects
CREATE POLICY "Members can view project transactions"
  ON public.transactions FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- Transactions: Members and owners can insert transactions
CREATE POLICY "Members can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role IN ('member', 'owner')
    )
  );

-- Transactions: Creators and owners can update transactions
CREATE POLICY "Creators can update own transactions"
  ON public.transactions FOR UPDATE
  USING (
    created_by = auth.uid() OR
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Transactions: Creators and owners can delete transactions
CREATE POLICY "Creators can delete own transactions"
  ON public.transactions FOR DELETE
  USING (
    created_by = auth.uid() OR
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Invitations: Owners can view invitations for their projects
CREATE POLICY "Owners can view project invitations"
  ON public.invitations FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Invitations: Owners can insert invitations
CREATE POLICY "Owners can insert invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Enable Realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
