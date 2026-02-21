-- Diagnostic Queries - Run these to debug the 500 error

-- 1. Check if you're authenticated
SELECT
  auth.uid() as user_id,
  current_user as current_user,
  current_setting('request.jwt.claim.sub', true) as jwt_sub;

-- 2. Check if your profile exists
SELECT * FROM public.profiles WHERE id = auth.uid();

-- 3. Check RLS status on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Check all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Test if you can INSERT a profile (this should work after the fix)
-- Uncomment to test:
-- INSERT INTO public.profiles (id, email, name)
-- SELECT auth.uid(), 'test@example.com', 'Test User'
-- ON CONFLICT (id) DO NOTHING;

-- 6. Try creating a test project (this should work after the fix)
-- Uncomment to test:
-- INSERT INTO public.projects (name, owner_id)
-- VALUES ('Test Project', auth.uid())
-- RETURNING id, name, owner_id;
