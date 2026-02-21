-- Find your user ID and create profile
-- Run this in Supabase SQL Editor

-- Step 1: Find your user from auth.users
SELECT id, email, raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Copy your user ID from the results above
-- Then replace YOUR_USER_ID below with your actual ID and run:

-- INSERT INTO public.profiles (id, email, name)
-- VALUES ('YOUR_USER_ID', 'your-email@example.com', 'Your Name')
-- ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify the profile was created
-- SELECT * FROM public.profiles WHERE id = 'YOUR_USER_ID';

-- ============================================
-- ALTERNATIVE: If the above doesn't work,
-- temporarily disable RLS, create profile, re-enable
-- ============================================

-- List all users to find your ID
SELECT id, email FROM auth.users;

-- Disable RLS on profiles temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Create profile for your user (replace YOUR_USER_ID)
-- INSERT INTO public.profiles (id, email, name)
-- SELECT id, email, split_part(email, '@', 1)
-- FROM auth.users
-- WHERE id = 'YOUR_USER_ID'
-- ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verify
-- SELECT * FROM public.profiles WHERE id = 'YOUR_USER_ID';
