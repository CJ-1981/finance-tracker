-- Fix: Create your profile manually
-- Run this in Supabase SQL Editor

-- First, let's see what auth.uid() returns (to verify you're logged in)
SELECT
  auth.uid() as user_id,
  current_user,
  current_setting('request.jwt.claim.sub', true) as jwt_sub;

-- Check if profile exists
SELECT * FROM public.profiles WHERE id = auth.uid();

-- Insert your profile (will use your actual user ID from auth.uid())
-- This will create a profile with placeholder data that you can update later
INSERT INTO public.profiles (id, email, name)
SELECT
  auth.uid(),
  COALESCE(
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'user@example.com'
  ),
  COALESCE(
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth.uid()),
    'User',
    split_part((SELECT email FROM auth.users WHERE id = auth.uid()), '@', 1)
  )
ON CONFLICT (id) DO NOTHING;

-- Verify profile was created
SELECT * FROM public.profiles WHERE id = auth.uid();

-- Now try the projects query
SELECT id, name, owner_id FROM public.projects WHERE owner_id = auth.uid();
