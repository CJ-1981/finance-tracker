-- Minimal fix: Just add the current_user_email() function
-- Run this if policies already exist and you only need the helper function

-- Add the critical helper function to get current user's email
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Verify the function works
SELECT current_user_email() as your_email;
