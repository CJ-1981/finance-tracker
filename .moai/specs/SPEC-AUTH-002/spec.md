---
SPEC_ID: SPEC-AUTH-002
TITLE: Admin Role for Project Management
DOMAIN: AUTH
PRIORITY: Medium
STATUS: Draft
CREATED: 2026-03-05
UPDATED: 2026-03-05
ISSUE:
---

# TAG BLOCK

**SPEC_ID:** SPEC-AUTH-002
**TITLE:** Admin Role for Project Management
**DOMAIN:** AUTH
**PRIORITY:** Medium
**STATUS:** Draft
**CREATED:** 2026-03-05
**ISSUE:**

---

# Environment

## Project Context

**Application:** Financial Tracking Web Application
**Purpose:** Project-based financial collaboration with role-based access control
**Current Roles:** owner (highest authority), member (standard access), viewer (read-only)

**Target Users:** Teams requiring financial management with hierarchical permissions
**Key Value:** Real-time collaboration with proper access controls for team management

## Browser Environment

**Supported Browsers:** Modern browsers with ES6+ support
**Platform:** Web-based responsive application
**Authentication:** Supabase Auth with row-level security

## Development Environment

**Frontend:** React 19.2.4 with TypeScript 5.9
**Backend:** Supabase 2.97.0 (PostgreSQL 16 with RLS)
**Type Safety:** End-to-end TypeScript types from database schema
**State Management:** React hooks with Supabase real-time subscriptions

---

# Assumptions

1. **Two-Tier Ownership System:** The system distinguishes between `projects.owner_id` (database owner) and `project_members.role = 'owner'` (role-based owner), with the former having ultimate authority for project lifecycle operations.

2. **Defense-in-Depth Pattern:** Current RLS policies use both `is_project_owner()` and `is_project_member_with_role(ARRAY['owner'])` checks to tolerate potential drift between `projects.owner_id` and `project_members.role` entries.

3. **Admin Role Scope:** Admin users should have owner-like permissions for day-to-day operations (member management, category management, transaction management) but NOT project lifecycle operations (delete project, transfer ownership, permanent deletion).

4. **Invitation Constraints:** Current system only allows inviting users as 'member' or 'viewer', not as 'owner'. Admin role should follow similar pattern - users cannot be directly invited as 'admin'.

5. **Role Hierarchy:** The role hierarchy is: owner > admin > member > viewer. Admins cannot promote themselves to owner, cannot demote owners, and cannot manage other admins (to prevent circular permission issues).

6. **Database-Driven Security:** All permission checks are enforced at the database level through RLS policies, with frontend permission checks serving only for UI optimization (not security enforcement).

7. **Type System Consistency:** TypeScript types must be kept in sync with database CHECK constraints to prevent type mismatches at compile time.

---

# Requirements (EARS Format)

## Ubiquitous Requirements

**UR-AUTH-001:** The system SHALL validate all role changes against database CHECK constraints to prevent invalid role assignments.

**UR-AUTH-002:** The system SHALL enforce admin permissions through Row-Level Security (RLS) policies at the database level for all data operations.

**UR-AUTH-003:** The system SHALL maintain type safety between TypeScript type definitions and database schema CHECK constraints for role fields.

**UR-AUTH-004:** The system SHALL prevent admins from performing project lifecycle operations (project deletion, ownership transfer, permanent transaction deletion).

**UR-AUTH-005:** The system SHALL log all permission denials with sufficient detail for auditing and troubleshooting access control issues.

## Event-Driven Requirements

### Database Schema Updates

**WHEN** the database schema is migrated, **THEN** the system SHALL update the `project_members.role` CHECK constraint to include 'admin' as a valid role value.

**WHEN** the database schema is migrated, **THEN** the system SHALL maintain the existing `invitations.role` CHECK constraint to only allow 'member' and 'viewer' values (excluding 'admin' and 'owner').

**WHEN** a new project is created, **THEN** the `handle_new_project_owner` trigger SHALL continue to insert only 'owner' role entries (not 'admin').

### RLS Policy Modifications

**WHEN** a user attempts to insert a new project member, **THEN** the system SHALL allow the operation if the current user has 'owner' or 'admin' role.

**WHEN** a user attempts to delete a project member, **THEN** the system SHALL allow the operation if the current user has 'owner' or 'admin' role, EXCEPT when removing members with 'owner' role.

**WHEN** a user attempts to update a project member's role, **THEN** the system SHALL allow the operation if the current user has 'owner' role, OR if the current user has 'admin' role AND the target member is not 'owner' AND the new role is not 'owner'.

**WHEN** a user attempts to insert a category, **THEN** the system SHALL allow the operation if the current user has 'owner', 'admin', or 'member' role.

**WHEN** a user attempts to update or delete a category, **THEN** the system SHALL allow the operation if the current user has 'owner' or 'admin' role.

**WHEN** a user attempts to soft delete a transaction, **THEN** the system SHALL allow the operation if the current user has 'owner', 'admin', or 'member' role AND is the transaction creator, OR if the current user has 'owner' or 'admin' role.

**WHEN** a user attempts to view soft-deleted transactions, **THEN** the system SHALL allow the operation if the current user has 'owner' or 'admin' role.

**WHEN** a user attempts to restore a soft-deleted transaction, **THEN** the system SHALL allow the operation if the current user has 'owner' or 'admin' role.

**WHEN** a user attempts to create an invitation, **THEN** the system SHALL allow the operation if the current user has 'owner' or 'admin' role.

**WHEN** a user attempts to cancel an invitation, **THEN** the system SHALL allow the operation if the current user has 'owner' or 'admin' role.

### Type Definition Updates

**WHEN** TypeScript types are generated from the database schema, **THEN** the system SHALL include 'admin' in all role type unions (`'owner' | 'admin' | 'member' | 'viewer'`).

**WHEN** the `Role` type is referenced in frontend components, **THEN** the compiler SHALL enforce type safety to prevent typos or invalid role comparisons.

### Frontend Permission Checks

**WHEN** the ProjectsPage renders, **THEN** the system SHALL display invitation management controls for users with 'owner' or 'admin' roles.

**WHEN** the TransactionsPage renders, **THEN** the system SHALL display the "View Deleted Transactions" button for users with 'owner' or 'admin' roles.

**WHEN** the TransactionsPage renders, **THEN** the system SHALL enable editing of any transaction (not just own) for users with 'owner' or 'admin' roles.

**WHEN** a user with 'admin' role attempts to access project settings, **THEN** the system SHALL display member management interface with appropriate permission boundaries (cannot manage owners or other admins).

### Edge Cases

**WHEN** the last admin is about to be removed or demoted, **THEN** the system SHALL display a confirmation warning that this action will leave the project without admin access.

**WHEN** an admin attempts to promote themselves to 'owner' role, **THEN** the system SHALL deny the operation with a clear error message.

**WHEN** an admin attempts to change the role of a member with 'owner' role, **THEN** the system SHALL deny the operation with a clear error message.

**WHEN** an admin attempts to manage another admin (change role, remove), **THEN** the system SHALL deny the operation with a clear error message.

**WHEN** a member is promoted to 'admin' role, **THEN** the system SHALL grant them immediate access to admin features without requiring re-authentication.

## State-Driven Requirements

**IF** the current user has 'admin' role, **THEN** the system SHALL allow invitation of new members with 'member' or 'viewer' roles.

**IF** the current user has 'admin' role, **THEN** the system SHALL allow removal of project members EXCEPT those with 'owner' or 'admin' roles.

**IF** the current user has 'admin' role, **THEN** the system SHALL allow role changes for project members EXCEPT to/from 'owner' role AND EXCEPT changing other admins.

**IF** the current user has 'admin' role, **THEN** the system SHALL allow full category management (create, read, update, delete).

**IF** the current user has 'admin' role, **THEN** the system SHALL allow viewing and restoring soft-deleted transactions.

**IF** the current user has 'admin' role, **THEN** the system SHALL allow editing and deleting any transaction regardless of creator.

**IF** the current user has 'owner' or 'admin' role, **THEN** the system SHALL display the "Manage Members" button in project pages.

## Unwanted Requirements

The system SHALL NOT allow admins to delete the project.

The system SHALL NOT allow admins to transfer project ownership.

The system SHALL NOT allow admins to permanently delete transactions (only soft-delete and restore).

The system SHALL NOT allow admins to invite users directly as 'admin' role (must be promoted from 'member').

The system SHALL NOT allow admins to promote themselves to 'owner' role.

The system SHALL NOT allow admins to demote or remove members with 'owner' role.

The system SHALL NOT allow admins to manage other admins (change role, remove) to prevent circular permission conflicts.

The system SHALL NOT allow frontend permission checks to bypass database-level RLS policies.

## Optional Requirements

**WHERE** practical, the system SHOULD provide admin activity logging for audit trails (who promoted whom, when, and why).

**WHERE** practical, the system SHOULD display visual indicators (badges, colors) to distinguish admin users from members in member lists.

**WHERE** practical, the system SHOULD provide role-specific help tooltips explaining admin permissions and limitations.

**WHERE** supported by the UI framework, the system SHOULD implement confirmation dialogs for high-impact admin actions (member removal, role changes).

---

# Specifications

## Database Schema Changes

### File: `database/schema.sql`

**Line 34 - Role Check Constraint:**
```sql
-- BEFORE:
role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer'))

-- AFTER:
role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
```

**Line 73 - Invitation Role Constraint (NO CHANGE):**
```sql
-- REMAINS UNCHANGED - Admins cannot be invited directly:
role TEXT NOT NULL CHECK (role IN ('member', 'viewer'))
```

**Line 348 - Member Insert Policy:**
```sql
-- BEFORE:
CREATE POLICY "Owners can insert members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  );

-- AFTER:
CREATE POLICY "Admins and owners can insert members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin'])
  );
```

**Line 355 - Member Delete Policy:**
```sql
-- BEFORE:
CREATE POLICY "Owners can delete members"
  ON public.project_members FOR DELETE
  USING (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  );

-- AFTER:
CREATE POLICY "Admins and owners can delete non-admin members"
  ON public.project_members FOR DELETE
  USING (
    public.is_project_owner(project_id) OR
    (public.is_project_member_with_role(project_id, ARRAY['owner', 'admin']) AND
     NOT EXISTS (
       SELECT 1 FROM public.project_members AS pm
       WHERE pm.id = project_members.id
       AND pm.role IN ('owner', 'admin')
     ))
  );
```

**Line 384, 392, 400 - Category Policies:**
```sql
-- BEFORE (Lines 384, 392, 400):
ARRAY['owner', 'member']

-- AFTER:
ARRAY['owner', 'admin', 'member']
```

**Line 426 - Transaction Insert Policy:**
```sql
-- BEFORE:
ARRAY['owner', 'member']

-- AFTER:
ARRAY['owner', 'admin', 'member']
```

**Line 437 - Transaction Update Policy:**
```sql
-- BEFORE:
public.is_project_member_with_role(project_id, ARRAY['owner']) OR
(created_by = auth.uid() AND role = 'member')

-- AFTER:
public.is_project_member_with_role(project_id, ARRAY['owner', 'admin']) OR
(created_by = auth.uid() AND role IN ('member', 'admin'))
```

**Line 448 - Soft Delete Transaction Policy:**
```sql
-- BEFORE:
public.is_project_member_with_role(project_id, ARRAY['owner']) OR
(created_by = auth.uid() AND role IN ('member', 'admin'))

-- AFTER:
public.is_project_member_with_role(project_id, ARRAY['owner', 'admin']) OR
(created_by = auth.uid() AND role IN ('member', 'admin'))
```

**Line 486, 494 - Invitation Policies:**
```sql
-- BEFORE:
ARRAY['owner']

-- AFTER:
ARRAY['owner', 'admin']
```

## Type Definition Updates

### File: `src/types/index.ts`

**Line 51 - ProjectMember Interface:**
```typescript
// BEFORE:
export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'member' | 'viewer'
  joined_at: string
}

// AFTER:
export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joined_at: string
}
```

**Line 118 - Role Type:**
```typescript
// BEFORE:
export type Role = 'owner' | 'member' | 'viewer'

// AFTER:
export type Role = 'owner' | 'admin' | 'member' | 'viewer'
```

### File: `src/types/database.ts`

**Lines 97, 104, 111 - Database Types:**
```typescript
// BEFORE:
role: 'owner' | 'member' | 'viewer'

// AFTER:
role: 'owner' | 'admin' | 'member' | 'viewer'
```

## Frontend Component Changes

### UI Design Approach: Extend Existing ProjectDetailPage

**Decision:** Use existing ProjectDetailPage member management interface with admin-aware permission checks. No separate admin page needed.

**Implementation Pattern:**
- Update `owner_id === user?.id` checks to include admin role
- Add `adminMode` prop to MemberManagementPanel component
- Restrict role dropdown based on user role (owner vs admin)
- Hide owner-specific actions from admins via conditional rendering

**Admin UI Restrictions:**
- Role dropdown options: admins see ['member', 'viewer'], owners see ['admin', 'member', 'viewer']
- Cannot remove members with 'owner' or 'admin' role
- "Transfer Ownership" button hidden from admins
- Confirmation dialogs for sensitive actions

**Example Permission Update:**
```typescript
// Helper function to determine if user can manage members
const canManageMembers = (userRole: Role) => ['owner', 'admin'].includes(userRole)

// Conditional rendering
{canManageMembers(userRole) && <MemberManagementPanel {...props} />}
```

### File: `src/pages/ProjectsPage.tsx`

**Line 176 - Role Determination Logic:**
```typescript
// BEFORE:
const userRole = project.owner_id === user.id ? 'owner' : m.role

// AFTER (no change needed - owner_id check takes precedence):
const userRole = project.owner_id === user.id ? 'owner' : m.role
// Note: This logic already handles owner_id correctly, admin roles from project_members will work as-is
```

**Lines 441, 629, 634, 637 - Permission Checks:**
```typescript
// BEFORE:
projects.some(p => p.userRole === 'owner')
if (project.userRole === 'owner')
project.userRole !== 'owner'
project.userRole === 'owner'

// AFTER:
projects.some(p => ['owner', 'admin'].includes(p.userRole))
if (['owner', 'admin'].includes(project.userRole))
!['owner', 'admin'].includes(project.userRole)
['owner', 'admin'].includes(project.userRole)
```

**Line 654 - Translation Key Array:**
```typescript
// BEFORE:
const roleOptions = ['owner', 'member', 'viewer']

// AFTER:
const roleOptions = ['owner', 'admin', 'member', 'viewer']
```

### File: `src/pages/TransactionsPage.tsx`

**Line 453 - Guard Clause:**
```typescript
// BEFORE:
if (!projectId || userRole !== 'owner') return

// AFTER:
if (!projectId || !['owner', 'admin'].includes(userRole)) return
```

**Lines 1149, 1166, 1584, 1609 - Permission Checks:**
```typescript
// BEFORE:
{userRole === 'owner' && (...)}

// AFTER:
{['owner', 'admin'].includes(userRole) && (...)}
```

**Lines 1555, 1759 - Permission Checks with OR Logic:**
```typescript
// BEFORE:
{(userRole === 'owner' || canEditSelected()) && (...)}

// AFTER:
{(['owner', 'admin'].includes(userRole) || canEditSelected()) && (...)}
```

### File: `src/pages/ProjectDetailPage.tsx`

**Lines 1097, 1130 - owner_id Checks:**
```typescript
// BEFORE:
{project?.owner_id === user?.id && (...)}

// AFTER:
{(['owner', 'admin'].includes(userRole) && project) && (...)}
// Note: Need to fetch userRole first similar to TransactionsPage pattern
```

### File: `src/components/TransactionModal.tsx`

**Line 225 - Permission Check:**
```typescript
// BEFORE:
if (userRole === 'owner') {

// AFTER:
if (['owner', 'admin'].includes(userRole)) {
```

## I18n Keys

### File: `src/locales/en.json`

**Add role display names (around lines 45-47):**
```json
{
  "roles": {
    "owner": "Owner",
    "admin": "Admin",
    "member": "Member",
    "viewer": "Viewer"
  },
  "roleDescriptions": {
    "owner": "Full project access including deletion and ownership transfer",
    "admin": "Full management access except project deletion and ownership transfer",
    "member": "Can add and edit transactions",
    "viewer": "Read-only access to transactions and categories"
  }
}
```

**Add permission messages:**
```json
{
  "admin": {
    "cannotManageOwners": "Admins cannot manage project owners",
    "cannotManageOtherAdmins": "Admins cannot manage other admins",
    "cannotPromoteSelf": "Admins cannot promote themselves to owner",
    "lastAdminWarning": "This is the last admin. Removing them will leave the project without admin access.",
    "inviteRestricted": "Admins can only invite members and viewers. To assign admin role, invite as member then promote."
  }
}
```

### File: `src/locales/ko.json`

**Korean translations:**
```json
{
  "roles": {
    "owner": "소유자",
    "admin": "관리자",
    "member": "구성원",
    "viewer": "조회자"
  },
  "roleDescriptions": {
    "owner": "프로젝트 삭제 및 소유권 이전을 포함한 전체 액세스",
    "admin": "프로젝트 삭제 및 소유권 이전을 제외한 전체 관리 권한",
    "member": "트랜잭션 추가 및 편집 가능",
    "viewer": "트랜잭션 및 카테고리 읽기 전용"
  },
  "admin": {
    "cannotManageOwners": "관리자는 소유자를 관리할 수 없습니다",
    "cannotManageOtherAdmins": "관리자는 다른 관리자를 관리할 수 없습니다",
    "cannotPromoteSelf": "관리자는 스스로 소유자로 승격할 수 없습니다",
    "lastAdminWarning": "이 프로젝트의 마지막 관리자입니다. 제거 시 프로젝트에 관리자가 없게 됩니다.",
    "inviteRestricted": "관리자는 구성원과 조회자만 초대할 수 있습니다. 관리자 역할을 할당하려면 구성원으로 초대한 후 승격시키세요."
  }
}
```

## Security Considerations

### RLS Policy Enforcement

**Critical Security Requirement:** All permission checks MUST be enforced at the database level through RLS policies. Frontend permission checks are for UI optimization ONLY and MUST NOT be trusted for security.

**Defense-in-Depth Pattern:** Maintain the existing pattern of dual checks (`is_project_owner()` + `is_project_member_with_role()`) to tolerate potential drift between `projects.owner_id` and `project_members.role` entries.

### Admin Permission Boundaries

**Project Lifecycle Operations:** Admins MUST NOT be able to:
- Delete the project (enforced by `projects` table RLS)
- Transfer ownership (enforced by `projects.owner_id` immutability)
- Permanently delete transactions (enforced by transaction RLS)

**Role Management Boundaries:** Admins MUST NOT be able to:
- Promote themselves to 'owner' role
- Change the role of any 'owner' member
- Remove any 'owner' member
- Change the role of any 'admin' member
- Remove any 'admin' member

### Audit Trail

**Logging Requirements:** Log all admin actions for security audit:
- Member additions (who invited whom)
- Role changes (who changed whose role, from what, to what)
- Member removals (who removed whom)
- Failed permission denials (with context for troubleshooting)

## Error Handling

### Permission Denied Errors

**Error Message Format:**
```typescript
{
  "code": "42501", // PostgreSQL insufficient_privilege
  "message": "Admin permission denied: {action}",
  "details": "Admins cannot {action}. Contact the project owner for assistance.",
  "hint": "User role: admin, Required role: owner"
}
```

**Frontend Error Display:** Show user-friendly error messages from i18n keys, not raw database errors.

### Edge Case Handling

**Last Admin Removal:**
```typescript
// Before removing last admin, show confirmation:
const adminCount = members.filter(m => m.role === 'admin').length
if (member.role === 'admin' && adminCount === 1) {
  if (!confirm(t.admin.lastAdminWarning)) {
    return
  }
}
```

**Self-Demotion Prevention:**
```typescript
// Prevent admin from demoting themselves:
if (member.user_id === currentUserId && member.role === 'admin' && newRole === 'member') {
  alert(t.admin.cannotDemoteSelf)
  return
}
```

## Accessibility Requirements

**Screen Reader Announcements:** Role changes and permission denials MUST be announced to screen readers using ARIA live regions.

**Keyboard Navigation:** All admin controls MUST be accessible via keyboard navigation (Tab, Enter, Escape).

**Color Blindness:** Role indicators MUST NOT rely solely on color (use icons, text labels, or patterns in addition to color).

**Error Messages:** Permission denial messages MUST be conveyed through both visual text and ARIA alerts for screen reader users.

---

# Traceability

## Related Files

### Database Schema
- `database/schema.sql` - Core schema with RLS policies

### Type Definitions
- `src/types/index.ts` - TypeScript type definitions
- `src/types/database.ts` - Database-generated types

### Frontend Components
- `src/pages/ProjectsPage.tsx` - Project listing with member management
- `src/pages/TransactionsPage.tsx` - Transaction management with admin controls
- `src/pages/ProjectDetailPage.tsx` - Project detail with invitation UI
- `src/components/TransactionModal.tsx` - Transaction editing modal

### Localization
- `src/locales/en.json` - English translations
- `src/locales/ko.json` - Korean translations

## Related Components

**Permission Check Pattern:** All components use the `['owner', 'admin'].includes(userRole)` pattern for admin-aware permission checks.

**Role Fetching Pattern:** Components fetch user role from `project_members` table using Supabase queries with timeout pattern (2 seconds).

**Error Display Pattern:** All permission errors use i18n keys for consistent, localized error messages.

---

# Implementation Notes

**Version:** 1.0.1
**Status:** Draft
**Last Updated:** 2026-03-05

## Summary of Changes

This specification defines the implementation of an 'admin' role that sits between 'owner' and 'member' in the permission hierarchy. Admins have owner-like permissions for day-to-day operations (member management, category management, transaction management) but cannot perform project lifecycle operations (delete project, transfer ownership, permanent deletion).

Key changes include:
1. Database schema updates to add 'admin' role to CHECK constraints
2. RLS policy modifications to grant admin permissions with appropriate restrictions
3. TypeScript type definition updates for type safety
4. Frontend permission check updates across all components
5. I18n additions for admin role display names and error messages

## UI Design Decision

**Approach:** Extend existing ProjectDetailPage member management interface with admin-aware permissions. No separate admin page required.

**Implementation:**
- Reuse existing member management UI components
- Add `adminMode` prop to MemberManagementPanel for role-based restrictions
- Update permission checks from `owner_id === user?.id` to `['owner', 'admin'].includes(userRole)`
- Hide owner-specific actions ("Transfer Ownership") from admins via conditional rendering
- Restrict role dropdown: admins see ['member', 'viewer'], owners see ['admin', 'member', 'viewer']
- Add confirmation dialogs for sensitive actions (removing admins, self-demotion)

**Benefits:**
- Consistent UX across owner and admin roles
- Reduced code duplication
- Faster implementation timeline
- Easier maintenance and testing

The implementation maintains the existing defense-in-depth pattern and enforces all permissions at the database level for security.
