# SPEC-AUTH-002 Database Schema Test Documentation

This document describes the required database schema changes for the admin role implementation.

## Test Case 1: project_members.role CHECK constraint

**Requirement**: The `project_members` table must accept 'admin' as a valid role.

**Expected Schema**:
```sql
role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
```

**Validation**:
- [x] Line 34 includes 'admin' in CHECK constraint
- [x] Default value remains 'member'
- [x] CHECK constraint includes all four roles: owner, admin, member, viewer
- [x] IMPLEMENTED: Schema updated successfully

## Test Case 2: invitations.role CHECK constraint (NO CHANGE)

**Requirement**: The `invitations` table must NOT accept 'admin' or 'owner' as valid roles.

**Expected Schema**:
```sql
role TEXT NOT NULL CHECK (role IN ('member', 'viewer'))
```

**Validation**:
- [x] Line 73 does NOT include 'admin' in CHECK constraint
- [x] Line 73 does NOT include 'owner' in CHECK constraint
- [x] Only 'member' and 'viewer' are valid invitation roles
- [x] VERIFIED: Schema correctly prevents admin/owner invitations

## Verification Steps

To verify the schema changes:

1. Read `/Users/chimin/Documents/script/finance-tracker/database/schema.sql`
2. Check line 34 for `project_members.role` CHECK constraint
3. Check line 73 for `invitations.role` CHECK constraint
4. Verify the constraints match the expected schema above

## Expected Behavior

- Admins can be added to project_members table
- Admins cannot be directly invited (must be promoted from member)
- All four roles (owner, admin, member, viewer) are valid for project_members
- Only two roles (member, viewer) are valid for invitations
