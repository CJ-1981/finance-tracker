# Implementation Plan: SPEC-AUTH-002 - Admin Role for Project Management

**SPEC ID:** SPEC-AUTH-002
**Title:** Admin Role for Project Management
**Version:** 1.0.1
**Status:** Draft
**Created:** 2026-03-05
**Updated:** 2026-03-05

---

## UI Design Decision

**Decision:** Extend Existing ProjectDetailPage with Admin-Aware Permissions

**Approach:**
- Use existing member management interface in ProjectDetailPage
- Update permission checks to include admin role
- Add role dropdown restrictions (admins can't promote to owner)
- Hide owner-specific actions (Transfer Ownership) from admins
- No separate admin page needed

**Implementation Pattern:**
```typescript
// Current (owner-only):
{project?.owner_id === user?.id && <MemberManagementPanel />}

// Updated (owner + admin):
{(project?.owner_id === user?.id || userRole === 'admin') && <MemberManagementPanel adminMode={userRole === 'admin'} />}
```

**Admin Restrictions in UI:**
- Cannot select 'owner' in role dropdown
- Cannot remove members with 'owner' role
- Cannot remove other admins (prevent circular demotion)
- "Transfer Ownership" button hidden from admins
- Promote to 'admin' option shown only to owners

---

## Task Decomposition

### Phase 1: Database Layer (High Priority)

**Task 1.1: Update Schema CHECK Constraints**
- File: `database/schema.sql`
- Line 34: Add 'admin' to `project_members.role` CHECK constraint
- Verify Line 73: Ensure `invitations.role` constraint remains 'member', 'viewer' only
- **Ownership:** Database Administrator / Backend Expert
- **Dependencies:** None (can start immediately)
- **Estimated Complexity:** Low (simple SQL change)

**Task 1.2: Update RLS Policies for Member Management**
- File: `database/schema.sql`
- Line 348: Update member insert policy to include 'admin'
- Line 355: Update member delete policy to include 'admin' with restrictions
- Add member update policy if not exists (admin role changes with restrictions)
- **Ownership:** Backend Expert
- **Dependencies:** Task 1.1 (schema must be updated first)
- **Estimated Complexity:** Medium (complex policy logic)

**Task 1.3: Update RLS Policies for Category Management**
- File: `database/schema.sql`
- Lines 384, 392, 400: Update category policies to include 'admin'
- **Ownership:** Backend Expert
- **Dependencies:** Task 1.1
- **Estimated Complexity:** Low (straightforward array additions)

**Task 1.4: Update RLS Policies for Transaction Management**
- File: `database/schema.sql`
- Line 426: Update transaction insert policy to include 'admin'
- Line 437: Update transaction update policy to include 'admin'
- Line 448: Update transaction soft delete policy to include 'admin'
- **Ownership:** Backend Expert
- **Dependencies:** Task 1.1
- **Estimated Complexity:** Low (straightforward array additions)

**Task 1.5: Update RLS Policies for Invitation Management**
- File: `database/schema.sql`
- Lines 486, 494: Update invitation policies to include 'admin'
- **Ownership:** Backend Expert
- **Dependencies:** Task 1.1
- **Estimated Complexity:** Low (straightforward array additions)

**Task 1.6: Database Migration and Testing**
- Create migration script to apply schema changes
- Test migration on development database
- Verify RLS policies work correctly with admin role
- **Ownership:** Backend Expert + DevOps Expert
- **Dependencies:** Tasks 1.1-1.5 (all policies must be updated)
- **Estimated Complexity:** Medium (requires careful testing)

### Phase 2: Type System (Medium Priority)

**Task 2.1: Update TypeScript Type Definitions**
- File: `src/types/index.ts`
- Line 51: Update ProjectMember interface role type
- Line 118: Update Role type union
- **Ownership:** Frontend Expert
- **Dependencies:** None (can proceed in parallel with Phase 1)
- **Estimated Complexity:** Low (simple type changes)

**Task 2.2: Update Database Type Definitions**
- File: `src/types/database.ts`
- Lines 97, 104, 111: Update database role types
- **Ownership:** Frontend Expert
- **Dependencies:** Task 2.1 (keep type definitions consistent)
- **Estimated Complexity:** Low (simple type changes)

**Task 2.3: Regenerate Database Types**
- Run Supabase type generation command
- Verify generated types include 'admin' role
- **Ownership:** Frontend Expert + Backend Expert
- **Dependencies:** Phase 1 (database schema must be updated first)
- **Estimated Complexity:** Low (automated process)

### Phase 3: Frontend Components (Medium Priority)

**Task 3.1: Update ProjectsPage Component**
- File: `src/pages/ProjectsPage.tsx`
- Line 176: Verify role determination logic (likely no change needed)
- Lines 441, 629, 634, 637: Update permission checks to include 'admin'
- Line 654: Add 'admin' to role options array
- **Ownership:** Frontend Expert
- **Dependencies:** Phase 2 (types must be updated first)
- **Estimated Complexity:** Medium (multiple permission check updates)

**Task 3.2: Update TransactionsPage Component**
- File: `src/pages/TransactionsPage.tsx`
- Line 453: Update guard clause to include 'admin'
- Lines 1149, 1166, 1584, 1609: Update permission checks to include 'admin'
- Lines 1555, 1759: Update OR logic permission checks to include 'admin'
- **Ownership:** Frontend Expert
- **Dependencies:** Phase 2
- **Estimated Complexity:** Medium (multiple permission check updates)

**Task 3.3: Update ProjectDetailPage Component**
- File: `src/pages/ProjectDetailPage.tsx`
- Lines 1097, 1130: Update owner_id checks to role-based checks
- Add userRole fetching if not present
- **Ownership:** Frontend Expert
- **Dependencies:** Phase 2
- **Estimated Complexity:** Medium (requires refactoring owner_id pattern)

**Task 3.4: Update TransactionModal Component**
- File: `src/components/TransactionModal.tsx`
- Line 225: Update permission check to include 'admin'
- **Ownership:** Frontend Expert
- **Dependencies:** Phase 2
- **Estimated Complexity:** Low (single permission check)

**Task 3.5: Add Admin Role Validation Logic**
- Create helper function: `canManageAdmin(currentUserRole, targetMemberRole)`
- Create helper function: `canChangeRole(currentUserRole, targetMemberRole, newRole)`
- Create helper function: `isLastAdmin(members, targetMemberId)`
- **Ownership:** Frontend Expert
- **Dependencies:** Phase 2
- **Estimated Complexity:** Medium (requires careful business logic)

**Task 3.6: Add Confirmation Dialogs for Edge Cases**
- Add confirmation for last admin removal
- Add warning for self-demotion attempts
- Add error display for permission denied actions
- **Ownership:** Frontend Expert
- **Dependencies:** Task 3.5 (validation logic needed first)
- **Estimated Complexity:** Medium (requires good UX design)

### Phase 4: Internationalization (Low Priority)

**Task 4.1: Add English Translations**
- File: `src/locales/en.json`
- Add admin role display names
- Add admin role descriptions
- Add admin permission error messages
- **Ownership:** Frontend Expert + User
- **Dependencies:** None (can proceed in parallel)
- **Estimated Complexity:** Low (translation additions)

**Task 4.2: Add Korean Translations**
- File: `src/locales/ko.json`
- Mirror English translations in Korean
- **Ownership:** Frontend Expert + User
- **Dependencies:** Task 4.1 (English translations first)
- **Estimated Complexity:** Low (translation additions)

### Phase 5: Testing and Validation (High Priority)

**Task 5.1: Unit Tests for Permission Logic**
- Test admin can invite members
- Test admin cannot invite admins directly
- Test admin can remove members (except owners/admins)
- Test admin can change roles (except owner/admin)
- Test admin cannot promote self to owner
- **Ownership:** Testing Expert
- **Dependencies:** Phases 1-4 (all implementation complete)
- **Estimated Complexity:** Medium (comprehensive test coverage)

**Task 5.2: Integration Tests for RLS Policies**
- Test database enforces admin permissions correctly
- Test database denies admin restricted actions
- Test defense-in-depth pattern works correctly
- **Ownership:** Testing Expert + Backend Expert
- **Dependencies:** Phase 1 (database changes complete)
- **Estimated Complexity:** High (requires database setup)

**Task 5.3: E2E Tests for Admin Workflows**
- Test admin login and UI rendering
- Test admin member management workflows
- Test admin transaction management workflows
- Test admin permission denial scenarios
- **Ownership:** Testing Expert
- **Dependencies:** Phases 1-4 (all implementation complete)
- **Estimated Complexity:** High (complex scenarios)

**Task 5.4: Edge Case Testing**
- Test last admin removal scenario
- Test self-demotion prevention
- Test multiple admin management
- Test circular permission prevention
- **Ownership:** Testing Expert
- **Dependencies:** Phase 3 (frontend logic complete)
- **Estimated Complexity:** High (edge cases are tricky)

---

## Technology Stack

**No New Dependencies Required:**

- **Database:** PostgreSQL 16 with Supabase RLS (existing)
- **Frontend:** React 19.2.4 with TypeScript 5.9 (existing)
- **Type Generation:** Supabase CLI (existing)
- **Testing:** Jest, React Testing Library, Playwright (existing)

**Utilities:**
- **Supabase Client:** @supabase/supabase-js 2.97.0 (existing)
- **TypeScript Compiler:** tsc 5.9 (existing)
- **i18n:** Custom implementation with JSON locales (existing)

---

## Risk Analysis

### High-Risk Areas

**Risk 1: RLS Policy Complexity (Severity: High)**
- **Description:** Complex RLS policy logic for admin restrictions (cannot manage owners/admins) may have edge cases
- **Impact:** Security vulnerabilities if admins can gain unauthorized access
- **Mitigation:** Comprehensive integration testing, code review by security expert, defense-in-depth pattern maintenance
- **Contingency:** Revert to simpler policies if testing reveals issues

**Risk 2: Frontend Permission Check Drift (Severity: Medium)**
- **Description:** Frontend permission checks may not match RLS policies exactly
- **Impact:** UI shows controls that backend denies, or hides controls that backend allows
- **Mitigation:** Strict audit of all permission checks, use helper functions for consistency
- **Contingency:** Add comprehensive permission matrix validation tests

**Risk 3: Database Migration Failures (Severity: Medium)**
- **Description:** Schema changes may fail on production database due to existing data constraints
- **Impact:** Migration failure, potential data inconsistency
- **Mitigation:** Test migration on staging database first, create rollback plan
- **Contingency:** Manual SQL intervention if automated migration fails

### Medium-Risk Areas

**Risk 4: Type System Inconsistency (Severity: Medium)**
- **Description:** TypeScript types may not match database schema after regeneration
- **Impact:** Type errors, compilation failures
- **Mitigation:** Regenerate types after schema changes, verify type coverage
- **Contingency:** Manual type corrections if generation fails

**Risk 5: User Role Caching Issues (Severity: Low)**
- **Description:** Frontend may cache stale user role data after role changes
- **Impact:** UI doesn't reflect new permissions immediately
- **Mitigation:** Implement role refresh on key actions, use Supabase real-time subscriptions
- **Contingency:** Manual page refresh to clear stale data

**Risk 6: Translation Completeness (Severity: Low)**
- **Description:** Missing translations for admin role error messages
- **Impact:** Untranslated error messages shown to users
- **Mitigation:** Comprehensive i18n audit before release
- **Contingency:** Accept English fallback for missing translations

---

## Testing Strategy

### Permission Boundary Tests

**Test 1: Admin Cannot Delete Project**
```
Given: User with admin role
When: Attempting to delete project
Then: Database RLS policy denies the operation
And: Frontend hides delete project button
```

**Test 2: Admin Cannot Transfer Ownership**
```
Given: User with admin role
When: Attempting to transfer project ownership
Then: Database RLS policy denies the operation
And: Frontend shows permission denied error
```

**Test 3: Admin Cannot Permanently Delete Transactions**
```
Given: User with admin role
When: Attempting to permanently delete a transaction
Then: Database RLS policy denies the operation
And: Frontend shows permission denied error
```

**Test 4: Admin Cannot Promote Self to Owner**
```
Given: User with admin role
When: Attempting to change own role to owner
Then: Database RLS policy denies the operation
And: Frontend shows specific error message
```

**Test 5: Admin Cannot Manage Owners**
```
Given: User with admin role
When: Attempting to change owner role or remove owner
Then: Database RLS policy denies the operation
And: Frontend shows "cannot manage owners" error
```

**Test 6: Admin Cannot Manage Other Admins**
```
Given: User with admin role (Admin A)
When: Attempting to change role of another admin (Admin B)
Then: Database RLS policy denies the operation
And: Frontend shows "cannot manage other admins" error
```

### Admin Capability Tests

**Test 7: Admin Can Invite Members**
```
Given: User with admin role
When: Inviting a new user as member
Then: Invitation is created successfully
And: Invited user can accept invitation
```

**Test 8: Admin Can Remove Members**
```
Given: User with admin role
And: Project has member with role 'member'
When: Removing the member
Then: Member is removed successfully
And: Member loses access to project
```

**Test 9: Admin Can Change Member Roles**
```
Given: User with admin role
And: Project has member with role 'member'
When: Changing member role to 'viewer'
Then: Role change is successful
And: Member permissions are updated accordingly
```

**Test 10: Admin Can Edit Any Transaction**
```
Given: User with admin role
And: Project has transaction created by another user
When: Editing the transaction
Then: Transaction is updated successfully
And: Changes are reflected in database
```

**Test 11: Admin Can View Deleted Transactions**
```
Given: User with admin role
And: Project has soft-deleted transactions
When: Viewing deleted transactions
Then: Deleted transactions are displayed
And: Admin can restore them
```

**Test 12: Admin Can Manage Categories**
```
Given: User with admin role
When: Creating, editing, or deleting categories
Then: Category operations succeed
And: Changes are reflected for all project members
```

### Role Hierarchy Tests

**Test 13: Multiple Admins Can Coexist**
```
Given: Project with one admin
When: Promoting a member to admin
Then: Project has two admins
And: Both admins have appropriate permissions
```

**Test 14: Admin Cannot Be Invited Directly**
```
Given: User with admin role
When: Attempting to invite user with admin role
Then: Frontend does not show admin role option
And: Database constraint prevents admin in invitations
```

**Test 15: Admin Promotion Flow**
```
Given: User with admin role
And: Project has member with role 'member'
When: Promoting member to admin via member management
Then: Member role is updated to 'admin'
And: Member immediately gains admin permissions
```

---

## Implementation Order

**Recommended Sequence (Dependencies Respected):**

1. **Week 1: Database Layer (Tasks 1.1-1.6)**
   - Start with schema changes (Task 1.1)
   - Update all RLS policies (Tasks 1.2-1.5)
   - Create and test migration (Task 1.6)
   - **Milestone:** Database layer complete, tested, and verified

2. **Week 2: Type System (Tasks 2.1-2.3)**
   - Update TypeScript definitions (Tasks 2.1-2.2)
   - Regenerate database types (Task 2.3)
   - **Milestone:** Type system updated and compilation successful

3. **Week 3: Frontend Components (Tasks 3.1-3.6)**
   - Update permission checks in all components (Tasks 3.1-3.4)
   - Add validation logic (Task 3.5)
   - Add confirmation dialogs (Task 3.6)
   - **Milestone:** Frontend admin features complete

4. **Week 4: I18n and Testing (Tasks 4.1-4.2, 5.1-5.4)**
   - Add translations (Tasks 4.1-4.2)
   - Write unit tests (Task 5.1)
   - Write integration tests (Task 5.2)
   - Write E2E tests (Task 5.3)
   - Test edge cases (Task 5.4)
   - **Milestone:** Complete implementation with full test coverage

---

## Success Criteria

**Primary Goals:**
- All RLS policies updated and tested with admin role
- All frontend components updated with admin-aware permission checks
- All TypeScript types updated and verified
- All translations added (English and Korean)
- 85%+ test coverage for admin-related functionality

**Secondary Goals:**
- Helper functions created for common permission checks
- Confirmation dialogs for edge cases
- Comprehensive error messages for permission denials
- Audit trail for admin actions

**Final Goals:**
- Performance regression tests pass
- Accessibility audit passes
- Security review passes
- Documentation updated

---

## Rollback Plan

**If Database Migration Fails:**
1. Revert database schema changes using migration rollback
2. Restore previous RLS policies from backup
3. Verify system functionality with previous schema

**If Frontend Changes Break:**
1. Revert TypeScript type changes
2. Revert component permission check changes
3. Remove admin-related UI elements
4. Test system with reverted changes

**If Testing Reveals Critical Issues:**
1. Pause implementation
2. Document issues and root causes
3. Decide between fix attempt vs rollback
4. If rollback, revert all changes in reverse dependency order
