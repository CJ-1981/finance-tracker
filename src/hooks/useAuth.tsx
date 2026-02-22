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
    // Try to get Supabase client - it might not be initialized yet
    let supabase
    try {
      supabase = getSupabaseClient()
    } catch (error) {
      // Supabase not configured yet - this is OK on first visit
      console.log('Supabase not configured yet')
      setAuthState({ user: null, session: null, loading: false })
      return
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user, supabase)
      } else {
        setAuthState({ user: null, session: null, loading: false })
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user, supabase)
      } else {
        setAuthState({ user: null, session: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (user: User, supabase: ReturnType<typeof getSupabaseClient>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setAuthState({
        user: data as AppUser,
        session: user,
        loading: false,
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setAuthState({ user: null, session: null, loading: false })
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
