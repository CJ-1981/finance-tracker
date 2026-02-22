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
    const tokenParam = searchParams.get('token')
    const tokensParam = searchParams.get('tokens')

    if (!tokenParam && !tokensParam) {
      setStatus('invalid')
      setError('Invalid invitation link')
      return
    }

    const tokens = tokensParam ? tokensParam.split(',') : [tokenParam!]

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await (supabase
        .from('invitations') as any)
        .select(`
          *,
          projects:project_id (id, name)
        `)
        .in('token', tokens)

      if (error) throw error

      if (!data || data.length === 0) {
        setStatus('invalid')
        setError('Invitation not found')
        return
      }

      // Check if any expired
      const now = new Date()
      const validInvites = data.filter((invite: any) => new Date(invite.expires_at) >= now && invite.status === 'pending')
      const expiredInvites = data.filter((invite: any) => new Date(invite.expires_at) < now && invite.status === 'pending')
      const acceptedInvites = data.filter((invite: any) => invite.status === 'accepted')

      // Auto-mark expired in DB
      if (expiredInvites.length > 0) {
        await (supabase.from('invitations') as any)
          .update({ status: 'expired' })
          .in('id', expiredInvites.map((i: any) => i.id))
      }

      if (validInvites.length === 0) {
        if (acceptedInvites.length > 0) {
          setStatus('accepted')
          setInviteData(acceptedInvites[0]) // Show the first one as context
          return
        }
        setStatus('expired')
        setError('These invitations have expired')
        return
      }

      // Verify email matches (if user is logged in)
      if (user && validInvites.some((invite: any) => user.email !== invite.email)) {
        setStatus('wrong-email')
        setError(`This invitation is for ${validInvites[0].email}, but you're signed in as ${user.email}`)
        return
      }

      setStatus('valid')
      setInviteData(validInvites) // Store array of valid invites
    } catch (err: any) {
      console.error('Error validating invite:', err)
      setStatus('invalid')
      setError(err.message || 'Failed to validate invitation')
    }
  }

  const handleAcceptInvite = async () => {
    if (!inviteData || !user) {
      const tokenString = searchParams.get('tokens') || searchParams.get('token')
      navigate('/login', { state: { inviteToken: tokenString } })
      return
    }

    try {
      const invites = Array.isArray(inviteData) ? inviteData : [inviteData]
      const supabase = getSupabaseClient()

      for (const invite of invites) {
        // Add user to project
        const { error: memberError } = await (supabase
          .from('project_members') as any)
          .insert({
            project_id: invite.project_id,
            user_id: user.id,
            role: invite.role
          })

        if (memberError && memberError.code !== '23505') { // Ignore unique constraint error if already a member
          throw memberError
        }

        // Mark invitation as accepted
        const { error: updateError } = await (supabase
          .from('invitations') as any)
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', invite.id)

        if (updateError) throw updateError
      }

      // Redirect to the first project or projects list
      if (invites.length === 1) {
        navigate(`/projects/${invites[0].project_id}`)
      } else {
        navigate('/projects')
      }
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
                {Array.isArray(inviteData) && inviteData.length > 1 ? "You're Invited to Multiple Projects!" : "You're Invited!"}
              </h2>
              <p className="text-gray-600 mb-6">
                {Array.isArray(inviteData) ? (
                  inviteData.length === 1 ? (
                    <>You've been invited to join <strong>{inviteData[0].projects?.name}</strong> as a <strong>{inviteData[0].role}</strong></>
                  ) : (
                    <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 mt-4 max-h-48 overflow-y-auto">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Projects you'll join:</p>
                      {inviteData.map((invite: any) => (
                        <div key={invite.id} className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-slate-700">{invite.projects?.name}</span>
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 font-bold uppercase">{invite.role}</span>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <>You've been invited to join <strong>{inviteData?.projects?.name}</strong> as a <strong>{inviteData?.role}</strong></>
                )}
              </p>

              {!user ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-4">
                    Please sign in to accept {Array.isArray(inviteData) && inviteData.length > 1 ? 'these invitations' : 'this invitation'}
                  </p>
                  <button
                    onClick={() => navigate('/login', { state: { inviteToken: searchParams.get('tokens') || searchParams.get('token') } })}
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
                  Accept {Array.isArray(inviteData) && inviteData.length > 1 ? 'All Invitations' : 'Invitation'}
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
                    navigate('/login', { state: { inviteToken: searchParams.get('tokens') || searchParams.get('token') } })
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
                onClick={() => navigate(`/projects/${Array.isArray(inviteData) ? inviteData[0].project_id : inviteData?.project_id}`)}
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
