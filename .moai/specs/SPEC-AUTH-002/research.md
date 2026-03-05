# Research Report: Admin Role Feature

## 1. CURRENT ROLE SYSTEM ARCHITECTURE

### Database Schema

**File:** `database/schema.sql`

**Role Definition (Line 34):**
```sql
role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer'))
```

**Invitation Role Constraint (Line 73):**
```sql
role TEXT NOT NULL CHECK (role IN ('member', 'viewer'))
```
- **Critical Finding:** Invitations cannot specify 'owner' role - only 'member' or 'viewer'

### Helper Functions

**1. `is_project_member(p_id UUID)` (Lines 156-162)**
- Returns: BOOLEAN
- Purpose: Checks if current user is ANY member of project (regardless of role)
- Used in: RLS policies for basic membership verification

**2. `is_project_owner(p_id UUID)` (Lines 165-171)**
- Returns: BOOLEAN
- Purpose: Checks if `auth.uid() == projects.owner_id`
- **Key Distinction:** Checks `projects.owner_id`, NOT `project_members.role`
- Used in: Most RLS policies for owner-level permissions

**3. `is_project_member_with_role(p_id UUID, allowed_roles TEXT[])` (Lines 174-180)**
- Returns: BOOLEAN
- Purpose: Checks if current user's `project_members.role` is in allowed_roles array
- **Key Distinction:** Checks `project_members.role`, NOT `projects.owner_id`
- Used in: RLS policies requiring specific role-based access

**4. `current_user_email()` (Lines 183-186)**
- Returns: TEXT (email from auth.users)
- Purpose: Provides current user's email for invitation matching

### Triggers

**1. `handle_new_user()` (Lines 120-137)**
- Trigger: `on_auth_user_created` on `auth.users` (AFTER INSERT)
- Purpose: Auto-creates profile entry when user signs up

**2. `handle_new_project_owner()` (Lines 140-153)**
- Trigger: `on_project_created` on `projects` (AFTER INSERT)
- **Critical Finding:** Automatically inserts `project_members` entry with `role='owner'` for `projects.owner_id`
```sql
INSERT INTO public.project_members (project_id, user_id, role)
VALUES (NEW.id, NEW.owner_id, 'owner');
```

### RLS Policy Summary

**Policies using `is_project_owner` + `is_project_member_with_role(ARRAY['owner'])`:**
- "Owners can insert members" (Lines 344-349)
- "Owners can delete members" (Lines 351-356)
- "Members can insert categories" (Lines 380-385)
- "Members can update categories" (Lines 388-393)
- "Members can delete categories" (Lines 396-401)
- "Members can insert transactions" (Lines 421-428)
- "Creators can update own transactions" (Lines 431-439)
- "Members can soft delete transactions" (Lines 442-454)
- "Users can view project invitations" (Lines 457-465)
- "Users can update invitation status to accepted" (Lines 468-477)
- "Owners can insert invitations" (Lines 480-487)
- "Owners can delete invitations" (Lines 490-495)

**Defense-in-Depth Pattern (Lines 341-343):**
```sql
-- Note: Duplicate owner checks (is_project_owner + is_project_member_with_role with 'owner')
-- are intentional for defense-in-depth and to tolerate drift between projects.owner_id
-- and project_members.role entries.
```
This pattern is used to handle cases where `projects.owner_id` might not match the corresponding `project_members.role` entry.

---

## 2. FRONTEND PERMISSION FLOW

### Type System

**File:** `src/types/index.ts`

**Role Type Definition (Line 118):**
```typescript
export type Role = 'owner' | 'member' | 'viewer'
```

**ProjectMember Interface (Lines 47-53):**
```typescript
export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'member' | 'viewer'
  joined_at: string
}
```

**Database Types (Lines 92-114):**
```typescript
project_members: {
  Row: {
    role: 'owner' | 'member' | 'viewer'
  }
  Insert: {
    role: 'owner' | 'member' | 'viewer'
  }
  Update: {
    role?: 'owner' | 'member' | 'viewer'
  }
}
```

**Invitation Types (Lines 191-225):**
```typescript
invitations: {
  Row: {
    role: 'member' | 'viewer'  // NO 'owner' option
  }
  Insert: {
    role: 'member' | 'viewer'  // NO 'owner' option
  }
  Update: {
    role?: 'member' | 'viewer'  // NO 'owner' option
  }
}
```

### Permission Check Patterns

**Pattern 1: owner_id Comparison (Owner Determination)**
**File:** `src/pages/ProjectsPage.tsx` (Line 176)
```typescript
const userRole = project.owner_id === user.id ? 'owner' : m.role
```
- Used to determine if user should see 'owner' role even if `project_members.role` differs
- Applied in: ProjectsPage, ProjectDetailPage

**Pattern 2: Direct Role String Comparison**
**File:** `src/pages/ProjectsPage.tsx`
- Line 441: `projects.some(p => p.userRole === 'owner')` - Show multi-invite button
- Line 629: `if (project.userRole === 'owner')` - Allow project selection
- Line 634: `project.userRole !== 'owner'` - Disable non-owner projects in selection mode
- Line 637: `project.userRole === 'owner'` - Show selection checkbox

**Pattern 3: Role-Based Conditional Rendering**
**File:** `src/pages/TransactionsPage.tsx`
- Line 453: `if (!projectId || userRole !== 'owner') return` - Guard clause
- Line 1149: `{userRole === 'owner' && (...)}` - Show settings button
- Line 1166: `{showSettings && userRole === 'owner' && (...)}` - Show settings modal
- Line 1555: `{(userRole === 'owner' || canEditSelected()) && (...)}` - Multi-edit button
- Line 1584: `{userRole === 'owner' && (...)}` - Show category settings
- Line 1609: `{showDeleted && userRole === 'owner' && (...)}` - Show deleted transactions
- Line 1759: `{(userRole === 'owner' || transaction.created_by === user?.id) && (...)}` - Delete button

**Pattern 4: owner_id Check for Invitation UI**
**File:** `src/pages/ProjectDetailPage.tsx`
- Line 1097: `{project?.owner_id === user?.id && (...)}` - Show invite button
- Line 1130: `{showInviteModal && project?.owner_id === user?.id && (...)}` - Show invite modal

**Pattern 5: Transaction Edit Permission Logic**
**File:** `src/pages/TransactionsPage.tsx` (Lines 414-419)
```typescript
const canEditSelected = () => {
  // Check if user created all selected transactions
  const selectedIds = Array.from(selectedTransactions)
  return selectedIds.every(id => {
    const transaction = transactions.find(t => t.id === id)
    return transaction?.created_by === user?.id
  })
}
```
- Members can edit their own transactions
- Owners can edit all transactions

### User Role Fetching Pattern

**File:** `src/pages/TransactionsPage.tsx` (Lines 221-226)
```typescript
const { data: memberData } = await Promise.race([
  supabase.from('project_members').select('role').eq('project_id', projectId).eq('user_id', user.id).single(),
  new Promise<any>((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), 2000)
  )
])
if (memberData?.role) setUserRole(memberData.role)
```

Same pattern in:
- `src/pages/ProjectDetailPage.tsx` (Lines 334-346)

---

## 3. FILES REQUIRING MODIFICATION FOR "ADMIN" ROLE

### Database Files

**1. `database/schema.sql`**
- Line 34: `CHECK (role IN ('owner', 'member', 'viewer'))` → Add 'admin'
- Line 73: `CHECK (role IN ('member', 'viewer'))` → Add 'admin' (if admins can invite)
- Lines 201, 348, 355, 384, 392, 400, 426, 437, 448, 464, 475, 486, 494: All `ARRAY['owner']` → Add 'admin' where appropriate
- Lines 384, 392, 400, 426: `ARRAY['owner', 'member']` → Add 'admin' if admins should have category permissions
- Line 143: Trigger always sets `role='owner'` - may need update logic if admin should be different

### Type Definition Files

**1. `src/types/index.ts`**
- Line 51: `role: 'owner' | 'member' | 'viewer'` → Add 'admin'
- Line 118: `export type Role = 'owner' | 'member' | 'viewer'` → Add 'admin'

**2. `src/types/database.ts`**
- Line 97: `role: 'owner' | 'member' | 'viewer'` → Add 'admin'
- Line 104: `role: 'owner' | 'member' | 'viewer'` → Add 'admin'
- Line 111: `role?: 'owner' | 'member' | 'viewer'` → Add 'admin'
- Lines 196, 207, 218: `role: 'member' | 'viewer'` → Add 'admin' (if admins can be invited)

### Frontend Components

**1. `src/pages/ProjectsPage.tsx`**
- Line 176: Role determination logic - needs admin handling
- Lines 441, 629, 634, 637: `=== 'owner'` checks → Include 'admin'
- Line 654: Translation key array `['owner', 'member', 'viewer']` → Add 'admin'

**2. `src/pages/TransactionsPage.tsx`**
- Line 453: `!== 'owner'` → Include 'admin'
- Lines 1149, 1166, 1584, 1609: `=== 'owner'` checks → Include 'admin'
- Lines 1555, 1759: `=== 'owner' ||` patterns → Include 'admin'

**3. `src/pages/ProjectDetailPage.tsx`**
- Line 1097: `owner_id === user?.id` checks → May need admin handling
- Line 1130: Same check for invite modal

**4. `src/components/TransactionModal.tsx`**
- Line 225: `userRole === 'owner'` check → Include 'admin'

**5. `src/pages/InvitePage.tsx`**
- Line 123: `role: invite.role` - handles invitation acceptance

### Locale Files

**1. `src/locales/en.json`**
- Lines 45-47: Add "admin": "Admin" translation
- Add admin role description (e.g., "roleAdmin": "Admin (Full management)")

**2. `src/locales/ko.json`**
- Mirror admin translations

---

## 4. PERMISSION MATRIX (CURRENT STATE)

| Action | owner | member | viewer | Admin (Proposed) |
|--------|-------|--------|--------|------------------|
| **Project Management** |
| View project | ✓ | ✓ | ✓ | ✓ |
| Create project | ✓ (via owner_id) | ✗ | ✗ | ? (likely not) |
| Edit project settings | ✓ (via owner_id) | ✗ | ✗ | ? |
| Delete project | ✓ (via owner_id) | ✗ | ✗ | ✗ (recommended) |
| Transfer ownership | ✓ (via owner_id) | ✗ | ✗ | ✗ (recommended) |
| **Member Management** |
| View members | ✓ | ✓ | ✓ | ✓ |
| Add members (invite) | ✓ | ✗ | ✗ | ? (likely yes) |
| Remove members | ✓ | ✗ | ✗ | ? (likely yes, except owners) |
| Change member roles | ✓ | ✗ | ✗ | ? (likely yes, but limited) |
| **Category Management** |
| View categories | ✓ | ✓ | ✓ | ✓ |
| Add categories | ✓ | ✓ | ✗ | ? (likely yes) |
| Edit categories | ✓ | ✓ | ✗ | ? (likely yes) |
| Delete categories | ✓ | ✓ | ✗ | ? (likely yes) |
| **Transaction Management** |
| View active transactions | ✓ | ✓ | ✓ | ✓ |
| View deleted transactions | ✓ | ✗ | ✗ | ? (likely yes) |
| Add transactions | ✓ | ✓ | ✗ | ? (likely yes) |
| Edit own transactions | ✓ | ✓ | ✗ | ✓ |
| Edit any transaction | ✓ | ✗ | ✗ | ? (likely yes) |
| Soft delete own | ✓ | ✓ | ✗ | ✓ |
| Soft delete any | ✓ | ✗ | ✗ | ? (likely yes) |
| Restore transactions | ✓ | ✗ | ✗ | ? (likely yes) |
| Permanently delete | ✓ | ✗ | ✗ | ✗ (recommended) |
| **Invitation Management** |
| View invitations | ✓ | ✓ | ✗ | ? (likely yes) |
| Create invitations | ✓ | ✗ | ✗ | ? (likely yes) |
| Cancel invitations | ✓ | ✗ | ✗ | ? (likely yes) |
| Accept invitations | ✓ | ✓ | ✓ | ✓ |

---

## 5. IMPLEMENTATION CONSIDERATIONS

### Key Distinction: "owner" vs role-based "owner"

**Two Types of "Ownership":**

1. **`projects.owner_id` (Database Owner)**
   - The canonical owner in the `projects` table
   - Cannot have multiple users
   - Used in `is_project_owner()` function
   - Checked via `project.owner_id === user.id` in frontend
   - **Ultimate authority** - can delete project, transfer ownership

2. **`project_members.role = 'owner'` (Role-Based Owner)**
   - A role entry in `project_members` table
   - Automatically created by trigger when project is created
   - Should match `projects.owner_id` but can drift
   - Used in `is_project_member_with_role(ARRAY['owner'])`
   - **Defense-in-depth** - redundant check for tolerating drift

**Critical Design Question for Admin Role:**

Should "admin" be:
- **Option A:** Similar to role-based "owner" (full management except project deletion/transfer)
- **Option B:** Between "owner" and "member" (can manage members/categories but not transactions)
- **Option C:** Enhanced "member" (can manage all transactions but not members)

**Recommended:** Option A - Admin should have owner-like permissions for day-to-day operations but not project lifecycle operations (delete, transfer ownership).

### Admin Permission Recommendations

**Should Admin Be Able To:**
- ✓ Invite new members (member/viewer roles)
- ✓ Remove members (except owners and other admins)
- ✓ Change member roles (except to/from owner)
- ✓ Manage all categories (add/edit/delete)
- ✓ View all transactions (including deleted)
- ✓ Edit/delete any transaction
- ✓ Restore soft-deleted transactions
- ✗ Delete the project (owner-only)
- ✗ Transfer ownership (owner-only)
- ✗ Change owner role to/from others (owner-only)
- ✗ Permanently delete transactions (owner-only)

---

## 6. REFERENCE IMPLEMENTATIONS

### Similar Permission Pattern: Transaction Edit Logic

**File:** `src/pages/TransactionsPage.tsx` (Lines 414-419)

```typescript
const canEditSelected = () => {
  const selectedIds = Array.from(selectedTransactions)
  return selectedIds.every(id => {
    const transaction = transactions.find(t => t.id === id)
    return transaction?.created_by === user?.id
  })
}
```

**Usage (Line 1555):**
```typescript
{(userRole === 'owner' || canEditSelected()) && (
  <button onClick={handleMultiEdit} ...>
    Edit
  </button>
)}
```

**Admin Pattern:**
```typescript
const canEditAnyTransaction = (userRole: Role) =>
  ['owner', 'admin'].includes(userRole)

{(canEditAnyTransaction(userRole) || canEditSelected()) && (
  <button onClick={handleMultiEdit} ...>
    Edit
  </button>
)}
```

### Defense-in-Depth RLS Pattern

**File:** `database/schema.sql` (Lines 341-349)

```sql
-- Note: Duplicate owner checks (is_project_owner + is_project_member_with_role with 'owner')
-- are intentional for defense-in-depth and to tolerate drift between projects.owner_id
-- and project_members.role entries.
CREATE POLICY "Owners can insert members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner'])
  );
```

**Admin Extension:**
```sql
CREATE POLICY "Admins and owners can insert members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    public.is_project_owner(project_id) OR
    public.is_project_member_with_role(project_id, ARRAY['owner', 'admin'])
  );
```

---

## 7. CRITICAL IMPLEMENTATION NOTES

### High-Impact Decisions Needed

1. **Can admins invite new members?**
   - If yes: Update `invitations.role` CHECK constraint to include 'admin'
   - If no: Keep current constraint, admin only manages existing members

2. **Can admins change member roles?**
   - If yes: Update member management RLS policies
   - If no: Only owner can change roles

3. **Can admins manage other admins?**
   - If yes: Multiple admins can manage each other
   - If no: Admins can't change other admins' roles (hierarchy enforcement needed)

4. **Admin role in invitations:**
   - Should users be able to be invited directly as 'admin'?
   - Or must users be invited as 'member' then promoted by owner?

### Edge Cases to Handle

1. **Last admin removal:** What happens if the only admin is removed?
2. **Owner promotion:** Can admin promote themselves to owner? (Should be no)
3. **Self-demotion:** Can admin demote themselves? (Should require confirmation)
4. **Circular permissions:** Multiple admins managing each other

### Testing Requirements

1. **Permission boundary tests:**
   - Admin cannot delete project
   - Admin cannot transfer ownership
   - Admin cannot permanently delete transactions

2. **Admin capability tests:**
   - Admin can invite members
   - Admin can remove members (except owners)
   - Admin can edit any transaction
   - Admin can view deleted transactions

3. **Role hierarchy tests:**
   - Admin cannot promote themselves to owner
   - Admin cannot demote owners
   - Multiple admins can coexist
