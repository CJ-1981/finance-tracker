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
    // Timeout fallback to ensure loading is never stuck
    const timeoutId = setTimeout(() => {
      setAuthState(prev => {
        if (prev.loading) {
          console.warn('Auth initialization timed out, forcing loading to false')
          return { ...prev, loading: false }
        }
        return prev
      })
    }, 5000) // 5 second timeout

    // Try to get Supabase client - it might not be initialized yet
    let supabase
    try {
      supabase = getSupabaseClient()
    } catch (error) {
      // Supabase not configured yet - this is OK on first visit
      console.log('Supabase not configured yet - client initialization failed:', error)
      setAuthState({ user: null, session: null, loading: false })
      clearTimeout(timeoutId)
      return
    }

    // Check active session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeoutId)
        if (session?.user) {
          // Await to prevent race conditions
          fetchUserProfile(session.user, supabase).catch(err => {
            console.error('Error fetching user profile:', err)
            setAuthState({ user: null, session: null, loading: false })
          })
        } else {
          setAuthState({ user: null, session: null, loading: false })
        }
      })
      .catch(err => {
        clearTimeout(timeoutId)
        console.error('Error getting session:', err)
        setAuthState({ user: null, session: null, loading: false })
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Await to prevent race conditions from concurrent inserts
        await fetchUserProfile(session.user, supabase).catch(err => {
          console.error('Error fetching user profile:', err)
          setAuthState({ user: null, session: null, loading: false })
        })
      } else {
        setAuthState({ user: null, session: null, loading: false })
      }
    })

    return () => {
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
              // Re-fetch the existing profile instead of throwing
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

    // If email and password provided, use email/password sign in
    if (email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      // Fetch user profile after successful sign in
      if (data.user) {
        await fetchUserProfile(data.user, supabase)
      }

      return { error: null }
    }

    // Otherwise, use OAuth (for backward compatibility, though not used anymore)
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
