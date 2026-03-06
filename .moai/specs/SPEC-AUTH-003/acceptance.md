# Acceptance Criteria: SPEC-AUTH-003 - Password Lock Feature

**SPEC ID:** SPEC-AUTH-003
**Title:** Password Lock Feature for Application Security
**Version:** 1.0.0
**Status:** Draft
**Created:** 2026-03-06

---

## Test Scenarios (Given-When-Then Format)

### Scenario 1: User Enables Password Lock with Password

**Given** a user is authenticated
**When** user navigates to ConfigPage settings
**And** user toggles password lock to enabled
**And** user selects "Password" as lock method
**And** user enters "Test1234" in new password field
**And** user enters "Test1234" in confirm password field
**And** user clicks Save button
**Then** password lock is enabled
**And** password hash is stored in localStorage
**And** user can proceed to use the app

### Scenario 2: User Enables Password Lock with PIN

**Given** a user is authenticated
**When** user navigates to ConfigPage settings
**And** user toggles password lock to enabled
**And** user selects "PIN" as lock method
**And** user enters "1234" in new PIN field
**And** user enters "1234" in confirm PIN field
**And** user clicks Save button
**Then** PIN lock is enabled
**And** PIN hash is stored in localStorage
**And** user can proceed to use the app

### Scenario 3: App Locks After Idle Timeout

**Given** password lock is enabled with 5-minute idle timeout
**And** user is authenticated and unlocked
**When** user remains inactive (no mouse movement, keyboard input) for 5 minutes
**Then** app locks automatically
**And** LockScreen overlay is displayed
**And** user cannot access protected routes without unlocking

### Scenario 4: App Locks on Background Visibility Change

**Given** password lock is enabled with "Immediate" background lock setting
**And** user is authenticated and unlocked
**When** user switches to another app or tab (document visibility becomes 'hidden')
**Then** app locks immediately
**And** LockScreen overlay is displayed when user returns
**And** user cannot access protected routes without unlocking

### Scenario 5: User Unlocks with Correct Password

**Given** app is locked and password method is enabled
**When** user enters correct password on LockScreen
**And** user clicks Unlock button
**Then** app unlocks successfully
**And** LockScreen overlay disappears
**And** user can access protected routes

### Scenario 6: User Unlocks with Correct PIN

**Given** app is locked and PIN method is enabled
**When** user enters correct 4-digit PIN on LockScreen
**And** user clicks Unlock button
**Then** app unlocks successfully
**And** LockScreen overlay disappears
**And** user can access protected routes

### Scenario 7: User Enters Wrong Password

**Given** app is locked and password method is enabled
**When** user enters incorrect password on LockScreen
**And** user clicks Unlock button
**Then** error message "Invalid password or PIN" is displayed
**And** attempt counter increments (e.g., "Attempt 2 of 5")
**And** app remains locked

### Scenario 8: User Exceeds Maximum Attempts

**Given** app is locked
**And** user has made 4 failed unlock attempts
**When** user enters incorrect password/PIN for the 5th time
**Then** error message "Too many failed attempts" is displayed
**And** lockout countdown timer is shown (e.g., "Please wait 30 seconds")
**And** password/PIN input is disabled

### Scenario 9: User Waits Through Lockout Period

**Given** app is locked out after 5 failed attempts
**And** lockout countdown shows 30 seconds remaining
**When** 30 seconds elapse
**Then** lockout period ends
**And** password/PIN input is re-enabled
**And** user can attempt unlock again

### Scenario 10: User Changes Password

**Given** password lock is enabled with password method
**And** user is unlocked
**When** user navigates to LockSettings
**And** user enters current password
**And** user enters new password
**And** user confirms new password
**And** user clicks Save button
**Then** password is updated successfully
**And** new password hash is stored
**And** previous password no longer works

### Scenario 11: User Changes Lock Method from Password to PIN

**Given** password lock is enabled with password method
**When** user navigates to LockSettings
**And** user selects "PIN" as lock method
**And** user enters 4-digit PIN
**And** user confirms PIN
**And** user clicks Save button
**Then** lock method changes to PIN
**And** PIN hash is stored
**And** password hash is cleared

### Scenario 12: User Configures Custom Idle Timeout

**Given** password lock is enabled with 5-minute default timeout
**When** user navigates to LockSettings
**And** user changes idle timeout to "15 minutes"
**Then** idle timeout is updated to 15 minutes
**And** setting is saved to localStorage

### Scenario 13: User Disables Password Lock

**Given** password lock is enabled
**When** user navigates to LockSettings
**And** user toggles password lock to disabled
**And** user confirms disable action
**Then** password lock is disabled
**And** lock settings are cleared from localStorage
**And** app no longer locks on idle or background

### Scenario 14: User Locks Manually

**Given** password lock is enabled
**And** user is authenticated and unlocked
**When** user clicks "Test Lock Now" button in LockSettings
**Then** app locks immediately
**And** LockScreen overlay is displayed
**And** user must enter password/PIN to unlock

### Scenario 15: Public Routes Remain Accessible When Locked

**Given** app is locked
**When** user navigates to /login route
**Then** login page is displayed (no lock screen overlay)
**When** user navigates to /config route
**Then** config page is displayed (no lock screen overlay)
**When** user navigates to /invite route
**Then** invite page is displayed (no lock screen overlay)
**When** user navigates to /cashcounter route
**Then** cash counter page is displayed (no lock screen overlay)

### Scenario 16: Protected Routes Blocked When Locked

**Given** app is locked
**When** user tries to access /projects route
**Then** blank page or placeholder is displayed
**And** LockScreen overlay is shown
**And** user cannot see project content without unlocking

### Scenario 17: Lock State Clears on Sign Out

**Given** password lock is enabled
**And** app is unlocked
**When** user clicks Sign Out button
**Then** Supabase authentication is signed out
**And** lock state is cleared
**And** lock settings are cleared from localStorage
**And** user is redirected to login page

### Scenario 18: Background Lock with Delay Setting

**Given** password lock is enabled with "delay" background lock setting
**And** user is authenticated and unlocked
**When** user switches to another app (visibility becomes 'hidden')
**And** user returns within 30 seconds
**Then** app is NOT locked
**When** user returns after 1 minute
**Then** app is locked
**And** LockScreen overlay is displayed

### Scenario 19: Never Lock on Background Setting

**Given** password lock is enabled with "never" background lock setting
**When** user switches to another app (visibility becomes 'hidden')
**And** user returns to the app after any duration
**Then** app is NOT locked
**And** user can continue using the app

### Scenario 20: Idle Timeout Never Setting

**Given** password lock is enabled with "never" idle timeout setting
**When** user is authenticated and unlocked
**And** user remains inactive for any duration
**Then** app does NOT lock based on idle time
**And** app remains unlocked until manual lock or background lock (if enabled)

### Scenario 21: Password Requirements Validation

**Given** user is enabling password lock with password method
**When** user enters "short" (less than 8 characters) as new password
**And** user clicks Save button
**Then** validation error "Password must be at least 8 characters" is displayed
**And** password lock is NOT enabled

### Scenario 22: PIN Requirements Validation

**Given** user is enabling password lock with PIN method
**When** user enters "12345" (5 digits) as new PIN
**And** user clicks Save button
**Then** validation error "PIN must be 4-6 digits" is displayed
**And** PIN lock is NOT enabled

### Scenario 23: Password Mismatch Validation

**Given** user is setting new password
**When** user enters "NewPass123" in new password field
**And** user enters "DifferentPass456" in confirm password field
**And** user clicks Save button
**Then** validation error "Passwords do not match" is displayed
**And** password is NOT updated

### Scenario 24: PIN Mismatch Validation

**Given** user is setting new PIN
**When** user enters "1234" in new PIN field
**And** user enters "4321" in confirm PIN field
**And** user clicks Save button
**Then** validation error "PINs do not match" is displayed
**And** PIN is NOT updated

### Scenario 25: Current Password Required for Change

**Given** password lock is already enabled with existing password
**When** user navigates to LockSettings to change password
**And** user enters new password without entering current password
**And** user clicks Save button
**Then** validation error "Current password required to change settings" is displayed
**And** password is NOT updated

### Scenario 26: Cross-Tab Lock State Sync

**Given** user has two tabs open with same app
**And** password lock is enabled
**When** user locks the app in Tab A
**And** user switches to Tab B
**Then** Tab B detects lock state from localStorage
**And** Tab B displays LockScreen overlay

### Scenario 27: Forgot Password Flow

**Given** app is locked
**When** user clicks "Forgot Password/PIN?" button
**Then** user is redirected to Supabase password reset page
**And** user can reset Supabase password
**And** after password reset, user can set new app lock password

### Scenario 28: Lock Screen User Avatar Display

**Given** app is locked
**And** user has an avatar URL in their profile
**When** LockScreen is displayed
**Then** user avatar image is shown
**When** user has no avatar URL
**Then** initial letter of email is displayed in circle

### Scenario 29: Lock Screen Keyboard Accessibility

**Given** app is locked
**When** user uses keyboard to navigate
**And** user presses Tab key
**Then** focus moves to password/PIN input field
**When** user presses Enter key while in password field
**And** password/PIN is entered
**Then** unlock is attempted
**When** user presses Escape key
**Then** modal closes (if applicable) or focus returns to appropriate element

### Scenario 30: Lock State Persists Across Page Reload

**Given** app is locked
**And** lock state is saved to localStorage
**When** user refreshes the page
**Then** app remains locked after reload
**And** LockScreen overlay is displayed

### Scenario 31: PIN Input Numeric Keypad on Mobile

**Given** app is locked with PIN method
**And** user is on mobile device
**When** user taps PIN input field
**Then** numeric keypad is displayed (inputMode="numeric")
**And** user can only enter numeric characters

### Scenario 32: Attempt Counter Display

**Given** app is locked
**When** user has made 2 failed unlock attempts
**Then** LockScreen displays "Attempt 3 of 5"
**When** user has made 0 failed attempts
**Then** attempt counter is NOT displayed

### Scenario 33: Lockout Countdown Display

**Given** app is locked out after 5 failed attempts
**And** lockout started 10 seconds ago
**Then** LockScreen displays "Please wait 20 seconds"
**And** countdown updates in real-time

### Scenario 34: Settings Save Error Handling

**Given** user is changing lock settings
**When** localStorage quota is exceeded
**And** user clicks Save button
**Then** error message "Failed to save settings" is displayed
**And** details explain localStorage issue
**And** settings remain unchanged

### Scenario 35: Language Switching in Lock Screen

**Given** app is locked
**And** user's language preference is Korean
**When** LockScreen is displayed
**Then** all UI text is in Korean
**And** error messages are in Korean
**And** button labels are in Korean

---

## Edge Case Testing

### Edge Case 1: Rapid Activity Events

**Given** password lock is enabled with 5-minute idle timeout
**When** user generates rapid mousemove events (e.g., during video playback)
**Then** idle timer is reset without performance issues
**And** app does NOT lock during active use

### Edge Case 2: Switching Between Public and Protected Routes

**Given** app is locked
**When** user is on /config (public route)
**And** user navigates to /projects (protected route)
**Then** LockScreen overlay appears
**And** projects page content is blocked

### Edge Case 3: Enabling Lock with Existing Supabase Session

**Given** user is already authenticated with Supabase
**And** user has never used password lock feature
**When** user enables password lock in settings
**And** user sets up password/PIN
**Then** Supabase session remains active
**And** password lock works as additional layer
**And** user does NOT need to re-authenticate with Supabase

### Edge Case 4: Disabling Lock While App Is Locked

**Given** app is locked
**When** user navigates to /config (public route)
**And** user tries to disable password lock in settings
**Then** disable action succeeds
**And** lock state is cleared
**And** user can access protected routes without password

### Edge Case 5: Changing Lock Method with Active Lock

**Given** app is locked with password method
**When** user unlocks the app
**And** immediately changes to PIN method in settings
**And** saves new PIN
**Then** lock method changes successfully
**And** next lock uses PIN instead of password

### Edge Case 6: Multiple Failed Attempts Across Tabs

**Given** user has two tabs open
**And** app is locked
**When** user makes 3 failed attempts in Tab A
**And** user switches to Tab B
**Then** Tab B shows attempt counter as 4 (3 + 1)
**And** both tabs share attempt counter via localStorage

### Edge Case 7: Idle Timeout Exactly Matches Timer

**Given** password lock is enabled with 1-minute idle timeout
**When** timer is set to lock after exactly 1 minute
**And** 1 minute elapses without activity
**Then** app locks immediately
**And** no race condition occurs

### Edge Case 8: Page Visibility API Not Supported

**Given** password lock is enabled
**When** browser does NOT support Page Visibility API
**Then** lock on background feature is disabled
**And** idle timeout still works if enabled
**And** user is informed of limitation (if applicable)

### Edge Case 9: localStorage Disabled or Full

**Given** user has disabled localStorage (private browsing mode)
**When** user tries to enable password lock
**Then** error message is displayed explaining localStorage issue
**And** password lock cannot be enabled
**Or** settings are stored in memory only (fallback)

### Edge Case 10: Zero Idle Timeout Setting

**Given** password lock is enabled
**When** user sets idle timeout to "never" (0 minutes)
**And** user becomes idle
**Then** app does NOT lock based on idle time
**And** other lock triggers (background, manual) still work

### Edge Case 11: Maximum PIN Length

**Given** user is setting up PIN
**When** user enters "123456" (6 digits)
**And** user clicks Save button
**Then** PIN is accepted (within 4-6 digit range)
**And** PIN lock is enabled

### Edge Case 12: Minimum Password Requirements

**Given** user is setting up password
**When** user enters "Test1234" (8 characters, letters and numbers)
**And** user clicks Save button
**Then** password is accepted (meets minimum requirements)
**And** password lock is enabled

### Edge Case 13: Password With Only Letters

**Given** user is setting up password
**When** user enters "abcdefgh" (8 characters, only letters)
**And** user clicks Save button
**Then** validation error is displayed requiring numbers
**And** password is NOT accepted

### Edge Case 14: Password With Only Numbers

**Given** user is setting up password
**When** user enters "12345678" (8 characters, only numbers)
**And** user clicks Save button
**Then** validation error is displayed requiring letters
**And** password is NOT accepted

### Edge Case 15: PIN With Letters

**Given** user is setting up PIN
**When** user enters "abcd" in PIN field
**And** user clicks Save button
**Then** input is rejected (pattern requires numbers only)
**And** PIN is NOT accepted

### Edge Case 16: Screen Reader Announcement of Lock State

**Given** app is locked
**When** screen reader is active
**Then** LockScreen content is announced
**And** error messages are announced via ARIA live region
**And** attempt counter is announced

### Edge Case 17: High Contrast Mode Compatibility

**Given** user has high contrast mode enabled in OS
**When** LockScreen is displayed
**Then** lock screen is readable in high contrast mode
**And** text meets WCAG contrast requirements

### Edge Case 18: Network Offline During Settings Save

**Given** user is changing lock settings
**When** network is offline
**And** user clicks Save button
**Then** settings are saved to localStorage (works offline)
**And** no network error is shown

### Edge Case 19: Multiple Sessions in Different Browsers

**Given** user has app open in Chrome and Firefox
**When** user locks app in Chrome
**Then** Firefox session is NOT affected (localStorage is browser-specific)
**And** each browser maintains independent lock state

### Edge Case 20: Emergency Access to Config Page

**Given** app is locked
**And** user forgets password/PIN
**When** user needs to disable password lock
**Then** user can access /config route (public route)
**And** user can disable lock without entering password
**And** this is intended behavior for emergency access

---

## Performance and Quality Gate Criteria

### Performance Requirements

**PR-AUTH-003-001: Lock Screen Rendering**
- LockScreen must render within 100ms of lock state change
- No layout shift when lock screen appears
- Smooth transition animation (60fps)

**PR-AUTH-003-002: Idle Detection Performance**
- Idle timer must reset within 50ms of user activity event
- Multiple rapid events must not cause performance issues
- Memory usage must not grow over time (cleanup event listeners)

**PR-AUTH-003-003: localStorage Operations**
- Settings read/write must complete within 10ms
- Multiple tabs syncing must not block UI
- Storage quota check must handle errors gracefully

### Security Requirements

**SR-AUTH-003-001: Password Hash Storage**
- Password/PIN hash must be stored (not plain text)
- Hash must not be easily reversible
- Storage must not be in URL or cookies

**SR-AUTH-003-002: Rate Limiting**
- Maximum 5 failed attempts before lockout
- Lockout duration must be enforced on client side
- Lockout state must persist across page reloads

**SR-AUTH-003-003: Public Route Exemption**
- Lock screen must NOT display on public routes
- Public routes must remain accessible regardless of lock state
- Navigation to public routes must bypass lock check

**SR-AUTH-003-004: Sign Out Cleanup**
- All lock state must be cleared on Supabase sign out
- Lock settings must be cleared on sign out (optional, per requirement)
- Redirect to login page must work correctly

### Quality Requirements

**QR-AUTH-003-001: Type Safety**
- Zero TypeScript errors after implementation
- All lock types are properly defined
- No use of 'any' type for lock-related code

**QR-AUTH-003-002: Test Coverage**
- Minimum 85% code coverage for lock functionality
- All lock/unlock scenarios have tests
- All validation rules have tests

**QR-AUTH-003-003: Localization**
- All UI strings have English and Korean translations
- No hardcoded English strings in components
- Error messages use i18n keys

**QR-AUTH-003-004: Accessibility**
- All lock controls are keyboard accessible
- Screen reader announces lock state changes
- Color contrast meets WCAG AA standards
- Focus indicators are visible

**QR-AUTH-003-005: Error Handling**
- All error cases have user-friendly messages
- Storage errors are handled gracefully
- Validation errors are clear and actionable

### Regression Prevention

**RP-AUTH-003-001: Existing Auth Flow**
- Supabase authentication must continue to work unchanged
- Existing auth state transitions work correctly
- Sign in/sign out flows are not affected

**RP-AUTH-003-002: Public Routes**
- All public routes remain accessible as before
- Navigation to public routes works correctly
- Cash counter page functionality unchanged

**RP-AUTH-003-003: Existing Settings**
- Existing ConfigPage settings continue to work
- Settings persistence still works
- No breaking changes to settings storage

---

## Definition of Done

**A SPEC-AUTH-003 implementation is considered complete when:**

1. **Type System:**
   - [ ] All lock types defined in src/types/index.ts
   - [ ] AuthState extended with lockState field
   - [ ] Zero TypeScript compilation errors

2. **Core Hook:**
   - [ ] useLock hook implemented with all functionality
   - [ ] Lock state management working correctly
   - [ ] Settings persistence to localStorage working
   - [ ] Idle detection working correctly
   - [ ] Background visibility detection working correctly
   - [ ] Password/PIN verification working correctly
   - [ ] Rate limiting enforced (5 attempts, 30-second lockout)

3. **LockScreen Component:**
   - [ ] LockScreen component renders correctly
   - [ ] Password/PIN input with masking working
   - [ ] Error message display working
   - [ ] Attempt counter display working
   - [ ] Lockout countdown timer working
   - [ ] "Forgot Password/PIN" button working
   - [ ] User avatar display working
   - [ ] Responsive design for mobile and desktop

4. **LockSettings Component:**
   - [ ] LockSettings component renders correctly
   - [ ] Enable/disable toggle working
   - [ ] Password/PIN method selection working
   - [ ] Password setup/change form working
   - [ ] PIN setup/change form working
   - [ ] Idle timeout configuration working
   - [ ] Lock on background configuration working
   - [ ] Test lock button working
   - [ ] Form validation working correctly

5. **AuthContext Integration:**
   - [ ] AuthContext includes lockState
   - [ ] setLockState function exposed
   - [ ] Sign out clears lock state
   - [ ] Lock state accessible via useAuth

6. **App Component Integration:**
   - [ ] LockScreen renders when locked
   - [ ] Public routes exempt from lock screen
   - [ ] Protected routes blocked when locked
   - [ ] LockSettings accessible via ConfigPage

7. **Internationalization:**
   - [ ] All English translations added
   - [ ] All Korean translations added
   - [ ] No hardcoded strings remain

8. **Testing:**
   - [ ] 85%+ test coverage achieved
   - [ ] All lock/unlock scenarios tested
   - [ ] All validation scenarios tested
   - [ ] All edge cases tested
   - [ ] Manual testing completed

9. **Quality Gates:**
   - [ ] All performance requirements met
   - [ ] All security requirements met
   - [ ] All accessibility requirements met
   - [ ] Zero TypeScript errors
   - [ ] Zero critical bugs

---

## Verification Methods

### Automated Testing

**Unit Tests:**
- Test lock state management
- Test password/PIN hash verification
- Test settings persistence
- Test idle detection logic
- Test rate limiting enforcement

**Integration Tests:**
- Test lock screen rendering
- Test lock/unlock flows
- Test settings update flows
- Test cross-tab synchronization
- Test public route exemption

**E2E Tests:**
- Test complete lock/unlock workflow
- Test settings configuration
- Test idle timeout behavior
- Test background lock behavior
- Test mobile PIN input

### Manual Testing

**Security Testing:**
- Verify password/PIN not stored in plain text
- Verify lock cannot be bypassed via URL manipulation
- Verify rate limiting is enforced
- Test forgot password flow

**Performance Testing:**
- Measure lock screen render time
- Test idle detection with rapid events
- Test with multiple tabs open
- Verify memory usage over time

**Accessibility Testing:**
- Keyboard navigation testing
- Screen reader testing (NVDA, VoiceOver)
- Color contrast verification
- Focus indicator verification

**Localization Testing:**
- Verify all English strings display
- Verify all Korean strings display
- Test language switching in locked state
- Verify error messages in both languages

### Code Review

**Security Review:**
- Review password hash implementation
- Verify rate limiting logic
- Check for XSS vulnerabilities
- Verify localStorage usage

**Code Quality Review:**
- TypeScript type safety verification
- Code consistency across components
- Error handling completeness
- React best practices

**Localization Review:**
- Translation completeness verification
- Error message appropriateness
- UI text clarity and consistency
