import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import type { User as AppUser, AuthState } from '../types'
import { getSupabaseClient, resetSupabaseClient, createSupabaseClient } from '../lib/supabase'
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

  useEffect(() => {
    let cancelled = false

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
      if (!cancelled) {
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return
      clearTimeout(timeoutId)

      if (session?.user) {
        await fetchUserProfile(session.user, supabase).catch(err => {
          console.error('Error fetching user profile:', err)
          if (!cancelled) setAuthState({ user: null, session: null, loading: false })
        })
      } else {
        setAuthState({ user: null, session: null, loading: false })
      }
    })

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      subscription.unsubscribe()
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
      // but call fetchUserProfile here too so the caller awaits completion.
      if (data.user) {
        await fetchUserProfile(data.user, supabase)
      }

      return { error: null }
    }

    // OAuth fallback (not actively used)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/finance-tracker/`,
      },
    })

    return { error: null }
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    setAuthState({ user: null, session: null, loading: false })
  }

  const reinitialize = () => {
    const config = getConfig()
    if (config) {
      try {
        resetSupabaseClient()
        createSupabaseClient(config)
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
