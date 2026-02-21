-- ============================================
-- STEP 1: Drop all existing policies
-- ============================================

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
DROP POLICY IF EXISTS "Members can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Creators can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Creators can delete own transactions" ON public.transactions;

DROP POLICY IF EXISTS "Owners can view project invitations" ON public.invitations;
DROP POLICY IF EXISTS "Owners can insert invitations" ON public.invitations;

DROP POLICY IF EXISTS "Owners can view audit logs" ON public.audit_logs;

-- ============================================
-- STEP 2: Drop existing trigger
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- Success message
-- ============================================

SELECT 'Schema reset complete! Now run the main schema.sql file.' as message;
