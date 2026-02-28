import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabase'
import type { Project } from '../types'

export default function ProjectsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<(Project & { userRole: string })[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  // Multi-invite states
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member')
  const [inviteLink, setInviteLink] = useState('')
  const [showInviteLink, setShowInviteLink] = useState(false)
  const [inviteRecipientEmail, setInviteRecipientEmail] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [user])

  const fetchProjects = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('project_members')
        .select('role, project_id, projects(*)')
        .eq('user_id', user?.id || '')

      if (error) throw error

      const projectsWithRoles = data?.map((m: any) => ({
        ...m.projects,
        userRole: m.role
      })).filter((p: any) => p.id !== undefined) || []

      setProjects(projectsWithRoles)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user?.id) {
      console.error('User not authenticated')
      return
    }

    try {
      const supabase = getSupabaseClient()
      // Type assertion needed: Supabase insert types require generated types from Supabase CLI
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          description: formData.description || null,
          owner_id: user.id,
          settings: { currency: 'USD', date_format: 'YYYY-MM-DD', notifications_enabled: true },
        } as any)
        .select('id')
        .single()

      if (error) throw error

      const newProjectId = (data as any)?.id
      if (!newProjectId) {
        throw new Error('Failed to create project')
      }

      setFormData({ name: '', description: '' })
      setShowCreateForm(false)
      fetchProjects()
      navigate(`/projects/${newProjectId}`)
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const handleMultiInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || selectedProjectIds.length === 0 || !inviteEmail) return

    try {
      const supabase = getSupabaseClient()
      const tokens: string[] = []

      for (const projectId of selectedProjectIds) {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
        const { error } = await (supabase.from('invitations') as any).insert({
          project_id: projectId,
          email: inviteEmail,
          role: inviteRole,
          invited_by: user.id,
          token: token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        if (error) throw error
        tokens.push(token)
      }

      // Generate combined invitation link with embedded config
      const { getConfig } = await import('../lib/config')
      const { encodeConfigForInvite } = await import('../lib/inviteConfig')
      const config = getConfig()

      const url = new URL(window.location.origin)
      url.pathname = '/finance-tracker/invite'
      url.searchParams.set('tokens', tokens.join(','))

      if (config) {
        const encodedConfig = encodeConfigForInvite(config)
        url.searchParams.set('config', encodedConfig)
      }

      const link = url.toString()
      setInviteLink(link)
      setInviteRecipientEmail(inviteEmail)
      setShowInviteLink(true)
      setShowInviteModal(false)
      setInviteEmail('')
      setSelectedProjectIds([])
      setIsSelectionMode(false)
    } catch (err) {
      console.error(err)
      alert('Failed to send invitations')
    }
  }

  const handleLogout = async () => {
    await signOut()
    window.location.reload()
  }

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <header className="bg-white border-b border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial Tracker</h1>
              <p className="text-slate-500 text-sm mt-1">Manage your projects and transactions</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {!isSelectionMode ? (
                <>
                  <button onClick={() => setShowCreateForm(true)} className="btn btn-primary text-sm whitespace-nowrap">
                    + New Project
                  </button>
                  {projects.some(p => p.userRole === 'owner') && (
                    <button
                      onClick={() => setIsSelectionMode(true)}
                      className="btn btn-secondary text-sm whitespace-nowrap hidden sm:inline-flex"
                    >
                      Invite to Multi
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    disabled={selectedProjectIds.length === 0}
                    className="btn btn-primary text-sm whitespace-nowrap disabled:opacity-50"
                  >
                    Invite ({selectedProjectIds.length})
                  </button>
                  <button
                    onClick={() => {
                      setIsSelectionMode(false)
                      setSelectedProjectIds([])
                    }}
                    className="btn btn-secondary text-sm whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button onClick={() => { navigate('/config') }} className="btn btn-secondary text-sm whitespace-nowrap sm:hidden" title="Reconfigure Supabase connection">
                ⚙️
              </button>
              <button onClick={() => { navigate('/config') }} className="btn btn-secondary text-sm whitespace-nowrap hidden sm:inline-flex" title="Reconfigure Supabase connection">
                ⚙️ Settings
              </button>
              <button onClick={handleLogout} className="btn border border-red-200 text-red-600 hover:bg-red-50 text-sm whitespace-nowrap px-4 py-2 rounded-xl font-semibold transition-all">
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCreateForm && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h2>
            <p className="text-gray-600 mb-6">Create your first project to get started</p>
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={isSelectionMode ? '#' : `/projects/${project.id}`}
                onClick={(e) => {
                  if (isSelectionMode) {
                    e.preventDefault()
                    if (project.userRole === 'owner') {
                      toggleProjectSelection(project.id)
                    }
                  }
                }}
                className={`card card-accent hover:-translate-y-1 block relative ${isSelectionMode && project.userRole !== 'owner' ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-primary-300'
                  } ${selectedProjectIds.includes(project.id) ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50/30' : ''}`}
              >
                {isSelectionMode && project.userRole === 'owner' && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedProjectIds.includes(project.id)
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'bg-white border-slate-300'
                      }`}>
                      {selectedProjectIds.includes(project.id) && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">{project.name}</h3>
                  <span className="bg-primary-50 text-primary-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-primary-100">
                    {project.userRole}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    {project.settings?.currency || 'USD'}
                  </span>
                  {!isSelectionMode && (
                    <span className="text-primary-600 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                      View Details →
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Multi-Project Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Invite to Projects</h2>
            <p className="text-slate-500 text-sm mb-6">
              You are inviting someone to join <strong>{selectedProjectIds.length}</strong> project{selectedProjectIds.length > 1 ? 's' : ''}.
            </p>
            <form onSubmit={handleMultiInvite} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  className="input bg-slate-50 focus:bg-white"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Role</label>
                <select
                  className="input bg-slate-50 focus:bg-white"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                >
                  <option value="member">Member (Can add/edit)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1 py-3">Send Bundle Invite</button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Success Modal */}
      {showInviteLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Invitations Created!</h2>
            <p className="text-slate-600 mb-6">
              A combined invitation link has been generated for {selectedProjectIds.length} projects.
            </p>

            <a
              href={`mailto:${inviteRecipientEmail}?subject=${encodeURIComponent(`You're invited to join ${selectedProjectIds.length} projects`)}&body=${encodeURIComponent(`You've been invited to join ${selectedProjectIds.length} projects as a ${inviteRole}.\n\nClick the link below to accept all invitations:\n${inviteLink}\n\nThis invitation expires in 7 days.`)}`}
              className="block w-full btn btn-primary text-center mb-4 py-3 shadow-lg shadow-primary-200"
            >
              📧 Open Email Client
            </a>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Combined Invite Link:</p>
              <p className="text-sm text-primary-600 break-all font-medium">{inviteLink}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => {
                  const fullMessage =
                    `Subject: You're invited to join ${selectedProjectIds.length} projects\n\n` +
                    `You've been invited to join ${selectedProjectIds.length} projects as a ${inviteRole}.\n\n` +
                    `Click the link below to accept all invitations:\n${inviteLink}\n\n` +
                    `This invitation expires in 7 days.`
                  navigator.clipboard.writeText(fullMessage)
                  alert('Full invitation message copied to clipboard!')
                }}
                className="btn btn-secondary py-2.5"
              >
                📋 Copy Message
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink)
                  alert('Link copied to clipboard!')
                }}
                className="btn btn-secondary py-2.5"
              >
                🔗 Copy Link Only
              </button>
            </div>

            <button
              onClick={() => setShowInviteLink(false)}
              className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
