# Implementation Plan: SPEC-AUTH-003 - Password Lock Feature

**SPEC ID:** SPEC-AUTH-003
**Title:** Password Lock Feature for Application Security
**Version:** 1.0.0
**Status:** Draft
**Created:** 2026-03-06

---

## Task Decomposition

### Phase 1: Type System Setup

**Tasks:**
1. Add LockState, LockMethod, LockTrigger, LockSettings, LockContextValue types to src/types/index.ts
2. Update AuthState interface to include lockState field
3. Create AuthStateWithLock type extending AuthState
4. Run TypeScript compiler to verify type safety

**Estimated Complexity:** Low
**Dependencies:** None

### Phase 2: useLock Hook Implementation

**Tasks:**
1. Create src/hooks/useLock.ts hook file
2. Implement simpleHash function for password/PIN storage
3. Implement useIdleDetector hook for activity tracking
4. Implement lock state management (locked, unlocked, locked_out)
5. Implement settings persistence to localStorage
6. Implement unlock function with password/PIN verification
7. Implement rate limiting (5 attempts, 30-second lockout)
8. Implement background visibility detection
9. Implement updateSettings and resetLock functions
10. Create useIsPublicRoute helper hook

**Estimated Complexity:** Medium
**Dependencies:** Phase 1 (Type System)

### Phase 3: LockScreen Component

**Tasks:**
1. Create src/components/LockScreen.tsx component
2. Implement password/PIN input with masking
3. Implement error message display
4. Implement attempt counter display
5. Implement lockout countdown timer
6. Implement "Forgot Password/PIN" button
7. Implement user avatar display
8. Implement responsive design for mobile and desktop
9. Add accessibility attributes (ARIA labels, keyboard navigation)

**Estimated Complexity:** Medium
**Dependencies:** Phase 2 (useLock Hook), Phase 1 (Type System)

### Phase 4: LockSettings Component

**Tasks:**
1. Create src/components/LockSettings.tsx component
2. Implement enable/disable toggle
3. Implement password/PIN method selection
4. Implement password setup/change form
5. Implement PIN setup/change form
6. Implement idle timeout dropdown (never, 1, 5, 15, 30 minutes)
7. Implement lock on background dropdown (immediate, delay, never)
8. Implement form validation
9. Implement settings persistence
10. Add "Test Lock Now" button

**Estimated Complexity:** Medium
**Dependencies:** Phase 2 (useLock Hook), Phase 1 (Type System)

### Phase 5: AuthContext Integration

**Tasks:**
1. Update src/hooks/useAuth.tsx to include lockState in AuthContextType
2. Add lockState to initial AuthState
3. Update signOut function to clear lock state
4. Add setLockState function to AuthContextType
5. Update AuthProvider to expose lockState and setLockState

**Estimated Complexity:** Low
**Dependencies:** Phase 1 (Type System), Phase 2 (useLock Hook)

### Phase 6: App Component Integration

**Tasks:**
1. Update src/App.tsx to import LockScreen and useLock
2. Import LockSettings component
3. Determine effective lock state from hook and context
4. Add isPublicRoute check for lock screen exemption
5. Render LockScreen overlay when locked and authenticated
6. Update routing to block protected routes when locked
7. Add useSupabase skip for locked state
8. Add LockSettings to ConfigPage authenticated mode

**Estimated Complexity:** Medium
**Dependencies:** Phase 3 (LockScreen), Phase 4 (LockSettings), Phase 5 (AuthContext)

### Phase 7: Internationalization

**Tasks:**
1. Add lock-related keys to src/locales/en.json
2. Add Korean translations to src/locales/ko.json
3. Verify all UI strings use i18n keys
4. Test language switching functionality

**Estimated Complexity:** Low
**Dependencies:** None

---

## Technical Approach

### Architecture Pattern

**State Management:**
- Lock state managed via useLock hook (independent of Supabase auth)
- Lock state stored in localStorage for persistence
- Multiple tabs sync via storage events
- AuthContext extended to include lockState for app-wide access

**Component Structure:**
```
App
├── AuthProvider (includes lockState)
│   └── useLock Hook (manages lock state)
├── LockScreen (overlay when locked)
├── Routes
│   ├── Public Routes (no lock screen)
│   └── Protected Routes (show lock screen when locked)
└── ConfigPage
    └── LockSettings (configuration UI)
```

### Data Flow

**Lock Trigger Flow:**
1. User activity detected → Reset idle timer
2. Idle timer expires → Call lock('idle') → Update localStorage → LockState = 'locked'
3. OR: Visibility changes to 'hidden' → Call lock('background') → Update localStorage → LockState = 'locked'
4. OR: User clicks lock button → Call lock('manual') → Update localStorage → LockState = 'locked'

**Unlock Flow:**
1. User enters password/PIN → Call unlock(password)
2. Verify hash against stored hash
3. If match → Reset attempts, set LockState = 'unlocked', update localStorage
4. If no match → Increment attempts, show error
5. If attempts >= 5 → Set LockState = 'locked_out', set lockout timestamp

**Settings Update Flow:**
1. User changes settings in LockSettings
2. Call updateSettings(newSettings)
3. Update settings state
4. Save to localStorage
5. If disabled, clear lock state

### Technology Choices

**Storage:**
- localStorage chosen for lock settings and state
- Rationale: Simple, sufficient for device-specific configuration
- Alternative: IndexedDB (not needed for this use case)

**Hash Function:**
- Simple custom hash function implemented
- Rationale: Client-side lock protection, not cryptographic security
- Alternative: bcrypt (too heavy for client-side use case)

**Idle Detection:**
- Event listener pattern (mousemove, keydown, mousedown, touchstart, scroll)
- Rationale: Standard approach for web applications
- Alternative: Page Visibility API only (less accurate for idle detection)

**State Sync:**
- localStorage events for cross-tab sync
- Rationale: Simple, works for web applications
- Alternative: BroadcastChannel API (not needed for this use case)

---

## Risk Analysis

### Security Risks

**Risk 1: localStorage Access via Dev Tools**
- Description: Users can access localStorage via browser dev tools and potentially modify lock settings
- Impact: Low - This is an additional security layer, not primary authentication
- Mitigation: Hash storage prevents casual inspection; appropriate for this use case

**Risk 2: Simple Hash Function Not Cryptographically Secure**
- Description: The simple hash function is not designed for cryptographic security
- Impact: Low - This is a client-side lock, not a password vault
- Mitigation: Document limitations; this is device protection, not data encryption

**Risk 3: Brute Force Attacks on Unlock**
- Description: Attacker could attempt multiple passwords to unlock
- Impact: Medium - Rate limiting mitigates but not eliminates risk
- Mitigation: Implement rate limiting (5 attempts, 30-second lockout)

### UX Risks

**Risk 4: App Locking While User Is Active**
- Description: Idle detection might incorrectly trigger while user is active (watching video)
- Impact: Medium - User experience frustration
- Mitigation: Include wide range of activity events; clear documentation

**Risk 5: Background Lock While User Switches Apps Briefly**
- Description: App locks immediately when switching to check notifications
- Impact: Medium - User experience frustration
- Mitigation: Configurable "delay" option for background lock

### Technical Risks

**Risk 6: localStorage Quota Exceeded**
- Description: localStorage has storage limit (typically 5-10MB)
- Impact: Low - Lock settings are small (<1KB)
- Mitigation: Handle quota errors gracefully

**Risk 7: Event Listener Performance Impact**
- Description: Multiple event listeners for idle detection
- Impact: Low - Modern browsers handle these efficiently
- Mitigation: Use passive event listeners where possible

### Migration Risks

**Risk 8: Breaking Changes to AuthContext**
- Description: Adding lockState to AuthContext could affect existing code
- Impact: Low - LockState has default value 'unlocked'
- Mitigation: Default to 'unlocked', no existing code uses lockState initially

---

## Implementation Order

### Priority 1 (Must Have - Core Lock Functionality)

1. **Type System Setup (Phase 1)** - Foundation for all lock functionality
2. **useLock Hook (Phase 2)** - Core lock state management
3. **LockScreen Component (Phase 3)** - User-facing lock UI
4. **App Component Integration (Phase 6)** - Display lock screen when locked

**Rationale:** These components form the minimum viable product for password lock feature.

### Priority 2 (Must Have - Settings Management)

5. **LockSettings Component (Phase 4)** - User configuration interface
6. **ConfigPage Integration (Phase 6)** - Access to lock settings
7. **Internationalization (Phase 7)** - User-facing strings in multiple languages

**Rationale:** Users need to configure lock settings for the feature to be useful.

### Priority 3 (Nice to Have - Enhanced Experience)

8. **AuthContext Integration (Phase 5)** - Seamless integration with existing auth system

**Rationale:** Provides cleaner API but not strictly required (can use useLock directly).

### Optional (Out of Scope for v1)

9. **Biometric Unlock** - Future enhancement
10. **Cross-device Settings Sync** - Future enhancement
11. **Lock History/audit** - Future enhancement

---

## Dependencies

### Internal Dependencies

- **src/types/index.ts** - Type definitions
- **src/hooks/useAuth.tsx** - Existing auth context
- **src/App.tsx** - Main application component
- **src/pages/ConfigPage.tsx** - Configuration page

### External Dependencies

- **react** - Component library (already in package.json)
- **@supabase/supabase-js** - Authentication (already in package.json)
- **react-i18next** - Internationalization (already in package.json)

### No New Dependencies Required

All required dependencies are already in package.json.

---

## Success Criteria

The implementation is considered complete when:

1. **Type System:**
   - [ ] All lock types defined in src/types/index.ts
   - [ ] AuthState extended with lockState field
   - [ ] Zero TypeScript compilation errors

2. **Core Functionality:**
   - [ ] useLock hook manages lock state correctly
   - [ ] LockScreen displays when app is locked
   - [ ] Password/PIN verification works
   - [ ] Rate limiting enforced (5 attempts, 30-second lockout)

3. **Settings Management:**
   - [ ] LockSettings component functional
   - [ ] Users can enable/disable lock
   - [ ] Users can set/change password or PIN
   - [ ] Users can configure idle timeout
   - [ ] Users can configure background lock behavior
   - [ ] Settings persist across sessions

4. **Idle Detection:**
   - [ ] Idle timer resets on user activity
   - [ ] App locks after idle timeout
   - [ ] Activity events don't impact performance

5. **Background Detection:**
   - [ ] App locks when going to background (if configured)
   - [ ] App lock state persists when returning to tab

6. **Integration:**
   - [ ] App.tsx renders LockScreen when locked
   - [ ] Public routes exempt from lock screen
   - [ ] Lock state clears on sign out
   - [ ] LockSettings accessible via ConfigPage

7. **Internationalization:**
   - [ ] All UI strings have English and Korean translations
   - [ ] No hardcoded strings in components

8. **Testing:**
   - [ ] Manual testing of lock/unlock flows
   - [ ] Testing of settings changes
   - [ ] Testing of idle timeout
   - [ ] Testing of background lock
   - [ ] Testing of rate limiting
   - [ ] Testing of public route exemption

9. **Quality:**
   - [ ] All accessibility requirements met
   - [ ] All security mitigations in place
   - [ ] Code follows project conventions
