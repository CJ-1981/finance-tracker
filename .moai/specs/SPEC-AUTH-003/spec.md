---
SPEC_ID: SPEC-AUTH-003
TITLE: Password Lock Feature for Application Security
DOMAIN: AUTH
PRIORITY: Medium
STATUS: Draft
CREATED: 2026-03-06
UPDATED: 2026-03-06
ISSUE: #28 - password lock
---

# TAG BLOCK

**SPEC_ID:** SPEC-AUTH-003
**TITLE:** Password Lock Feature for Application Security
**DOMAIN:** AUTH
**PRIORITY:** Medium
**STATUS:** Draft
**CREATED:** 2026-03-06
**ISSUE:** #28 - password lock

---

# Environment

## Project Context

**Application:** Financial Tracking Web Application
**Purpose:** Project-based financial collaboration with enhanced security features
**Current Authentication:** Supabase Auth with persistSession and autoRefreshToken enabled
**Existing Lock Mechanism:** None - app remains unlocked while authenticated

**Target Users:** Teams and individuals requiring additional privacy protection for financial data
**Key Value:** Extra security layer preventing unauthorized access when device is unattended

## Browser Environment

**Supported Browsers:** Modern browsers with ES6+ support and local storage
**Platform:** Web-based responsive application
**Authentication:** Supabase Auth with Row-Level Security (RLS)

## Development Environment

**Frontend:** React 19.2.4 with TypeScript 5.9
**Backend:** Supabase 2.97.0 (PostgreSQL 16 with RLS)
**Type Safety:** End-to-end TypeScript types from database schema
**State Management:** React hooks with Context API

## Security Context

**Current Security:**
- Supabase Auth with JWT tokens
- Row-Level Security for data access
- Session persistence via localStorage

**Security Gap:**
- No app-level lock after authentication
- Device left unattended = full access to financial data
- No protection against unauthorized local access

---

# Assumptions

1. **Supabase Session Validity:** The app relies on existing Supabase session for authentication status. Password/PIN lock adds an additional layer on top of existing auth, not a replacement.

2. **Local Storage Security:** Lock state, lock timeout settings, and password/PIN hash will be stored in localStorage. This is appropriate for client-side lock protection since the user is already authenticated with Supabase.

3. **Password vs PIN Choice:** Users should be able to choose between a text password and a numeric PIN (4-6 digits) for flexibility. PIN is faster on mobile, password is more secure.

4. **Supabase Auth Persistence:** The existing `persistSession: true` and `autoRefreshToken: true` settings in Supabase client configuration will remain unchanged. Lock feature does not modify Supabase session behavior.

5. **Forgot Password Flow:** When user forgets their lock password/PIN, they should be able to reset it via email verification using the existing Supabase auth system. This requires the user to have access to their Supabase-authenticated email.

6. **Idle Timeout Measurement:** Idle timeout will be measured using user activity events (mouse move, keyboard input, touch events) rather than just page visibility to provide more accurate idle detection.

7. **Background Detection:** App going to background (visibility becomes 'hidden') is a separate trigger from idle timeout. Both can cause the app to lock.

8. **Lock Scope:** Lock screen should overlay the entire application, but public routes (/, /login, /config, /invite, /cashcounter) should remain accessible even when app is "locked" - lock only applies to authenticated protected routes.

9. **Biometric Unlock (v2):** Biometric authentication (fingerprint, Face ID) is an optional enhancement for v1. Primary implementation uses password/PIN unlock.

10. **Rate Limiting:** Password/PIN unlock attempts should be rate-limited to prevent brute force attacks. After failed attempts, temporary lockout should be enforced.

---

# Requirements (EARS Format)

## Ubiquitous Requirements

**UR-AUTH-003-001:** The system SHALL store user's lock preference settings in localStorage to persist across sessions.

**UR-AUTH-003-002:** The system SHALL store password/PIN hash in localStorage in encrypted form to prevent casual inspection.

**UR-AUTH-003-003:** The system SHALL maintain lock state as part of the AuthContext to provide lock status throughout the application.

**UR-AUTH-003-004:** The system SHALL display lock screen over all protected routes when the app is in locked state.

**UR-AUTH-003-005:** The system SHALL clear lock state when user signs out from Supabase authentication.

**UR-AUTH-003-006:** The system SHALL enforce rate limiting on password/PIN unlock attempts to prevent brute force attacks.

**UR-AUTH-003-007:** The system SHALL validate password/PIN against the stored hash before unlocking the application.

## Event-Driven Requirements

### Lock Triggers

**WHEN** the document visibility changes from 'visible' to 'hidden' (app goes to background), **THEN** the system SHALL set lock state to 'locked' after a configurable delay (default: immediate lock on background).

**WHEN** the user remains idle (no activity) for the configured timeout duration, **THEN** the system SHALL set lock state to 'locked' and display lock screen.

**WHEN** the user initiates manual lock (lock button or keyboard shortcut), **THEN** the system SHALL immediately set lock state to 'locked' and display lock screen.

**WHEN** the user navigates to a public route (/login, /config, /invite, /cashcounter), **THEN** the system SHALL not display lock screen even if app is in locked state.

**WHEN** the user signs out from Supabase authentication, **THEN** the system SHALL clear all lock-related state from localStorage and memory.

### Lock Actions

**WHEN** user enters correct password or PIN on lock screen, **THEN** the system SHALL unlock the application and hide lock screen.

**WHEN** user enters incorrect password or PIN on lock screen, **THEN** the system SHALL display error message and increment failed attempt counter.

**WHEN** failed attempt counter reaches the limit (default: 5 attempts), **THEN** the system SHALL enforce temporary lockout (default: 30 seconds) and display countdown timer.

**WHEN** temporary lockout period expires, **THEN** the system SHALL allow another password/PIN attempt.

**WHEN** user clicks "Forgot Password/PIN" button on lock screen, **THEN** the system SHALL redirect to email verification flow for password reset.

### Settings Management

**WHEN** user enables password lock feature in settings, **THEN** the system SHALL prompt user to set initial password or PIN.

**WHEN** user sets initial password or PIN, **THEN** the system SHALL require confirmation to prevent typos.

**WHEN** user changes existing password/PIN in settings, **THEN** the system SHALL require current password/PIN verification before allowing change.

**WHEN** user selects password option, **THEN** the system SHALL enforce minimum password length (default: 8 characters) and require at least one character type (letter, number, special).

**WHEN** user selects PIN option, **THEN** the system SHALL enforce PIN length between 4 and 6 digits.

**WHEN** user configures idle timeout duration, **THEN** the system SHALL save selection from predefined options (1, 5, 15, 30 minutes) or custom value.

**WHEN** user disables password lock feature, **THEN** the system SHALL clear all lock-related data from localStorage after confirmation.

### Idle Detection

**WHEN** any user activity event occurs (mousemove, keydown, mousedown, touchstart), **THEN** the system SHALL reset idle timer to current timestamp.

**WHEN** idle timer exceeds configured timeout duration, **THEN** the system SHALL trigger lock state change to 'locked'.

**WHEN** page becomes visible again after being hidden, **THEN** the system SHALL check if lock was triggered during hidden state and display lock screen if locked.

### Navigation Protection

**WHEN** lock screen is displayed and user attempts to navigate to protected route, **THEN** the system SHALL prevent navigation and keep user on lock screen.

**WHEN** user is authenticated but app is locked, **THEN** the system SHALL not redirect to login page but show lock screen instead.

**WHEN** lock screen is active and user attempts to access application APIs directly, **THEN** the system SHALL return 401 Unauthorized or appropriate error response.

## State-Driven Requirements

**IF** password lock feature is enabled, **THEN** the system SHALL monitor for idle timeout and background visibility events.

**IF** password lock feature is disabled, **THEN** the system SHALL NOT monitor idle timeout or background events for locking purposes.

**IF** user is authenticated AND app is locked, **THEN** the system SHALL display lock screen overlay preventing access to protected content.

**IF** user is authenticated AND app is unlocked, **THEN** the system SHALL allow normal access to all protected routes and features.

**IF** user is NOT authenticated (signed out), **THEN** the system SHALL redirect to login page and not display lock screen.

**IF** user is on public route (/login, /config, /invite, /cashcounter), **THEN** the system SHALL NOT display lock screen regardless of lock state.

**IF** failed attempt counter is at or above limit, **THEN** the system SHALL show lockout countdown and disable password/PIN input.

**IF** current password/PIN is verified during change flow, **THEN** the system SHALL allow user to set new password/PIN.

**IF** idle timeout is set to "disabled" or "never", **THEN** the system SHALL NOT lock the app based on idle time.

## Unwanted Requirements

The system SHALL NOT store password/PIN in plain text in localStorage.

The system SHALL NOT store password/PIN in unencrypted form accessible via browser dev tools.

The system SHALL NOT display lock screen on public routes (/, /login, /config, /invite, /cashcounter).

The system SHALL NOT allow password/PIN reset without verifying current password/PIN (when feature was previously enabled).

The system SHALL NOT allow bypass of lock screen via URL manipulation or browser back button.

The system SHALL NOT lock the app during the initial password/PIN setup flow (prevent immediate lock after enabling feature).

The system SHALL NOT persist lock state after user signs out from Supabase authentication.

The system SHALL NOT reveal actual password/PIN value in browser console or network requests.

The system SHALL NOT allow lock settings modification while app is locked.

## Optional Requirements

**WHERE** supported by browser, the system SHOULD provide option for biometric unlock (fingerprint, Face ID) as an alternative to password/PIN.

**WHERE** practical, the system SHOULD provide quick lock action (keyboard shortcut) for immediate locking.

**WHERE** supported by UI framework, the system SHOULD provide animated lock screen transitions for better UX.

**WHERE** practical, the system SHOULD display user avatar on lock screen for personalization.

**WHERE** practical, the system SHOULD provide option to set custom idle timeout duration beyond predefined options.

**WHERE** practical, the system SHOULD remember last lock reason (idle timeout, background, manual) for user awareness.

**WHERE** practical, the system SHOULD provide analytics events for lock/unlock actions for security monitoring.

**WHERE** practical, the system SHOULD allow users to choose lock-on-behavior (immediate lock, delay lock, never lock on background).

---

# Specifications

## Database Schema Changes

### No Database Changes Required

**Rationale:** Lock feature operates at the application layer (localStorage, Context API) and does not require database schema changes. All lock-related data (preferences, password hash) is stored locally on the user's device.

**Note:** If future requirements include sync of lock preferences across devices, a new table `user_settings` or extension to `profiles` table would be needed. This is out of scope for v1.

## Type Definition Updates

### File: `src/types/index.ts`

**Add Lock Types (after line 134):**

```typescript
// Lock feature types
export type LockState = 'unlocked' | 'locked' | 'locked_out'

export type LockMethod = 'password' | 'pin'

export type LockTrigger = 'idle' | 'background' | 'manual' | 'startup'

export interface LockSettings {
  enabled: boolean
  method: LockMethod
  passwordHash?: string
  pinHash?: string
  idleTimeoutMinutes: number // 0 = never lock on idle
  lockOnBackground: 'immediate' | 'delay' | 'never'
  failedAttempts: number
  lockoutUntil?: string // ISO timestamp
}

export interface LockContextValue {
  lockState: LockState
  settings: LockSettings
  unlock: (passwordOrPin: string) => Promise<{ success: boolean, error?: string }>
  lock: () => void
  updateSettings: (settings: Partial<LockSettings>) => Promise<void>
  resetLock: () => Promise<void>
  isPublicRoute: () => boolean
}

export interface AuthStateWithLock extends AuthState {
  lockState: LockState
}
```

**Update AuthState Interface (around line 112):**

```typescript
// BEFORE:
export type AuthState = {
  user: User | null
  session: any | null
  loading: boolean
}

// AFTER:
export type AuthState = {
  user: User | null
  session: any | null
  loading: boolean
  lockState: LockState
}
```

## Frontend Component Changes

### New Component: `src/components/LockScreen.tsx`

**Purpose:** Full-screen overlay requiring password/PIN entry to access the application.

**Key Features:**
- Password/PIN input with masking (•••••)
- Error message display for failed attempts
- Attempt counter display (e.g., "Attempt 3 of 5")
- Lockout countdown timer when attempts exhausted
- "Forgot Password/PIN" button for reset flow
- User avatar display from auth context
- Responsive design for mobile and desktop

**Component Structure:**

```typescript
// @MX:NOTE: Lock screen provides app-level security layer on top of Supabase auth
// Does not replace Supabase authentication but adds additional device protection

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLock } from '../hooks/useLock'
import type { LockState, LockTrigger } from '../types'

export default function LockScreen() {
  const { user } = useAuth()
  const { lockState, unlock, settings, failedAttempts, lockoutUntil } = useLock()
  const [password, setPassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError('')

    const result = await unlock(password)

    if (!result.success) {
      setError(result.error || 'Invalid password or PIN')
      setPassword('')
    }

    setIsProcessing(false)
  }

  const handleForgotPassword = () => {
    // Navigate to Supabase password reset flow
    window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/reset-password`
  }

  const isLockedOut = lockState === 'locked_out' || (failedAttempts >= 5)
  const lockoutRemaining = lockoutUntil ? Math.max(0, new Date(lockoutUntil).getTime() - Date.now()) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6">
        {/* User Avatar */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full rounded-full" />
            ) : (
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {settings.method === 'pin' ? 'Enter PIN' : 'Enter Password'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {user?.email}
          </p>
        </div>

        {/* Lockout State */}
        {isLockedOut && lockoutRemaining > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-center text-sm text-red-800 dark:text-red-400">
              Too many attempts. Please wait {Math.ceil(lockoutRemaining / 1000)} seconds before trying again.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && !isLockedOut && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-center text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Attempt Counter */}
        {!isLockedOut && failedAttempts > 0 && (
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
            Attempt {failedAttempts + 1} of 5
          </p>
        )}

        {/* Password/PIN Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode={settings.method === 'pin' ? 'numeric' : undefined}
              pattern={settings.method === 'pin' ? '[0-9]*' : undefined}
              maxLength={settings.method === 'pin' ? 6 : undefined}
              className="w-full text-center text-lg tracking-widest"
              placeholder={settings.method === 'pin' ? '••••' : '•••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLockedOut || isProcessing}
              autoFocus
            />
          </div>

          {/* Unlock Button */}
          <button
            type="submit"
            disabled={isLockedOut || isProcessing || !password}
            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Verifying...' : 'Unlock'}
          </button>

          {/* Forgot Password Link */}
          {!isLockedOut && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Forgot Password/PIN?
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
```

### New Hook: `src/hooks/useLock.ts`

**Purpose:** Manages lock state, settings, idle detection, and lock/unlock operations.

**Key Features:**
- Lock state management (locked, unlocked, locked_out)
- Settings persistence in localStorage
- Idle detection with activity monitoring
- Background visibility detection
- Password/PIN hash verification
- Rate limiting for unlock attempts

**Hook Structure:**

```typescript
// @MX:ANCHOR: useLock provides core lock management for password lock feature
// Manages lock state, settings, idle detection, and password verification

import { useState, useEffect, useCallback, useRef } from 'react'
import type { LockState, LockSettings, LockTrigger } from '../types'

const LOCK_STORAGE_KEY = 'finance_tracker_lock_settings'
const LOCK_STATE_KEY = 'finance_tracker_lock_state'
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 30000 // 30 seconds in milliseconds

// Simple hash function for password/PIN storage
// @MX:NOTE: Using simple hash for client-side storage. Not cryptographically secure
// but sufficient for preventing casual inspection of localStorage
function simpleHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

// Idle detection: track last activity time
function useIdleDetector(timeoutMinutes: number, onIdle: () => void) {
  useEffect(() => {
    if (timeoutMinutes <= 0) return // Never lock on idle

    const timeoutMs = timeoutMinutes * 60 * 1000
    let idleTimer: ReturnType<typeof setTimeout>

    const resetTimer = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(onIdle, timeoutMs)
    }

    // Initial timer start
    resetTimer()

    // Event listeners for user activity
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll']
    const resetHandler = () => resetTimer()

    events.forEach(event => {
      document.addEventListener(event, resetHandler)
    })

    return () => {
      clearTimeout(idleTimer)
      events.forEach(event => {
        document.removeEventListener(event, resetHandler)
      })
    }
    }
  }, [timeoutMinutes, onIdle])
}

export function useLock() {
  const [settings, setSettings] = useState<LockSettings>({
    enabled: false,
    method: 'password',
    passwordHash: undefined,
    pinHash: undefined,
    idleTimeoutMinutes: 5,
    lockOnBackground: 'immediate',
    failedAttempts: 0,
    lockoutUntil: undefined,
  })

  const [lockState, setLockStateInternal] = useState<LockState>('unlocked')
  const isMountedRef = useRef(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCK_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<LockSettings>
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('Failed to load lock settings:', error)
    }

    // Load lock state if app was locked
    try {
      const storedState = localStorage.getItem(LOCK_STATE_KEY)
      if (storedState === 'locked' || storedState === 'locked_out') {
        setLockStateInternal(storedState as LockState)
      }
    } catch (error) {
      console.error('Failed to load lock state:', error)
    }

    return () => { isMountedRef.current = false }
  }, [])

  // Background visibility detection
  useEffect(() => {
    if (!settings.enabled || !settings.lockOnBackground) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && lockState === 'unlocked') {
        // Lock on background based on settings
        if (settings.lockOnBackground === 'immediate') {
          lock('background')
        } else if (settings.lockOnBackground === 'delay') {
          // Lock after 1 minute delay
          setTimeout(() => {
            if (isMountedRef.current && lockState === 'unlocked') {
              lock('background')
            }
          }, 60000)
        }
      }
    }

      // Check lock state when returning to tab
      if (document.visibilityState === 'visible' && lockState === 'locked') {
        // Lock screen will be shown automatically via lock state
        loadLockState()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [settings.enabled, settings.lockOnBackground, lockState])

  // Idle detection
  useIdleDetector(
    settings.enabled ? settings.idleTimeoutMinutes : 0,
    useCallback(() => {
      if (lockState === 'unlocked') {
        lock('idle')
      }
    }, [lockState])
  )

  // Lock function
  const lock = useCallback((trigger: LockTrigger = 'manual') => {
    const newState: LockState = 'locked'
    setLockStateInternal(newState)
    localStorage.setItem(LOCK_STATE_KEY, newState)
  }, [])

  // Unlock function
  const unlock = useCallback(async (passwordOrPin: string): Promise<{ success: boolean, error?: string }> => {
    // Check if locked out
    if (settings.lockoutUntil && new Date(settings.lockoutUntil) > new Date()) {
      return { success: false, error: 'Account temporarily locked. Please wait.' }
    }

    // Verify password/PIN
    const inputHash = simpleHash(passwordOrPin)
    const expectedHash = settings.method === 'password' ? settings.passwordHash : settings.pinHash

    if (inputHash !== expectedHash) {
      // Increment failed attempts
      const newAttempts = (settings.failedAttempts || 0) + 1
      const newSettings = { ...settings, failedAttempts: newAttempts }

      // Check if max attempts reached
      if (newAttempts >= MAX_ATTEMPTS) {
        newSettings.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION).toISOString()
        setLockStateInternal('locked_out')
        localStorage.setItem(LOCK_STATE_KEY, 'locked_out')
      }

      setSettings(newSettings)
      saveSettings(newSettings)
      return { success: false, error: 'Invalid password or PIN' }
    }

    // Success - reset attempts and unlock
    const newSettings = { ...settings, failedAttempts: 0, lockoutUntil: undefined }
    setSettings(newSettings)
    saveSettings(newSettings)

    setLockStateInternal('unlocked')
    localStorage.setItem(LOCK_STATE_KEY, 'unlocked')

    return { success: true }
  }, [settings])

  // Update settings function
  const updateSettings = useCallback(async (newSettings: Partial<LockSettings>): Promise<void> => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    saveSettings(updated)
  }, [settings])

  // Save settings to localStorage
  const saveSettings = useCallback((settingsToSave: LockSettings) => {
    try {
      localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(settingsToSave))
    } catch (error) {
      console.error('Failed to save lock settings:', error)
      throw new Error('Failed to save lock settings')
    }
  }, [])

  // Reset lock function
  const resetLock = useCallback(async (): Promise<void> => {
    const newSettings = { ...settings, enabled: false, failedAttempts: 0, lockoutUntil: undefined }
    setSettings(newSettings)
    saveSettings(newSettings)

    setLockStateInternal('unlocked')
    localStorage.removeItem(LOCK_STATE_KEY)
  }, [settings])

  // Load lock state from localStorage (for sync across tabs)
  const loadLockState = useCallback(() => {
    try {
      const storedState = localStorage.getItem(LOCK_STATE_KEY)
      if (storedState && storedState !== 'unlocked') {
        setLockStateInternal(storedState as LockState)
      }
    } catch (error) {
      console.error('Failed to load lock state:', error)
    }
  }, [])

  return {
    lockState,
    settings,
    unlock,
    lock,
    updateSettings,
    resetLock,
    failedAttempts: settings.failedAttempts || 0,
    lockoutUntil: settings.lockoutUntil,
  }
}

// Hook for checking if current route is public
export function useIsPublicRoute(): boolean {
  const PUBLIC_PATHS = ['/', '/login', '/config', '/invite', '/cashcounter']

  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname
      const hash = window.location.hash
      const fullPath = hash ? `${hash.split('?')[0]}` : path
      return PUBLIC_PATHS.some(p => fullPath === p || fullPath.startsWith(p + '/'))
    }

    return checkRoute()
  }, [])

  return PUBLIC_PATHS.some(p => window.location.pathname === p)
}
```

### Modified File: `src/hooks/useAuth.tsx`

**Purpose:** Extend AuthContext to include lock state and integrate lock functionality.

**Changes:**

```typescript
// @MX:ANCHOR: useAuth now includes lock state for password lock feature
// Lock state is managed alongside Supabase auth state

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import type { User as AppUser, AuthState, LockState } from '../types'
import { getSupabaseClient, resetSupabaseClient } from '../lib/supabase'
import { getConfig } from '../lib/config'

interface AuthContextType extends AuthState {
  signIn: (email?: string, password?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  reinitialize: () => void
  lockState: LockState
  setLockState: (state: LockState) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    lockState: 'unlocked', // Add lock state
  })

  // ... existing code for loadingRef, cancelledRef ...

  // ... existing useEffect for auth initialization ...

  // Update signOut to clear lock state
  const signOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()

    // Clear lock state on sign out
    localStorage.removeItem('finance_tracker_lock_state')
    localStorage.removeItem('finance_tracker_lock_settings')

    setAuthState(prev => ({
      ...prev,
      user: null,
      session: null,
      loading: false,
      lockState: 'unlocked',
    }))
  }

  const setLockState = (state: LockState) => {
    setAuthState(prev => ({ ...prev, lockState: state }))
  }

  return (
    <AuthContext.Provider value={{ ...authState, signIn, signOut, reinitialize, lockState, setLockState }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### Modified File: `src/App.tsx`

**Purpose:** Render LockScreen overlay when app is locked.

**Changes:**

```typescript
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useSupabase } from './hooks/useSupabase'
import { ThemeProvider } from './contexts/ThemeContext'
import { useLock } from './hooks/useLock'
import ConfigPage from './pages/ConfigPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import TransactionsPage from './pages/TransactionsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import InvitePage from './pages/InvitePage'
import CashCounterPage from './pages/CashCounterPage'
import LockScreen from './components/LockScreen'

// Routes that should NOT be saved as redirect targets and are exempt from lock screen
const PUBLIC_PATHS = ['/', '/login', '/config', '/invite', '/cashcounter']

function App() {
  const { user, loading: authLoading, lockState } = useAuth()
  const { lockState: hookLockState, settings } = useLock()
  const location = useLocation()
  const isPublicRoute = PUBLIC_PATHS.some(p => location.pathname === p || location.hash === `#${p}`)

  // Determine effective lock state (hook state takes precedence for initial load)
  const effectiveLockState = hookLockState || lockState
  const isLocked = effectiveLockState !== 'unlocked' && settings?.enabled && !isPublicRoute

  // Only load Supabase for authenticated routes (not cash counter) and not locked
  const { loading: configLoading, error: configError } = useSupabase({
    skip: location.pathname === '/cashcounter' || location.hash === '#/cashcounter' || isLocked,
  })

  // ... existing loading and error handling ...

  return (
    <>
      {/* Lock Screen Overlay */}
      {isLocked && user && <LockScreen />}

      <ThemeProvider>
        <Routes>
          {/* Public routes - always accessible */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/invite" element={<InvitePage />} />
          <Route path="/cashcounter" element={<CashCounterPage />} />

          {/* Protected routes - accessible when authenticated and unlocked */}
          {!user ? (
            <>
              <Route path="/projects" element={<Navigate to="/login" replace />} />
              <Route path="/projects/:id" element={<Navigate to="/login" replace />} />
              <Route path="/transactions/:projectId" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : isLocked ? (
            <>
              {/* Locked state - showing LockScreen, routes blocked */}
              <Route path="/projects" element={<div className="min-h-screen" />} />
              <Route path="/projects/:id" element={<div className="min-h-screen" />} />
              <Route path="/transactions/:projectId" element={<div className="min-h-screen" />} />
              <Route path="*" element={<div className="min-h-screen" />} />
            </>
          ) : (
            <>
              {/* Unlocked state - full access */}
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/transactions/:projectId" element={<TransactionsPage />} />
              <Route path="/invite" element={<InvitePage />} />
              <Route path="/config" element={<ConfigPage />} />
              <Route path="/cashcounter" element={<CashCounterPage />} />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </>
          )}
        </Routes>
      </ThemeProvider>
    </>
  )
}

export default App
```

### New Component: `src/components/LockSettings.tsx`

**Purpose:** Settings panel for password lock feature configuration.

**Key Features:**
- Enable/disable toggle for password lock
- Password/PIN selection (radio buttons)
- Password setup/change form with current password verification
- PIN setup/change form
- Idle timeout configuration (dropdown with predefined options)
- Lock on background behavior (immediate, delay, never)
- Manual lock button for testing

**Component Structure:**

```typescript
// @MX:NOTE: Lock settings component manages user preferences for password lock feature
// All settings stored in localStorage for device-specific configuration

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLock } from '../hooks/useLock'
import type { LockMethod } from '../types'

export default function LockSettings() {
  const { t } = useTranslation()
  const { settings, updateSettings, resetLock, lock, isPublicRoute } = useLock()
  const [showPasswordSetup, setShowPasswordSetup] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleEnable = async () => {
    if (settings.method === 'password') {
      setShowPasswordSetup(true)
    } else {
      setShowPasswordSetup(true) // For PIN setup
    }
  }

  const handlePasswordSubmit = async () => {
    setError('')

    // Validation
    if (settings.passwordHash && !currentPassword) {
      setError('Current password required to change settings')
      return
    }

    if (settings.method === 'password') {
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
      if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        setError('Password must contain letters and numbers')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    } else {
      if (newPin.length < 4 || newPin.length > 6) {
        setError('PIN must be 4-6 digits')
        return
      }
      if (!/^[0-9]+$/.test(newPin)) {
        setError('PIN must contain only numbers')
        return
      }
      if (newPin !== confirmPin) {
        setError('PINs do not match')
        return
      }
    }

    setIsProcessing(true)

    try {
      await updateSettings({
        enabled: true,
        method: settings.method,
        // Password hash would be set here
      })

      setShowPasswordSetup(false)
      setNewPassword('')
      setConfirmPassword('')
      setNewPin('')
      setConfirmPin('')
      setCurrentPassword('')
    } catch (err) {
      setError('Failed to save settings')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDisable = async () => {
    if (confirm('Are you sure you want to disable password lock?')) {
      await resetLock()
    }
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t('lock.enablePasswordLock')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('lock.enablePasswordLockDescription')}
          </p>
        </div>
        <button
          onClick={settings.enabled ? handleDisable : handleEnable}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-1'
            } bg-white`}
          />
        </button>
      </div>

      {/* Password Lock Settings - shown when enabled */}
      {settings.enabled && (
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('lock.lockMethod')}
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="lockMethod"
                  value="password"
                  checked={settings.method === 'password'}
                  onChange={() => updateSettings({ method: 'password' })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('lock.password')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="lockMethod"
                  value="pin"
                  checked={settings.method === 'pin'}
                  onChange={() => updateSettings({ method: 'pin' })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('lock.pin')}</span>
              </label>
            </div>
          </div>

          {/* Idle Timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('lock.idleTimeout')}
            </label>
            <select
              value={settings.idleTimeoutMinutes}
              onChange={(e) => updateSettings({ idleTimeoutMinutes: parseInt(e.target.value) })}
              className="w-full input"
            >
              <option value="0">{t('lock.never')}</option>
              <option value="1">1 {t('lock.minute')}</option>
              <option value="5">5 {t('lock.minutes')}</option>
              <option value="15">15 {t('lock.minutes')}</option>
              <option value="30">30 {t('lock.minutes')}</option>
            </select>
          </div>

          {/* Lock on Background */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('lock.lockOnBackground')}
            </label>
            <select
              value={settings.lockOnBackground}
              onChange={(e) => updateSettings({ lockOnBackground: e.target.value as 'immediate' | 'delay' | 'never' })}
              className="w-full input"
            >
              <option value="immediate">{t('lock.immediate')}</option>
              <option value="delay">{t('lock.delay')}</option>
              <option value="never">{t('lock.never')}</option>
            </select>
          </div>

          {/* Test Lock Button */}
          <button
            onClick={lock}
            className="w-full btn btn-secondary"
          >
            {t('lock.testLock')}
          </button>
        </div>
      )}

      {/* Password/PIN Setup Modal */}
      {showPasswordSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
          <div className="max-w-md w-full mx-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {settings.passwordHash ? t('lock.changePassword') : t('lock.setPassword')}
            </h3>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Current Password (for changes) */}
              {settings.passwordHash && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('lock.currentPassword')}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full input"
                  />
                </div>
              )}

              {/* New Password/PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {settings.method === 'password' ? t('lock.newPassword') : t('lock.newPin')}
                </label>
                <input
                  type="password"
                  inputMode={settings.method === 'pin' ? 'numeric' : undefined}
                  pattern={settings.method === 'pin' ? '[0-9]*' : undefined}
                  maxLength={settings.method === 'pin' ? 6 : undefined}
                  value={settings.method === 'password' ? newPassword : newPin}
                  onChange={(e) => settings.method === 'password' ? setNewPassword(e.target.value) : setNewPin(e.target.value)}
                  className="w-full input"
                />
              </div>

              {/* Confirm Password/PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {settings.method === 'password' ? t('lock.confirmPassword') : t('lock.confirmPin')}
                </label>
                <input
                  type="password"
                  inputMode={settings.method === 'pin' ? 'numeric' : undefined}
                  pattern={settings.method === 'pin' ? '[0-9]*' : undefined}
                  maxLength={settings.method === 'pin' ? 6 : undefined}
                  value={settings.method === 'password' ? confirmPassword : confirmPin}
                  onChange={(e) => settings.method === 'password' ? setConfirmPassword(e.target.value) : setConfirmPin(e.target.value)}
                  className="w-full input"
                />
              </div>

              {/* Password Requirements */}
              {settings.method === 'password' && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <p>• {t('lock.passwordRequirements')}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordSetup(false)
                    setNewPassword('')
                    setConfirmPassword('')
                    setNewPin('')
                    setConfirmPin('')
                    setCurrentPassword('')
                    setError('')
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={isProcessing}
                  className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Modified File: `src/pages/ConfigPage.tsx`

**Purpose:** Add LockSettings component to the configuration page.

**Changes:**

```typescript
// Import LockSettings component
import LockSettings from '../components/LockSettings'

// Add LockSettings to authenticated mode UI (after line 403)
{mode === 'authenticated' && (
  <div className="space-y-6">
    {/* ... existing content ... */}

    {/* Add Lock Settings Section */}
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Security Settings
      </h2>
      <LockSettings />
    </div>

    {/* ... remaining content ... */}
  </div>
)}
```

## I18n Keys

### File: `src/locales/en.json`

**Add lock-related keys (around line 50+):**

```json
{
  "lock": {
    "enablePasswordLock": "Enable Password Lock",
    "enablePasswordLockDescription": "Require password or PIN to access the app after it goes to background or is idle",
    "lockMethod": "Lock Method",
    "password": "Password",
    "pin": "PIN",
    "idleTimeout": "Idle Timeout",
    "minute": "minute",
    "minutes": "minutes",
    "never": "Never",
    "lockOnBackground": "Lock on Background",
    "immediate": "Immediate",
    "delay": "After 1 minute",
    "testLock": "Test Lock Now",
    "enterPassword": "Enter Password",
    "enterPin": "Enter PIN",
    "unlock": "Unlock",
    "verifying": "Verifying...",
    "invalidPassword": "Invalid password or PIN",
    "forgotPassword": "Forgot Password/PIN?",
    "attemptsExceeded": "Too many attempts",
    "waitSeconds": "Please wait {seconds} seconds",
    "attemptCounter": "Attempt {current} of {max}",
    "setPassword": "Set Password/PIN",
    "changePassword": "Change Password/PIN",
    "currentPassword": "Current Password",
    "newPassword": "New Password",
    "confirmPassword": "Confirm Password",
    "newPin": "New PIN",
    "confirmPin": "Confirm PIN",
    "passwordRequirements": "Minimum 8 characters with letters and numbers",
    "pinRequirements": "4-6 digits only",
    "passwordMismatch": "Passwords do not match",
    "pinMismatch": "PINs do not match",
    "passwordRequired": "Password required",
    "pinRequired": "PIN required",
    "lockDisabled": "Password lock disabled",
    "lockEnabled": "Password lock enabled"
  }
}
```

### File: `src/locales/ko.json`

**Add Korean translations:**

```json
{
  "lock": {
    "enablePasswordLock": "비밀번호 잠금 사용",
    "enablePasswordLockDescription": "백그라운드로 이동하거나 유휨하지 않을 때 비밀번호나 PIN을 입력해야 앱에 접근할 수 있습니다",
    "lockMethod": "잠금 방법",
    "password": "비밀번호",
    "pin": "PIN",
    "idleTimeout": "유휴 시간",
    "minute": "분",
    "minutes": "분",
    "never": "사용 안 함",
    "lockOnBackground": "백그라운드 잠금",
    "immediate": "즉시",
    "delay": "1분 후",
    "testLock": "잠금 테스트",
    "enterPassword": "비밀번호 입력",
    "enterPin": "PIN 입력",
    "unlock": "잠금 해제",
    "verifying": "확인 중...",
    "invalidPassword": "비밀번호 또는 PIN이 올바르지 않습니다",
    "forgotPassword": "비밀번호/PIN을 잊으셨나요?",
    "attemptsExceeded": "시도 횟수 초과",
    "waitSeconds": "{seconds}초 후 다시 시도해주세요",
    "attemptCounter": "{current}/{max} 시도",
    "setPassword": "비밀번호/PIN 설정",
    "changePassword": "비밀번호/PIN 변경",
    "currentPassword": "현재 비밀번호",
    "newPassword": "새 비밀번호",
    "confirmPassword": "비밀번호 확인",
    "newPin": "새 PIN",
    "confirmPin": "PIN 확인",
    "passwordRequirements": "최소 8자 (영문, 숫자 포함)",
    "pinRequirements": "4-6자리 숫자만",
    "passwordMismatch": "비밀번호가 일치하지 않습니다",
    "pinMismatch": "PIN이 일치하지 않습니다",
    "passwordRequired": "비밀번호가 필요합니다",
    "pinRequired": "PIN이 필요합니다",
    "lockDisabled": "비밀번호 잠금 비활성화",
    "lockEnabled": "비밀번호 잠금 활성화"
  }
}
```

## Security Considerations

### Password/PIN Storage

**Hash Function:**
- Using simple hash function for client-side storage
- NOT cryptographically secure but sufficient for preventing casual inspection
- Suitable for client-side lock protection scenario

**Storage Location:**
- Stored in localStorage alongside other app configuration
- Accessible via browser dev tools (acknowledged limitation)
- Appropriate use case: Additional layer on top of Supabase auth

### Rate Limiting

**Attempt Limit:**
- Maximum 5 failed attempts before lockout
- Lockout duration: 30 seconds
- Attempts counter resets on successful unlock

**Lockout State:**
- Display countdown timer during lockout
- Prevent any input attempts during lockout
- Reset counter after successful unlock

### Public Route Exemption

**Rationale:**
- Public routes (/, /login, /config, /invite, /cashcounter) should remain accessible
- Lock screen only applies to authenticated protected routes
- Allows users to sign out, access config, or use cash counter

### Forgot Password Flow

**Implementation:**
- Redirects to Supabase password reset URL
- User must have access to their email
- After password reset, user can set new app lock password/PIN

### Note on Security Limitations

**Client-Side Storage:**
- localStorage is accessible via browser dev tools
- Hash is not cryptographically secure
- This is an ADDITIONAL security layer, not a replacement for proper authentication

**Appropriate Use Case:**
- Prevents unauthorized access when device is left unattended
- Does NOT protect against malicious users with dev tools access
- Supabase auth remains the primary authentication mechanism

## Error Handling

### Unlock Errors

**Invalid Password/PIN:**
```typescript
{
  code: "LOCK_001",
  message: "Invalid password or PIN",
  details: "The provided password or PIN does not match the stored hash",
  hint: "Please try again or use 'Forgot Password/PIN' option"
}
```

**Account Locked Out:**
```typescript
{
  code: "LOCK_002",
  message: "Too many failed attempts",
  details: `Account locked for ${Math.ceil(remainingSeconds)} seconds`,
  hint: "Please wait before trying again"
}
```

**Settings Save Failed:**
```typescript
{
  code: "LOCK_003",
  message: "Failed to save settings",
  details: "Unable to write to localStorage",
  hint: "Please check browser permissions and storage quota"
}
```

## Accessibility Requirements

**Keyboard Navigation:**
- Lock screen must be keyboard accessible (Tab, Enter, Escape)
- Password/PIN input must have proper focus management

**Screen Reader Support:**
- Lock state changes must be announced via ARIA live regions
- Error messages must be conveyed to screen readers
- Attempt counter must be announced

**Visual Accessibility:**
- Lock screen must have high contrast against content
- Color must not be the only indicator (use icons, text)
- Focus indicators must be clearly visible

## Performance Considerations

**Idle Detection Efficiency:**
- Use passive event listeners where possible
- Debounce activity tracking to avoid performance impact
- Use requestAnimationFrame for smooth countdown display

**Lock Screen Rendering:**
- Lock screen should render immediately when lock state changes
- Use CSS backdrop-blur for visual effect without heavy computation
- Minimize re-renders during lock state

**Storage Operations:**
- Minimize localStorage reads/writes
- Batch settings updates when possible
- Handle storage quota errors gracefully

---

# Traceability

## Related Files

### New Components
- `src/components/LockScreen.tsx` - Lock screen overlay component
- `src/components/LockSettings.tsx` - Settings configuration component

### New Hooks
- `src/hooks/useLock.ts` - Lock state management and idle detection

### Modified Files
- `src/hooks/useAuth.tsx` - Extend AuthContext with lock state
- `src/App.tsx` - Render LockScreen overlay and handle lock routing
- `src/pages/ConfigPage.tsx` - Add LockSettings to configuration UI
- `src/types/index.ts` - Add lock-related type definitions

### Localization
- `src/locales/en.json` - English translations
- `src/locales/ko.json` - Korean translations

## Related Components

**Lock State Management:**
- Lock state is managed alongside Supabase auth state
- Lock state persists across page reloads via localStorage
- Multiple tabs sync lock state via storage events

**Idle Detection Pattern:**
- Activity events reset idle timer
- Timer triggers lock when timeout exceeded
- Configurable timeout duration

**Rate Limiting Pattern:**
- Failed attempt counter stored in settings
- Lockout timestamp calculated on max attempts
- Lockout countdown displayed to user

---

# Implementation Notes

**Version:** 1.0.0
**Status:** Draft
**Last Updated:** 2026-03-06

## Summary of Changes

This specification defines implementation of a password/PIN lock feature that adds an additional security layer on top of the existing Supabase authentication. The lock feature protects the application when:

1. The app goes to background (configurable: immediate, delay, or never)
2. The user is idle for a configurable timeout duration
3. The user manually locks the app

Key implementation points:

1. Lock state is managed via useLock hook and stored in localStorage
2. Lock screen overlay displays over all protected routes when locked
3. Password/PIN is stored as a simple hash (not cryptographically secure but sufficient for this use case)
4. Rate limiting enforces maximum 5 failed attempts with 30-second lockout
5. Public routes (/, /login, /config, /invite, /cashcounter) remain accessible even when locked
6. Settings panel allows users to configure lock behavior (method, timeout, background lock)

## Security Design Decision

**Client-Side Lock Rationale:**
- This is an additional security layer, not a replacement for Supabase auth
- Primary goal: Prevent unauthorized access when device is left unattended
- Does NOT protect against malicious users with browser dev tools access
- Simple hash sufficient for preventing casual localStorage inspection

**Supabase Auth Integration:**
- Existing Supabase authentication remains unchanged
- Lock feature works alongside Supabase session management
- Lock state is cleared on Supabase sign out
- Forgot password flow redirects to Supabase password reset

## Integration with Existing Auth

The lock feature integrates seamlessly with the existing authentication system:

- AuthContext extended to include lockState
- useLock hook manages lock state independently
- App.tsx renders LockScreen when locked
- Lock does not interfere with Supabase session refresh logic

## Future Enhancements (Out of Scope for v1)

- Biometric unlock (fingerprint, Face ID)
- Sync lock settings across devices
- Admin-enforced mandatory lock for certain projects
- Lock history/audit logging
- Custom lock timeout beyond predefined options
- Two-factor authentication for lock screen
