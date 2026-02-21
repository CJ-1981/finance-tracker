-- Add a custom_data JSONB column to transactions to store dynamic field values
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}';
