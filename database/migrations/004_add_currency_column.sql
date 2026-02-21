-- Migration: Add currency column to transactions table
-- Run this in your Supabase SQL Editor

-- Add the currency column to transactions table (will store currency code like USD, EUR, etc.)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD';

-- Migrate existing data: extract currency from the amount field's display value
-- Note: Since amount is DECIMAL, we'll set a default currency for all existing records
UPDATE public.transactions
SET currency_code = 'USD'
WHERE currency_code IS NULL;

-- Create index on currency for filtering
CREATE INDEX IF NOT EXISTS idx_transactions_currency ON public.transactions(project_id, currency_code);

-- Add comment
COMMENT ON COLUMN public.transactions.currency_code IS 'Currency code (USD, EUR, KRW, etc.) - separate from amount';
