# SPEC-AUTH-002 Task Decomposition

## Phase 1.5: Atomic Task Breakdown

### Development Mode
TDD (Test-Driven Development) - RED-GREEN-REFACTOR cycle

---

## Task List

### TASK-001: Database Schema - Add Admin Role
**Description:** Update `project_members.role` CHECK constraint to include 'admin'
**File:** `database/schema.sql` (line 34)
**Priority:** Critical (foundational for all other tasks)
**Dependencies:** None
**Acceptance Criteria:**
- CHECK constraint updated to include 'admin': `CHECK (role IN ('owner', 'admin', 'member', 'viewer'))`
- Schema migration runs successfully
- Existing data remains valid

### TASK-002: RLS Policy - Member Insert
**Description:** Allow admins to insert new project members
**File:** `database/schema.sql` (line 348)
**Priority:** High
**Dependencies:** TASK-001
**Acceptance Criteria:**
- Policy updated to include 'admin' in role array: `ARRAY['owner', 'admin']`
- Admin users can successfully insert new members
- Non-admin users cannot insert members (existing behavior preserved)

### TASK-003: RLS Policy - Member Delete
**Description:** Allow admins to delete non-admin members
**File:** `database/schema.sql` (line 355)
**Priority:** High
**Dependencies:** TASK-001
**Acceptance Criteria:**
- Policy prevents deletion of members with 'owner' or 'admin' roles
- Admin users can successfully delete 'member' and 'viewer' roles
- Owners can still delete any member (existing behavior preserved)

### TASK-004: RLS Policy - Member Role Update
**Description:** Allow admins to update member roles with restrictions
**File:** `database/schema.sql` (new policy for UPDATE)
**Priority:** High
**Dependencies:** TASK-001
**Acceptance Criteria:**
- Admins cannot promote members to 'owner' role
- Admins cannot demote 'owner' members
- Admins cannot change 'admin' member roles
- Admins can change 'member'/'viewer' roles to 'admin'/'member'/'viewer'
- Owners can change any role (existing behavior preserved)

### TASK-005: RLS Policies - Category Management
**Description:** Add admin permissions to category INSERT/UPDATE/DELETE policies
**File:** `database/schema.sql` (lines 384, 392, 400)
**Priority:** Medium
**Dependencies:** TASK-001
**Acceptance Criteria:**
- Category INSERT allows 'admin' role
- Category UPDATE allows 'admin' role
- Category DELETE allows 'admin' role
- Admins can create, update, and delete categories

### TASK-006: RLS Policy - Transaction Insert
**Description:** Add admin to transaction insert policy
**File:** `database/schema.sql` (line 426)
**Priority:** Medium
**Dependencies:** TASK-001
**Acceptance Criteria:**
- Transaction INSERT allows 'admin' role
- Admins can create new transactions

### TASK-007: RLS Policy - Transaction Update
**Description:** Allow admins to edit any transaction
**File:** `database/schema.sql` (line 437)
**Priority:** Medium
**Dependencies:** TASK-001
**Acceptance Criteria:**
- Admins can update transactions regardless of creator
- Members can still only update their own transactions (existing behavior preserved)

### TASK-008: RLS Policy - Deleted Transaction View/Restore
**Description:** Allow admins to view and restore deleted transactions
**File:** `database/schema.sql` (line 448)
**Priority:** Medium
**Dependencies:** TASK-001
**Acceptance Criteria:**
- Admins can query soft-deleted transactions
- Admins can restore soft-deleted transactions

### TASK-009: RLS Policies - Invitation Management
**Description:** Add admin to invitation INSERT/DELETE policies
**File:** `database/schema.sql` (lines 486, 494)
**Priority:** Medium
**Dependencies:** TASK-001
**Acceptance Criteria:**
- Invitation INSERT allows 'admin' role
- Invitation DELETE allows 'admin' role
- Admins can create and cancel invitations

### TASK-010: TypeScript Types - Role Type Update
**Description:** Add 'admin' to Role type and ProjectMember interface
**Files:** `src/types/index.ts` (lines 51, 118), `src/types/database.ts` (lines 97, 104, 111)
**Priority:** High
**Dependencies:** TASK-001
**Acceptance Criteria:**
- Role type includes 'admin': `'owner' | 'admin' | 'member' | 'viewer'`
- ProjectMember interface role field updated
- Database types regenerated (if applicable)
- No TypeScript compilation errors

### TASK-011: Frontend - ProjectsPage Permission Checks
**Description:** Update ProjectsPage to include admin role in permission checks
**File:** `src/pages/ProjectsPage.tsx` (lines 441, 629, 634, 637, 654)
**Priority:** High
**Dependencies:** TASK-010
**Acceptance Criteria:**
- All `userRole === 'owner'` checks updated to `['owner', 'admin'].includes(userRole)`
- roleOptions array includes 'admin'
- Admin users can see and use member management features
- Admin users cannot see owner-only features (transfer ownership)

### TASK-012: Frontend - TransactionsPage Permission Checks
**Description:** Update TransactionsPage to include admin role in permission checks
**File:** `src/pages/TransactionsPage.tsx` (lines 453, 1149, 1166, 1584, 1609, 1555, 1759)
**Priority:** High
**Dependencies:** TASK-010
**Acceptance Criteria:**
- Guard clause updated to include admin role
- Admin users can see "View Deleted Transactions" button
- Admin users can edit any transaction
- Admin users can restore deleted transactions

### TASK-013: Frontend - ProjectDetailPage Permission Checks
**Description:** Update ProjectDetailPage to include admin role in permission checks
**File:** `src/pages/ProjectDetailPage.tsx` (lines 1097, 1130)
**Priority:** Medium
**Dependencies:** TASK-010
**Acceptance Criteria:**
- owner_id checks updated to include admin role
- Admin users can access invitation management
- Admin users cannot see owner-only features

### TASK-014: Frontend - TransactionModal Permission Checks
**Description:** Update TransactionModal to include admin role
**File:** `src/components/TransactionModal.tsx` (line 225)
**Priority:** Medium
**Dependencies:** TASK-010
**Acceptance Criteria:**
- Permission check updated to include admin role
- Admin users can edit any transaction

### TASK-015: I18n - English Translations
**Description:** Add English translations for admin role, descriptions, and error messages
**File:** `src/locales/en.json`
**Priority:** Medium
**Dependencies:** None
**Acceptance Criteria:**
- roleDescriptions includes 'admin' entry
- admin object contains error messages (cannotManageOwners, cannotManageOtherAdmins, etc.)
- All English translations complete

### TASK-016: I18n - Korean Translations
**Description:** Add Korean translations for admin role, descriptions, and error messages
**File:** `src/locales/ko.json`
**Priority:** Medium
**Dependencies:** None
**Acceptance Criteria:**
- roleDescriptions includes 'admin' entry (Korean)
- admin object contains error messages (Korean)
- All Korean translations complete

### TASK-017: Database Migration
**Description:** Run database migration and verify schema changes
**Command:** Database migration script
**Priority:** Critical
**Dependencies:** TASK-001 through TASK-009
**Acceptance Criteria:**
- Schema migration completes successfully
- All CHECK constraints updated
- All RLS policies updated
- No existing data violations

### TASK-018: End-to-End Testing
**Description:** Verify admin permissions work correctly across all features
**Approach:** Manual testing or automated E2E tests
**Priority:** High
**Dependencies:** TASK-001 through TASK-016
**Acceptance Criteria:**
- Admin can invite members
- Admin can manage members (except owners/other admins)
- Admin can manage categories
- Admin can edit any transaction
- Admin can view and restore deleted transactions
- Admin cannot delete project
- Admin cannot transfer ownership
- Admin cannot manage owners
- Admin cannot manage other admins

### TASK-019: Documentation Update
**Description:** Update project documentation to reflect admin role changes
**Files:** README.md, docs/**/*.md (if applicable)
**Priority:** Low
**Dependencies:** TASK-017
**Acceptance Criteria:**
- README mentions admin role
- Role hierarchy documented
- Permission boundaries documented
- Examples updated

---

## Task Dependencies

```
TASK-001 (Database Schema - Admin Role)
  ├─> TASK-002 (Member Insert)
  ├─> TASK-003 (Member Delete)
  ├─> TASK-004 (Member Role Update)
  ├─> TASK-005 (Category Management)
  ├─> TASK-006 (Transaction Insert)
  ├─> TASK-007 (Transaction Update)
  ├─> TASK-008 (Deleted Transactions)
  ├─> TASK-009 (Invitation Management)
  ├─> TASK-010 (TypeScript Types)
      ├─> TASK-011 (ProjectsPage)
      ├─> TASK-012 (TransactionsPage)
      ├─> TASK-013 (ProjectDetailPage)
      └─> TASK-014 (TransactionModal)
  ├─> TASK-015 (English I18n)
  ├─> TASK-016 (Korean I18n)
  └─> TASK-017 (Database Migration)
      ├─> TASK-018 (E2E Testing)
      └─> TASK-019 (Documentation)
```

---

## Task Statistics

- Total Tasks: 19
- Database Tasks: 9 (TASK-001 to TASK-009, TASK-017)
- Frontend Tasks: 5 (TASK-010 to TASK-014)
- I18n Tasks: 2 (TASK-015, TASK-016)
- Testing Tasks: 1 (TASK-018)
- Documentation Tasks: 1 (TASK-019)

---

## Execution Order Recommendation

1. **Batch 1 (Database Schema & RLS):** TASK-001 through TASK-009 (database-level changes)
2. **Batch 2 (Type System):** TASK-010 (foundation for frontend)
3. **Batch 3 (Frontend Components):** TASK-011 through TASK-014 (UI updates)
4. **Batch 4 (I18n):** TASK-015, TASK-016 (can be parallel with Batch 3)
5. **Batch 5 (Migration & Testing):** TASK-017, TASK-018
6. **Batch 6 (Documentation):** TASK-019 (last, after everything works)

---

## Complexity Assessment

**Overall Complexity:** Medium

- Database schema changes are straightforward (add one role value)
- RLS policy updates require careful logic to prevent admin privilege escalation
- Frontend changes are mechanical (find-and-replace pattern)
- I18n additions are straightforward (new keys only, no key conflicts)
- No data migration required (all existing data remains valid)

**Risk Assessment:** Low

- Changes are additive (adding 'admin' role, not removing/changing existing roles)
- Existing behaviors are preserved (owner permissions unchanged)
- Database schema change is backward compatible
- No breaking changes to API or data model

**Estimated Effort:** 2-3 hours for implementation, 1-2 hours for testing and validation
