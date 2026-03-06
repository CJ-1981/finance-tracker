import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import type { User as AppUser, AuthState } from '../types'
import { getSupabaseClient, resetSupabaseClient } from '../lib/supabase'
import { getConfig } from '../lib/config'

interface AuthContextType extends AuthState {
  signIn: (email?: string, password?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  reinitialize: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  // Use ref to track loading state without causing re-renders or stale closures
  const loadingRef = useRef(true)

  // Use ref to track cancellation state to avoid stale closures in async handlers
  const cancelledRef = useRef(false)

  // Sync ref with authState.loading changes
  useEffect(() => {
    loadingRef.current = authState.loading
  }, [authState.loading])

  useEffect(() => {
    cancelledRef.current = false

    // Try to get Supabase client - it might not be initialized yet
    let supabase
    try {
      supabase = getSupabaseClient()
    } catch (error) {
      // Supabase not configured yet - this is OK on first visit
      console.log('Supabase not configured yet:', error)
      setAuthState({ user: null, session: null, loading: false })
      return
    }

    // Dead-man fallback: if onAuthStateChange never fires (network issue, etc.),
    // unblock the UI after 8 seconds.
    const timeoutId = setTimeout(() => {
      if (!cancelledRef.current && loadingRef.current) {
        console.warn('Auth initialization timed out after 8s — forcing loading to false.')
        setAuthState(prev => prev.loading ? { ...prev, loading: false } : prev)
      }
    }, 8000)

    // ── WHY NO getSession() ────────────────────────────────────────────────────
    // When the Supabase client is created (in initSupabase.ts), it immediately
    // starts an internal _recoverAndRefresh() that acquires the Navigator
    // LockManager lock (named "lock:sb-<project-ref>-auth-token").
    //
    // Calling getSession() at the same moment tries to acquire the SAME lock
    // and reliably blocks for 6–15 seconds until the internal init finishes.
    //
    // Solution: rely solely on onAuthStateChange. Supabase v2 fires this
    // callback with the initial session state (INITIAL_SESSION / SIGNED_IN /
    // SIGNED_OUT) during client boot — without competing for the same lock.
    // This gives instant auth resolution on every page load.
    // ──────────────────────────────────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelledRef.current) return
      clearTimeout(timeoutId)

      // Handle specific auth events
      switch (event) {
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          // Session is valid or was refreshed
          if (session?.user) {
            await fetchUserProfileWithTimeout(session.user, supabase, cancelledRef).catch(err => {
              console.error('Error fetching user profile:', err)
              if (!cancelledRef.current) {
                // Set minimal user profile instead of logging out - keep authenticated state
                setAuthState({
                  user: { id: session.user.id, email: session.user.email || '' } as AppUser,
                  session: session.user,
                  loading: false,
                })
              }
            })
          } else {
            setAuthState({ user: null, session: null, loading: false })
          }
          break

        case 'SIGNED_OUT':
          // User explicitly signed out or session expired
          setAuthState({ user: null, session: null, loading: false })
          break

        default:
          // Handle any other events defensively
          if (session?.user) {
            await fetchUserProfileWithTimeout(session.user, supabase, cancelledRef).catch(err => {
              console.error('Error fetching user profile:', err)
              if (!cancelledRef.current) {
                // Set minimal user profile instead of logging out - keep authenticated state
                setAuthState({
                  user: { id: session.user.id, email: session.user.email || '' } as AppUser,
                  session: session.user,
                  loading: false,
                })
              }
            })
          } else {
            setAuthState({ user: null, session: null, loading: false })
          }
      }
    })

    // Handle page visibility changes - refresh session when user returns to tab
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return
      if (cancelledRef.current) return

      // User returned to the tab after being away
      // Trigger a silent session refresh
      try {
        const { error } = await supabase.auth.getSession()
        if (cancelledRef.current) return
        if (error) {
          console.error('Error refreshing session on visibility change:', error)
        }
        // Session will be automatically refreshed if valid, or cleared if expired
        // The onAuthStateChange listener above will handle the state update
      } catch (err) {
        if (cancelledRef.current) return
        console.error('Failed to refresh session:', err)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelledRef.current = true
      clearTimeout(timeoutId)
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchUserProfile = async (user: User, supabase: ReturnType<typeof getSupabaseClient>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // If profile doesn't exist yet (new user), create it
        if (error.code === 'PGRST116') {
          const newProfile = {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          const { data: newProfileData, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile as any)
            .select()
            .single()

          if (insertError) {
            // Handle duplicate-key error (race condition from concurrent inserts)
            if (insertError.code === '23505' || (insertError as any).message?.includes('duplicate key')) {
              console.warn('Profile already exists (race condition), re-fetching...')
              const { data: existingProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

              if (fetchError) throw fetchError

              setAuthState({
                user: existingProfile as AppUser,
                session: user,
                loading: false,
              })
              return
            }
            throw insertError
          }

          setAuthState({
            user: newProfileData as AppUser,
            session: user,
            loading: false,
          })
          return
        }
        throw error
      }

      setAuthState({
        user: data as AppUser,
        session: user,
        loading: false,
      })
    } catch (error) {
      console.error('Error fetching/creating user profile:', error)
      // Don't set user to null on profile errors - still authenticated, just no profile data
      setAuthState({
        user: { id: user.id, email: user.email || '' } as AppUser,
        session: user,
        loading: false,
      })
    }
  }

  // @MX:NOTE: Timeout wrapper for fetchUserProfile to prevent indefinite loading state
  // Ensures auth loading state is always cleared within 10 seconds, preventing UI freeze
  // On timeout/error, sets minimal user profile instead of logging out to preserve auth state
  const fetchUserProfileWithTimeout = async (
    user: User,
    supabase: ReturnType<typeof getSupabaseClient>,
    cancelledRef: { current: boolean }
  ) => {
    const PROFILE_FETCH_TIMEOUT = 10000 // 10 seconds
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    // Check if cancelled before starting
    if (cancelledRef.current) {
      throw new Error('Operation cancelled')
    }

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Profile fetch timed out after 10s'))
      }, PROFILE_FETCH_TIMEOUT)
    })

    try {
      // Race between actual fetch and timeout
      const result = await Promise.race([
        fetchUserProfile(user, supabase),
        timeoutPromise,
      ])
      return result
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }

  const signIn = async (email?: string, password?: string) => {
    const supabase = getSupabaseClient()

    if (email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      // onAuthStateChange will fire and load the profile automatically;
      // but call fetchUserProfileWithTimeout here too so the caller awaits completion.
      if (data.user) {
        await fetchUserProfileWithTimeout(data.user, supabase, cancelledRef)
      }

      return { error: null }
    }

    // OAuth fallback (not actively used)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    return { error: null }
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    setAuthState({ user: null, session: null, loading: false })
  }

  const reinitialize = async () => {
    const config = getConfig()
    if (config) {
      try {
        await resetSupabaseClient(config)
        setAuthState(prev => ({ ...prev, loading: true }))
      } catch (error) {
        console.error('Failed to reinitialize Supabase:', error)
      }
    }
  }

  return (
    <AuthContext.Provider value={{ ...authState, signIn, signOut, reinitialize }}>
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
