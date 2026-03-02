-- Migration: Make invitations.expires_at nullable
-- This supports the removal of invitation expiration feature
-- Run this in your Supabase SQL Editor

-- Make expires_at column nullable
ALTER TABLE public.invitations ALTER COLUMN expires_at DROP NOT NULL;

-- Set existing NULL values to a far future date (for backward compatibility)
UPDATE public.invitations
SET expires_at = NOW() + INTERVAL '100 years'
WHERE expires_at IS NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'expires_at';
