import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getSupabaseClient } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function InvitePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'accepted' | 'wrong-email'>('loading')
  const [inviteData, setInviteData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    validateInvite()
  }, [])

  const validateInvite = async () => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('invalid')
      setError('Invalid invitation link')
      return
    }

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await (supabase
        .from('invitations') as any)
        .select(`
          *,
          projects:project_id (id, name)
        `)
        .eq('token', token)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        setStatus('invalid')
        setError('Invitation not found')
        return
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        // Auto-mark as expired in database if still pending
        if (data.status === 'pending') {
          await (supabase.from('invitations') as any)
            .update({ status: 'expired' })
            .eq('id', data.id)
        }
        setStatus('expired')
        setError('This invitation has expired')
        return
      }

      // Check if already accepted
      if (data.status === 'accepted') {
        setStatus('accepted')
        setInviteData(data)
        return
      }

      // Verify email matches (if user is logged in)
      if (user && user.email !== data.email) {
        // Show a helpful message with options
        setStatus('wrong-email')
        setError(`This invitation is for ${data.email}, but you're signed in as ${user.email}`)
        return
      }

      setStatus('valid')
      setInviteData(data)
    } catch (err: any) {
      console.error('Error validating invite:', err)
      setStatus('invalid')
      setError(err.message || 'Failed to validate invitation')
    }
  }

  const handleAcceptInvite = async () => {
    if (!inviteData || !user) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { inviteToken: searchParams.get('token') } })
      return
    }

    try {
      const supabase = getSupabaseClient()

      // Add user to project
      const { error: memberError } = await (supabase
        .from('project_members') as any)
        .insert({
          project_id: inviteData.project_id,
          user_id: user.id,
          role: inviteData.role
        })

      if (memberError) throw memberError

      // Mark invitation as accepted
      const { error: updateError } = await (supabase
        .from('invitations') as any)
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', inviteData.id)

      if (updateError) throw updateError

      // Redirect to project
      navigate(`/projects/${inviteData.project_id}`)
    } catch (err: any) {
      console.error('Error accepting invite:', err)
      setError(err.message || 'Failed to accept invitation')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="card">
          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Validating invitation...</p>
            </div>
          )}

          {status === 'valid' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You're Invited!
              </h2>
              <p className="text-gray-600 mb-6">
                You've been invited to join <strong>{inviteData?.projects?.name}</strong> as a <strong>{inviteData?.role}</strong>
              </p>

              {!user ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-4">
                    Please sign in to accept this invitation
                  </p>
                  <button
                    onClick={() => navigate('/login', { state: { inviteToken: searchParams.get('token') } })}
                    className="btn btn-primary w-full"
                  >
                    Sign In to Accept
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAcceptInvite}
                  className="btn btn-primary w-full"
                >
                  Accept Invitation
                </button>
              )}
            </div>
          )}

          {status === 'wrong-email' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.932-3L13.065 4.94A2 2 0 0011.909 3H6.09a2 2 0 00-1.932-3L2.065 6.94A2 2 0 004 9v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Wrong Email Account</h2>
              <p className="text-gray-600 mb-2">{error}</p>
              <p className="text-sm text-gray-500 mb-6">
                This invitation is meant for a different email address.
              </p>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    const supabase = getSupabaseClient()
                    await supabase.auth.signOut()
                    navigate('/login', { state: { inviteToken: searchParams.get('token') } })
                  }}
                  className="btn btn-primary w-full"
                >
                  Sign Out & Sign In with Correct Email
                </button>
                <button
                  onClick={() => navigate('/projects')}
                  className="btn btn-secondary w-full"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          )}

          {status === 'expired' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Expired</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/projects')}
                className="btn btn-secondary"
              >
                Go to Projects
              </button>
            </div>
          )}

          {status === 'accepted' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Accepted</h2>
              <p className="text-gray-600 mb-6">
                You've already accepted this invitation
              </p>
              <button
                onClick={() => navigate(`/projects/${inviteData?.project_id}`)}
                className="btn btn-primary"
              >
                Go to Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
