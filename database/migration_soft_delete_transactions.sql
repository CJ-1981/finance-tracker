-- Migration: Add soft delete functionality to transactions table
-- Run this in your Supabase SQL Editor to enable transaction recovery

-- Add soft delete columns to transactions table
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for efficient querying of soft-deleted transactions
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON public.transactions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_by ON public.transactions(deleted_by);

-- Function to soft delete a transaction
CREATE OR REPLACE FUNCTION public.soft_delete_transaction(transaction_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.transactions t
  SET
    deleted_at = NOW(),
    deleted_by = auth.uid()
  WHERE t.id = transaction_id
    AND t.deleted_at IS NULL
    AND (
      t.created_by = auth.uid()
      OR public.is_project_owner(t.project_id)
      OR public.is_project_member_with_role(t.project_id, ARRAY['owner'])
    );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to restore a soft-deleted transaction
CREATE OR REPLACE FUNCTION public.restore_transaction(transaction_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.transactions t
  SET
    deleted_at = NULL,
    deleted_by = NULL
  WHERE t.id = transaction_id
    AND t.deleted_at IS NOT NULL
    AND public.is_project_owner(t.project_id);

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to permanently delete old soft-deleted transactions (> 1 year)
-- Note: Only accessible by service_role, removes all deleted transactions older than 1 year
CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_transactions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.transactions
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '1 year';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to permanently delete a specific transaction
CREATE OR REPLACE FUNCTION public.permanently_delete_transaction(transaction_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.transactions t
  WHERE t.id = transaction_id
    AND t.deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = t.project_id
        AND p.owner_id = auth.uid()
    );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update RLS policies to handle soft deletes

-- Drop all existing transaction policies first
DROP POLICY IF EXISTS "Members can view project transactions" ON public.transactions;
DROP POLICY IF EXISTS "Members can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Creators can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Creators can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Members can view active transactions" ON public.transactions;
DROP POLICY IF EXISTS "Owners can view deleted transactions" ON public.transactions;
DROP POLICY IF EXISTS "Members can soft delete transactions" ON public.transactions;

-- SELECT: Members can view non-deleted transactions, owners can view all (including deleted)
CREATE POLICY "Members can view active transactions"
  ON public.transactions FOR SELECT
  USING (
    deleted_at IS NULL AND (
      public.is_project_owner(project_id) OR
      public.is_project_member(project_id)
    )
  );

CREATE POLICY "Owners can view deleted transactions"
  ON public.transactions FOR SELECT
  USING (
    deleted_at IS NOT NULL AND
    public.is_project_owner(project_id)
  );

-- INSERT: Members can insert transactions (only active)
CREATE POLICY "Members can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    deleted_at IS NULL AND (
      public.is_project_owner(project_id) OR
      public.is_project_member_with_role(project_id, ARRAY['owner', 'member'])
    )
  );

-- UPDATE: Creators and owners can update active transactions only
CREATE POLICY "Creators can update own transactions"
  ON public.transactions FOR UPDATE
  USING (
    deleted_at IS NULL AND (
      created_by = auth.uid() OR
      public.is_project_owner(project_id) OR
      public.is_project_member_with_role(project_id, ARRAY['owner'])
    )
  );

-- DELETE: Soft delete only (no hard delete through RLS)
CREATE POLICY "Members can soft delete transactions"
  ON public.transactions FOR UPDATE
  USING (
    deleted_at IS NULL AND (
      created_by = auth.uid() OR
      public.is_project_owner(project_id) OR
      public.is_project_member_with_role(project_id, ARRAY['owner'])
    )
  )
  WITH CHECK (
    deleted_at = NOW() AND
    deleted_by = auth.uid()
  );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.soft_delete_transaction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_transaction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.permanently_delete_transaction(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_deleted_transactions() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_deleted_transactions() TO service_role;

-- Verification queries
SELECT
  'Columns added' as status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
  AND column_name IN ('deleted_at', 'deleted_by');

SELECT
  'Functions created' as status,
  routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%transaction%';

SELECT
  'Policies updated' as status,
  policyname
FROM pg_policies
WHERE tablename = 'transactions';
