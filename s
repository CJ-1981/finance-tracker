[1mdiff --git a/src/hooks/useAuth.tsx b/src/hooks/useAuth.tsx[m
[1mindex cc2c480..d7fc884 100644[m
[1m--- a/src/hooks/useAuth.tsx[m
[1m+++ b/src/hooks/useAuth.tsx[m
[36m@@ -21,6 +21,7 @@[m [mexport function AuthProvider({ children }: { children: ReactNode }) {[m
 [m
   useEffect(() => {[m
     let cancelled = false[m
[32m+[m[32m    let pollingInterval: NodeJS.Timeout | null = null[m
 [m
     // Try to get Supabase client - it might not be initialized yet[m
     let supabase[m
[36m@@ -34,13 +35,13 @@[m [mexport function AuthProvider({ children }: { children: ReactNode }) {[m
     }[m
 [m
     // Dead-man fallback: if onAuthStateChange never fires (network issue, etc.),[m
[31m-    // unblock the UI after 8 seconds.[m
[32m+[m[32m    // unblock the UI after 5 seconds (reduced from 8s for better UX).[m
     const timeoutId = setTimeout(() => {[m
[31m-      if (!cancelled) {[m
[31m-        console.warn('Auth initialization timed out after 8s — forcing loading to false.')[m
[32m+[m[32m      if (!cancelled && authState.loading) {[m
[32m+[m[32m        console.warn('Auth initialization timed out after 5s — forcing loading to false.')[m
         setAuthState(prev => prev.loading ? { ...prev, loading: false } : prev)[m
       }[m
[31m-    }, 8000)[m
[32m+[m[32m    }, 5000)[m
 [m
     // ── WHY NO getSession() ────────────────────────────────────────────────────[m
     // When the Supabase client is created (in initSupabase.ts), it immediately[m
[36m@@ -59,6 +60,12 @@[m [mexport function AuthProvider({ children }: { children: ReactNode }) {[m
       if (cancelled) return[m
       clearTimeout(timeoutId)[m
 [m
[32m+[m[32m      // Stop polling when we get a successful auth state update[m
[32m+[m[32m      if (pollingInterval) {[m
[32m+[m[32m        clearInterval(pollingInterval)[m
[32m+[m[32m        pollingInterval = null[m
[32m+[m[32m      }[m
[32m+[m
       // Handle specific auth events[m
       switch (event) {[m
         case 'INITIAL_SESSION':[m
[36m@@ -93,32 +100,84 @@[m [mexport function AuthProvider({ children }: { children: ReactNode }) {[m
       }[m
     })[m
 [m
[32m+[m[32m    // Helper function to refresh session with timeout and explicit validation[m
[32m+[m[32m    const refreshSessionWithTimeout = async (): Promise<{ success: boolean; error?: Error }> => {[m
[32m+[m[32m      if (cancelled) return { success: false }[m
[32m+[m
[32m+[m[32m      try {[m
[32m+[m[32m        // Set up a timeout for the session refresh attempt[m
[32m+[m[32m        const sessionRefreshPromise = supabase.auth.getSession()[m
[32m+[m[32m        const timeoutPromise = new Promise<never>((_, reject) => {[m
[32m+[m[32m          setTimeout(() => reject(new Error('Session refresh timeout')), 3000)[m
[32m+[m[32m        })[m
[32m+[m
[32m+[m[32m        const { data, error } = await Promise.race([sessionRefreshPromise, timeoutPromise])[m
[32m+[m
[32m+[m[32m        if (error) {[m
[32m+[m[32m          console.error('Session refresh error:', error)[m
[32m+[m[32m          return { success: false, error }[m
[32m+[m[32m        }[m
[32m+[m
[32m+[m[32m        // Explicit validation - check if session exists and is valid[m
[32m+[m[32m        if (!data.session) {[m
[32m+[m[32m          console.warn('Session is null or expired - treating as signed out')[m
[32m+[m[32m          // Trigger signed out state[m
[32m+[m[32m          if (!cancelled) {[m
[32m+[m[32m            setAuthState({ user: null, session: null, loading: false })[m
[32m+[m[32m          }[m
[32m+[m[32m          return { success: false, error: new Error('No valid session') }[m
[32m+[m[32m        }[m
[32m+[m
[32m+[m[32m        return { success: true }[m
[32m+[m[32m      } catch (err) {[m
[32m+[m[32m        if (err instanceof Error && err.message === 'Session refresh timeout') {[m
[32m+[m[32m          console.warn('Session refresh timed out after 3s')[m
[32m+[m[32m        } else {[m
[32m+[m[32m          console.error('Session refresh failed:', err)[m
[32m+[m[32m        }[m
[32m+[m[32m        return { success: false, error: err as Error }[m
[32m+[m[32m      }[m
[32m+[m[32m    }[m
[32m+[m
     // Handle page visibility changes - refresh session when user returns to tab[m
     const handleVisibilityChange = () => {[m
       if (document.visibilityState === 'visible' && !cancelled) {[m
[31m-        // User returned to the tab after being away[m
[31m-        // Trigger a silent session refresh[m
[31m-        supabase.auth.getSession().then(({ error }) => {[m
[31m-          if (error) {[m
[31m-            console.error('Error refreshing session on visibility change:', error)[m
[31m-          }[m
[31m-          // Session will be automatically refreshed if valid, or cleared if expired[m
[31m-          // The onAuthStateChange listener above will handle the state update[m
[31m-        }).catch(err => {[m
[31m-          console.error('Failed to refresh session:', err)[m
[31m-        })[m
[32m+[m[32m        console.log('Page became visible - refreshing session')[m
[32m+[m[32m        refreshSessionWithTimeout()[m
       }[m
     }[m
 [m
[32m+[m[32m    // Handle focus events - backup for mobile resume detection[m
[32m+[m[32m    const handleFocus = () => {[m
[32m+[m[32m      console.log('Window received focus - refreshing session')[m
[32m+[m[32m      refreshSessionWithTimeout()[m
[32m+[m[32m    }[m
[32m+[m
     document.addEventListener('visibilitychange', handleVisibilityChange)[m
[32m+[m[32m    window.addEventListener('focus', handleFocus)[m
[32m+[m
[32m+[m[32m    // Periodic polling as last-resort fallback mechanism[m
[32m+[m[32m    // This runs every 60 seconds to ensure we detect session changes[m
[32m+[m[32m    // that might have been missed by visibility/focus events[m
[32m+[m[32m    pollingInterval = setInterval(() => {[m
[32m+[m[32m      if (!cancelled && !authState.loading) {[m
[32m+[m[32m        // Only poll if we're not already loading to avoid unnecessary calls[m
[32m+[m[32m        console.log('Periodic session validation check')[m
[32m+[m[32m        refreshSessionWithTimeout()[m
[32m+[m[32m      }[m
[32m+[m[32m    }, 60000) // Poll every 60 seconds[m
 [m
     return () => {[m
       cancelled = true[m
       clearTimeout(timeoutId)[m
[32m+[m[32m      if (pollingInterval) {[m
[32m+[m[32m        clearInterval(pollingInterval)[m
[32m+[m[32m      }[m
       subscription.unsubscribe()[m
       document.removeEventListener('visibilitychange', handleVisibilityChange)[m
[32m+[m[32m      window.removeEventListener('focus', handleFocus)[m
     }[m
[31m-  }, [])[m
[32m+[m[32m  }, [authState.loading])[m
 [m
   const fetchUserProfile = async (user: User, supabase: ReturnType<typeof getSupabaseClient>) => {[m
     try {[m
