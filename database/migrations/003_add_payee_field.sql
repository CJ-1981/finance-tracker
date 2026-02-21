-- Migration: Add payee/store name field to transactions
-- Run this in your Supabase SQL Editor

-- Add the payee column to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payee TEXT;

-- Create index on payee for better search performance
CREATE INDEX IF NOT EXISTS idx_transactions_payee ON public.transactions(project_id, payee);

-- Add comment
COMMENT ON COLUMN public.transactions.payee IS 'Store or merchant name where the transaction occurred (e.g., Starbucks, Amazon)';
