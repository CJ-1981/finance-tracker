# Acceptance Criteria: SPEC-AUTH-002 - Admin Role for Project Management

**SPEC ID:** SPEC-AUTH-002
**Title:** Admin Role for Project Management
**Version:** 1.0.0
**Status:** Draft
**Created:** 2026-03-05

---

## Test Scenarios (Given-When-Then Format)

### Scenario 1: Admin Can Invite Members

**Given** a user with admin role on a project
**And** the project has existing members
**When** the admin navigates to the project member management interface
**And** invites a new user with role 'member'
**Then** the invitation is created successfully
**And** the invited user receives the invitation
**And** the invited user can accept and join as 'member'
**And** the invitation role options only show 'member' and 'viewer' (not 'admin' or 'owner')

### Scenario 2: Admin Cannot Invite Users as Admin

**Given** a user with admin role on a project
**When** the admin attempts to invite a new user
**Then** the role selection dropdown only shows 'member' and 'viewer' options
**And** attempting to set role to 'admin' via API is rejected by database constraint
**And** appropriate error message is shown: "Admins can only invite members and viewers"

### Scenario 3: Admin Can Remove Non-Owner Members

**Given** a user with admin role on a project
**And** the project has a member with role 'member'
**When** the admin clicks the "Remove" button on that member
**And** confirms the removal
**Then** the member is removed from the project
**And** the member loses access to all project resources
**And** the member count decreases by one
**And** the removal is logged in the audit trail

### Scenario 4: Admin Cannot Remove Owners

**Given** a user with admin role on a project
**And** the project has a member with role 'owner'
**When** the admin attempts to remove the owner
**Then** the remove operation is denied by RLS policy
**And** frontend shows error message: "Admins cannot manage project owners"
**And** the owner remains on the project
**And** the denial is logged in the audit trail

### Scenario 5: Admin Cannot Remove Other Admins

**Given** a user with admin role (Admin A) on a project
**And** the project has another admin (Admin B)
**When** Admin A attempts to remove Admin B
**Then** the remove operation is denied by RLS policy
**And** frontend shows error message: "Admins cannot manage other admins"
**And** Admin B remains on the project
**And** the denial is logged in the audit trail

### Scenario 6: Admin Can Change Member Roles

**Given** a user with admin role on a project
**And** the project has a member with role 'member'
**When** the admin changes the member's role to 'viewer'
**Then** the role change is successful
**And** the member's permissions are updated to viewer permissions
**And** the member can no longer add/edit transactions
**And** the change is logged in the audit trail

### Scenario 7: Admin Cannot Promote to Owner

**Given** a user with admin role on a project
**And** the project has a member with role 'member'
**When** the admin attempts to change the member's role to 'owner'
**Then** the role change is denied by RLS policy
**And** frontend shows error message: "Only owners can assign owner role"
**And** the member remains as 'member'
**And** the denial is logged in the audit trail

### Scenario 8: Admin Cannot Promote Self to Owner

**Given** a user with admin role on a project
**When** the user attempts to change their own role to 'owner'
**Then** the role change is denied by RLS policy
**And** frontend shows error message: "Admins cannot promote themselves to owner"
**And** the user remains as 'admin'
**And** the denial is logged in the audit trail

### Scenario 9: Admin Cannot Manage Other Admins

**Given** a user with admin role (Admin A) on a project
**And** the project has another admin (Admin B)
**When** Admin A attempts to change Admin B's role
**Then** the role change is denied by RLS policy
**And** frontend shows error message: "Admins cannot manage other admins"
**And** Admin B remains as 'admin'
**And** the denial is logged in the audit trail

### Scenario 10: Admin Can Manage Categories

**Given** a user with admin role on a project
**And** the project has existing categories
**When** the admin creates a new category
**Then** the category is created successfully
**When** the admin edits an existing category
**Then** the category is updated successfully
**When** the admin deletes a category
**Then** the category is deleted successfully
**And** all category changes are reflected for all project members

### Scenario 11: Admin Can Edit Any Transaction

**Given** a user with admin role on a project
**And** the project has transactions created by other members
**When** the admin opens a transaction created by another member
**And** edits the transaction amount or description
**Then** the transaction is updated successfully
**And** the changes are saved to the database
**And** the transaction history shows the admin as the editor
**And** the edit is logged in the audit trail

### Scenario 12: Admin Can Delete Any Transaction

**Given** a user with admin role on a project
**And** the project has active transactions created by other members
**When** the admin selects transactions created by other members
**And** clicks the "Delete" button
**Then** the transactions are soft-deleted successfully
**And** the transactions are removed from the main view
**And** the transactions are marked as deleted in the database
**And** the deletion is logged in the audit trail

### Scenario 13: Admin Can View Deleted Transactions

**Given** a user with admin role on a project
**And** the project has soft-deleted transactions
**When** the admin enables "Show Deleted Transactions"
**Then** all soft-deleted transactions are displayed
**And** each deleted transaction shows a "Restore" button
**And** the deleted transactions are visually distinct from active ones

### Scenario 14: Admin Can Restore Deleted Transactions

**Given** a user with admin role on a project
**And** the project has soft-deleted transactions
**And** the admin is viewing deleted transactions
**When** the admin clicks "Restore" on a deleted transaction
**Then** the transaction is restored successfully
**And** the transaction reappears in the main view
**And** the transaction is no longer marked as deleted
**And** the restoration is logged in the audit trail

### Scenario 15: Admin Cannot Delete Project

**Given** a user with admin role on a project
**When** the admin attempts to delete the project
**Then** the delete operation is denied by RLS policy
**And** the "Delete Project" button is not visible in the UI
**And** attempting to delete via API returns permission error
**And** the project remains intact
**And** the denial is logged in the audit trail

### Scenario 16: Admin Cannot Transfer Ownership

**Given** a user with admin role on a project
**When** the admin attempts to transfer project ownership
**Then** the transfer operation is denied by RLS policy
**And** the "Transfer Ownership" option is not visible in the UI
**And** attempting to transfer via API returns permission error
**And** the project owner remains unchanged
**And** the denial is logged in the audit trail

### Scenario 17: Admin Cannot Permanently Delete Transactions

**Given** a user with admin role on a project
**And** the project has soft-deleted transactions
**When** the admin attempts to permanently delete a transaction
**Then** the permanent delete operation is denied by RLS policy
**And** the "Permanently Delete" button is not visible in the UI
**And** attempting to permanently delete via API returns permission error
**And** the transaction remains in soft-deleted state
**And** the denial is logged in the audit trail

### Scenario 18: Last Admin Removal Warning

**Given** a user with admin role on a project
**And** the project has only one admin
**When** the admin attempts to remove themselves or change their role to 'member'
**Then** a confirmation dialog is shown
**And** the dialog message states: "This is the last admin. Removing them will leave the project without admin access."
**And** the admin can cancel the operation
**And** if confirmed, the operation proceeds

### Scenario 19: Multiple Admins Can Coexist

**Given** a project with one admin
**And** a member with role 'member'
**When** the admin promotes the member to 'admin'
**Then** the project now has two admins
**And** both admins have full admin permissions
**And** neither admin can manage the other admin
**And** both admins can manage regular members

### Scenario 20: Admin Can Cancel Invitations

**Given** a user with admin role on a project
**And** the project has pending invitations
**When** the admin cancels a pending invitation
**Then** the invitation is cancelled successfully
**And** the invited user can no longer accept the invitation
**And** the invitation is marked as cancelled in the database
**And** the cancellation is logged in the audit trail

---

## Edge Case Testing

### Edge Case 1: Self-Demotion Prevention

**Given** a user with admin role on a project
**When** the user attempts to change their own role from 'admin' to 'member'
**Then** the operation should require explicit confirmation
**And** the confirmation message should clearly state the implications
**And** if confirmed, the role change proceeds
**And** the user loses admin access immediately

### Edge Case 2: Circular Permission Prevention

**Given** a project with two admins (Admin A and Admin B)
**When** Admin A attempts to change Admin B's role
**Then** the operation is denied
**And** error message states "Admins cannot manage other admins"
**And** Admin B remains as admin
**And** Admin B similarly cannot manage Admin A

### Edge Case 3: Role Promotion with Existing Admin

**Given** a project with an existing admin
**And** a member with role 'member'
**When** the existing admin promotes the member to 'admin'
**Then** the promotion succeeds
**And** the project now has two admins
**And** neither admin can manage the other
**And** both can manage regular members

### Edge Case 4: Database Owner vs Role Owner Drift

**Given** a project where `projects.owner_id` differs from corresponding `project_members.role` entry
**And** a user with admin role
**When** the admin attempts an owner-restricted operation (delete project)
**Then** the operation is denied by RLS policy
**And** the defense-in-depth pattern (dual checks) prevents bypass
**And** the admin cannot exploit the drift scenario

### Edge Case 5: Rapid Role Changes

**Given** a user with admin role on a project
**When** the admin quickly makes multiple role changes in succession
**Then** all changes are applied in order
**And** no race conditions occur in RLS policy evaluation
**And** the final state matches the intended state
**And** all changes are logged individually

### Edge Case 6: Admin on Multiple Projects

**Given** a user with admin role on Project A
**And** the same user with member role on Project B
**When** the user views both projects
**Then** the user has admin permissions on Project A
**And** the user has member permissions on Project B
**And** the UI correctly shows different permissions for each project
**And** role-specific controls are appropriately shown/hidden

---

## Performance and Quality Gate Criteria

### Performance Requirements

**PR-AUTH-001: Database Query Performance**
- All RLS policy evaluations must complete within 100ms for standard queries
- Complex permission checks (member management) must complete within 200ms
- Permission checks must not add significant overhead to existing queries

**PR-AUTH-002: Frontend Rendering Performance**
- Admin-specific UI elements must render within 50ms after role data is fetched
- Permission check helper functions must execute within 10ms
- No perceptible lag when switching between admin and non-admin views

**PR-AUTH-003: Type Checking Performance**
- TypeScript compilation time increase must be less than 10%
- Type regeneration from database must complete within 30 seconds

### Security Requirements

**SR-AUTH-001: RLS Policy Coverage**
- All admin permissions must be enforced at database level
- No frontend permission check bypasses database security
- All RLS policies must use parameterized queries (no SQL injection risk)

**SR-AUTH-002: Audit Trail Completeness**
- All admin actions must be logged with timestamp, user ID, and action details
- Permission denials must be logged with context for troubleshooting
- Audit logs must be tamper-proof

**SR-AUTH-003: Defense-in-Depth Validation**
- Dual-check pattern (is_project_owner + is_project_member_with_role) must be maintained
- No single point of failure in permission enforcement
- Drift between owner_id and role entries must not create security holes

### Quality Requirements

**QR-AUTH-001: Test Coverage**
- Minimum 85% code coverage for admin-related functionality
- All RLS policies must have integration tests
- All edge cases must have specific test scenarios

**QR-AUTH-002: Type Safety**
- Zero TypeScript errors after implementation
- All role type unions must include 'admin' consistently
- No use of 'any' type for role-related code

**QR-AUTH-003: Localization**
- All admin-related UI strings must have English and Korean translations
- No hardcoded English strings in components
- Error messages must use i18n keys

**QR-AUTH-004: Accessibility**
- All admin controls must be keyboard accessible
- Role changes must be announced to screen readers
- Color must not be the only indicator for admin role (use icons/text)

### Regression Prevention

**RP-AUTH-001: Existing Functionality**
- All existing owner permissions must continue to work
- All existing member permissions must continue to work
- All existing viewer permissions must continue to work
- No degradation in existing feature performance

**RP-AUTH-002: Database Compatibility**
- Database migration must not break existing data
- Existing projects must continue to function after migration
- Rollback to previous schema must be possible without data loss

---

## Definition of Done

**A SPEC-AUTH-002 implementation is considered complete when:**

1. **Database Layer:**
   - [ ] All CHECK constraints updated to include 'admin' role
   - [ ] All RLS policies updated with admin permissions and restrictions
   - [ ] Migration script created and tested
   - [ ] All RLS policies have integration tests passing

2. **Type System:**
   - [ ] All TypeScript type definitions updated
   - [ ] Database types regenerated and verified
   - [ ] Zero TypeScript compilation errors
   - [ ] All type usages updated consistently

3. **Frontend Components:**
   - [ ] All permission checks updated to include 'admin'
   - [ ] All admin-specific UI elements implemented
   - [ ] Helper functions created for common permission checks
   - [ ] Confirmation dialogs implemented for edge cases

4. **Internationalization:**
   - [ ] All English translations added
   - [ ] All Korean translations added
   - [ ] No hardcoded strings remain
   - [ ] Error messages use i18n keys

5. **Testing:**
   - [ ] 85%+ test coverage achieved
   - [ ] All permission boundary tests passing
   - [ ] All admin capability tests passing
   - [ ] All edge case tests passing
   - [ ] All performance criteria met

6. **Documentation:**
   - [ ] API documentation updated (if applicable)
   - [ ] Code comments added for complex logic
   - [ ] Audit trail requirements documented
   - [ ] Rollback plan tested and documented

7. **Quality Gates:**
   - [ ] All security requirements met
   - [ ] All performance requirements met
   - [ ] All accessibility requirements met
   - [ ] All regression tests passing
   - [ ] Zero critical bugs
   - [ ] Zero high-severity security vulnerabilities

---

## Verification Methods

### Automated Testing

**Unit Tests:**
- Jest for TypeScript logic testing
- Mock Supabase client for permission check testing
- Test coverage reporting with Istanbul

**Integration Tests:**
- Supabase test database with RLS enabled
- Test database migration scripts
- Verify RLS policy enforcement

**E2E Tests:**
- Playwright for full user workflow testing
- Test admin login and UI rendering
- Test admin permission boundaries
- Test edge cases and error scenarios

### Manual Testing

**Security Testing:**
- Manual attempt to bypass RLS policies via API
- Verify frontend permission checks match backend
- Test SQL injection prevention
- Verify audit trail completeness

**Performance Testing:**
- Measure query execution times with admin permissions
- Load test with multiple admins
- Test RLS policy evaluation performance
- Verify frontend rendering performance

**Accessibility Testing:**
- Keyboard navigation testing
- Screen reader testing (NVDA, VoiceOver)
- Color contrast verification
- ARIA attribute validation

### Code Review

**Security Review:**
- Review all RLS policy changes
- Verify defense-in-depth pattern maintained
- Check for permission bypass vulnerabilities
- Audit trail completeness verification

**Code Quality Review:**
- TypeScript type safety verification
- Code consistency across components
- Helper function appropriateness
- Error handling completeness

**Localization Review:**
- Translation completeness verification
- Error message appropriateness
- UI text clarity and consistency
