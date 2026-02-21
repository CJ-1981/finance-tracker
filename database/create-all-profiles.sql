-- One-click fix: Create profiles for all existing users
-- Run this in Supabase SQL Editor

-- Step 1: Temporarily disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Create profiles for all users that don't have one
INSERT INTO public.profiles (id, email, name)
SELECT
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  )
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Step 3: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify
SELECT * FROM public.profiles;

-- Expected: You should see your user profile in the results
