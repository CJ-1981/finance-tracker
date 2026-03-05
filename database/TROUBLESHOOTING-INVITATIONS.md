# Invitation Troubleshooting Guide

## Problem: "Failed to send invitation" Error

If you see a "Failed to send invitation" error when trying to invite team members to a project, follow these steps:

### Step 1: Check the Error Message

The error message will now show details about what went wrong. Common errors:

#### "Permission denied. You must be the project owner to send invitations."
- **Cause**: Your user account is not the project owner
- **Solution**: Only project owners can send invitations. Check the project settings to verify ownership.

#### "An invitation to this email already exists."
- **Cause**: There's already a pending invitation for this email
- **Solution**: Wait for the recipient to accept, or cancel the existing invitation first

#### "Project not found or you do not have access to it."
- **Cause**: The project doesn't exist or you don't have permission
- **Solution**: Verify you're logged in and have access to the project

### Step 2: Verify Database Policies

If you see a generic permission error or "42501" error code, your Supabase database may be missing the RLS policies for invitations.

#### Check if policies exist:

Run this SQL in your Supabase SQL Editor:

```sql
-- Check if RLS is enabled on invitations table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'invitations';

-- Check existing policies on invitations table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'invitations';
```

#### Fix missing policies:

If the policies are missing, re-run the main schema script:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and run the contents of `database/schema.sql`

Or manually run:

```sql
-- Ensure helper function exists
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Create INSERT policy for invitations
DROP POLICY IF EXISTS "Owners can insert invitations" ON public.invitations;
CREATE POLICY "Owners can insert invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  );
```

### Step 3: Verify Helper Functions

The RLS policies depend on these helper functions. Check they exist:

```sql
-- Check if functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name IN (
  'current_user_email',
  'is_project_owner',
  'is_project_member_with_role'
);
```

If any are missing, run the full `database/schema.sql` script in your Supabase SQL Editor.

### Step 4: Test with a Simple Query

After fixing the policies, test with this query (replace with your values):

```sql
-- Test: Can you insert an invitation?
INSERT INTO public.invitations (project_id, email, role, invited_by, token, expires_at)
VALUES (
  '<your-project-id>',
  'test@example.com',
  'member',
  auth.uid(),
  'test-token-' || extract(epoch from now())::text,
  NOW() + INTERVAL '7 days'
);
```

If this succeeds, invitations should work in the app.

### Step 5: Check Browser Console

Open your browser's developer console (F12) to see detailed error logs:
- Look for red error messages in the Console tab
- Check the Network tab for failed API requests
- The error details are now logged with context

### Common Issues

| Issue | Solution |
|-------|----------|
| **42501 Permission denied** | Run the migration script to add RLS policies |
| **404 Not Found** | Check that `base` path is correct in vite.config.ts |
| **Blank page on mobile** | Check translation files exist and load correctly |
| **Invitation link not working** | Verify 404.html exists after build |

### Need More Help?

If the issue persists after following these steps:

1. Check the browser console for specific error codes
2. Verify all database migrations have been run
3. Ensure you're logged in as the project owner
4. Check Supabase logs for database errors

---

**Last Updated**: 2026-03-05
**Related Files**:
- `database/schema.sql` - Full database schema with RLS policies and soft delete functionality
- `src/pages/ProjectDetailPage.tsx` - Invitation creation UI with improved error handling
