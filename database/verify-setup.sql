-- Verification query - run this in Supabase SQL Editor
-- Tell me the results of each query

-- 1. Check if tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check if profiles table has your user
SELECT COUNT(*) as profile_count FROM public.profiles;

-- 3. Check if projects table exists and has any data
SELECT COUNT(*) as project_count FROM public.projects;

-- 4. Check RLS is enabled
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'projects', 'project_members', 'transactions')
ORDER BY tablename;

-- 5. Check what auth.uid() returns (run while logged into the app)
SELECT auth.uid() as current_user_id;
