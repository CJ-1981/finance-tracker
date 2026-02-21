import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import type { User as AppUser, AuthState } from '../types'
import { getSupabaseClient } from '../lib/supabase'

interface AuthContextType extends AuthState {
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = getSupabaseClient()

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user)
      } else {
        setAuthState({ user: null, session: null, loading: false })
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user)
      } else {
        setAuthState({ user: null, session: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (user: User) => {
    try {
      const supabase = getSupabaseClient()
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

  const signIn = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/finance-tracker/`,
      },
    })
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    setAuthState({ user: null, session: null, loading: false })
  }

  return (
    <AuthContext.Provider value={{ ...authState, signIn, signOut }}>
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
