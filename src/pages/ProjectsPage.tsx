import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabase'
import { getPendingInvitation } from '../lib/invitations'
import type { Project } from '../types'
import LanguageSelector from '../components/LanguageSelector'

export default function ProjectsPage() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<(Project & { userRole: string })[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
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
  const [inviteProjectCount, setInviteProjectCount] = useState(0)

  useEffect(() => {
    fetchProjects()
  }, [user])

  const fetchProjects = async () => {
    // If user is not authenticated, clear projects and return early
    if (!user?.id) {
      setProjects([])
      setProjectsLoading(false)
      setProjectsError(null)
      return
    }

    setProjectsLoading(true)
    setProjectsError(null)

    try {
      const supabase = getSupabaseClient()
      console.log('Fetching projects for user:', user.id, 'Supabase client:', !!supabase)

      const { data, error } = await supabase
        .from('project_members')
        .select('role, project_id, projects(*)')
        .eq('user_id', user.id)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Projects data received:', data?.length, 'projects')

      const projectsWithRoles = data?.map((m: any) => {
        const project = m.projects
        // Set userRole to 'owner' if user is the project owner, otherwise use the role from project_members
        const userRole = project.owner_id === user.id ? 'owner' : m.role
        return {
          ...project,
          userRole
        }
      }).filter((p: any) => p.id !== undefined) || []

      console.log('Processed projects:', projectsWithRoles.length)
      setProjects(projectsWithRoles)
      setProjectsError(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error fetching projects:', error)
      console.error('Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        userId: user.id,
        hasSupabase: !!getSupabaseClient()
      })
      setProjects([])
      setProjectsError(errorMessage)
    } finally {
      setProjectsLoading(false)
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

      // Check for existing invitations and collect projects that need new invitations
      const projectInvitations: Array<{ projectId: string; existing: any | null }> = []

      for (const projectId of selectedProjectIds) {
        const existingInvite = await getPendingInvitation(projectId, inviteEmail)
        projectInvitations.push({ projectId, existing: existingInvite })

        if (existingInvite) {
          // Reuse existing invitation token
          tokens.push(existingInvite.token)
        }
      }

      const needsNewInvite = projectInvitations.filter(p => !p.existing)

      // If some projects already have invitations, confirm with user
      if (projectInvitations.some(p => p.existing) && needsNewInvite.length > 0) {
        const existingCount = projectInvitations.length - needsNewInvite.length
        const confirmed = confirm(
          `${inviteEmail} already has pending invitations for ${existingCount} project(s).\n\n` +
          `Click OK to create new invitations for the remaining ${needsNewInvite.length} project(s) and resend all links.\n` +
          `Click Cancel to keep existing invitations.`
        )
        if (!confirmed) return
      } else if (projectInvitations.every(p => p.existing)) {
        // All projects already have invitations
        const confirmed = confirm(
          `${inviteEmail} already has pending invitations for all ${projectInvitations.length} selected project(s).\n\n` +
          `Click OK to resend the same invitation links.\n` +
          `Click Cancel to keep existing invitations.`
        )
        if (!confirmed) return
      }

      // Create new invitations for projects that don't have one
      for (const { projectId, existing } of projectInvitations) {
        if (!existing) {
          const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
          const { error } = await (supabase.from('invitations') as any).insert({
            project_id: projectId,
            email: inviteEmail,
            role: inviteRole,
            invited_by: user.id,
            token: token
          })
          if (error) throw error
          tokens.push(token)
        }
      }

      // Generate combined invitation link with embedded config
      const { getConfig } = await import('../lib/config')
      const { generateInviteLink } = await import('../lib/inviteConfig')
      const config = getConfig()

      // Build invite path using BASE_URL for deployment flexibility
      const basePath = import.meta.env.BASE_URL || ''
      const invitePath = basePath.endsWith('/') ? `${basePath}invite` : `${basePath}/invite`

      const link = generateInviteLink(
        window.location.origin,
        tokens,
        config || undefined,
        invitePath
      )
      setInviteLink(link)
      setInviteRecipientEmail(inviteEmail)
      setShowInviteLink(true)
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteProjectCount(selectedProjectIds.length) // Capture count before clearing
      setSelectedProjectIds([])
      setIsSelectionMode(false)
    } catch (err) {
      console.error(err)
      alert(t('projects.failedInvite'))
    }
  }

  const handleLogout = async () => {
    try {
      console.log('Logging out...')
      await signOut()
      console.log('Logged out successfully, reloading...')
      window.location.href = import.meta.env.BASE_URL || '/'
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect to landing page even if signOut fails
      window.location.href = import.meta.env.BASE_URL || '/'
    }
  }

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0" data-testid="projects-page">
      <header className="bg-white border-b border-slate-200 shadow-sm relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('projects.title')}</h1>
              <p className="text-slate-500 text-sm mt-1">{t('projects.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <LanguageSelector />
              {!isSelectionMode ? (
                <>
                  <button onClick={() => setShowCreateForm(true)} className="btn btn-primary text-sm whitespace-nowrap" data-testid="create-project-button">
                    {t('projects.newProject')}
                  </button>
                  {projects.some(p => p.userRole === 'owner') && (
                    <button
                      onClick={() => setIsSelectionMode(true)}
                      className="btn btn-secondary text-sm whitespace-nowrap"
                    >
                      {t('projects.inviteToMulti')}
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
                    {t('projects.invite')} ({selectedProjectIds.length})
                  </button>
                  <button
                    onClick={() => {
                      setIsSelectionMode(false)
                      setSelectedProjectIds([])
                    }}
                    className="btn btn-secondary text-sm whitespace-nowrap"
                  >
                    {t('projects.cancelSelection')}
                  </button>
                </>
              )}
              <button
                onClick={() => { navigate('/config') }}
                className="btn btn-secondary text-sm whitespace-nowrap sm:hidden"
                title={t('projects.reconfigure')}
                aria-label={t('projects.reconfigure')}
              >
                ⚙️
              </button>
              <button onClick={() => { navigate('/config') }} className="btn btn-secondary text-sm whitespace-nowrap hidden sm:inline-flex" title={t('projects.reconfigure')}>
                ⚙️ {t('common.settings')}
              </button>
              <button onClick={handleLogout} className="btn border border-red-200 text-red-600 hover:bg-red-50 text-sm whitespace-nowrap px-4 py-2 rounded-xl font-semibold transition-all">
                <span className="hidden sm:inline">{t('common.logout')}</span>
                <span className="sm:hidden">{t('common.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projectsLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-slate-200 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded mb-2 w-1/2"></div>
                <div className="h-4 bg-slate-200 rounded mb-4 w-full"></div>
                <div className="h-8 bg-slate-200 rounded mt-4"></div>
              </div>
            ))}
          </div>
        ) : projectsError ? (
          <div className="card text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Projects</h2>
              <p className="text-gray-600 mb-2">Failed to fetch your projects. Please check your connection and try again.</p>
              <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded mb-4">{projectsError}</p>
            </div>
            <button onClick={fetchProjects} className="btn btn-primary">
              Try Again
            </button>
          </div>
        ) : (
          <>
            {showCreateForm && (
              <div className="card mb-6" data-testid="create-project-form">
            <h2 className="text-lg font-semibold mb-4">{t('projects.createNewProject')}</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('projects.projectName')}
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
                  {t('projects.description')}
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
                  {t('common.create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-state">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('projects.noProjectsYet')}</h2>
            <p className="text-gray-600 mb-6">{t('projects.createFirstProject')}</p>
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
              {t('projects.createProject')}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="projects-grid">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={isSelectionMode ? '#' : `/projects/${project.id}`}
                data-testid={`project-card-${project.id}`}
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
                    {t(`projects.${['owner', 'member', 'viewer'].includes(project.userRole || '') ? project.userRole : 'unknownRole'}`)}
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
                      {t('projects.viewDetails')}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
          </>
        )}
      </main>

      {/* Multi-Project Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('projects.inviteToProjects')}</h2>
            <p className="text-slate-500 text-sm mb-6">
              {t('projects.invitingProjects', { count: selectedProjectIds.length })}
            </p>
            <form onSubmit={handleMultiInvite} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">{t('projects.emailAddress')}</label>
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
                <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">{t('projects.role')}</label>
                <select
                  className="input bg-slate-50 focus:bg-white"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                >
                  <option value="member">{t('projects.roleMember')}</option>
                  <option value="viewer">{t('projects.roleViewer')}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1 py-3">{t('projects.sendBundleInvite')}</button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-secondary flex-1 py-3"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Success Modal */}
      {showInviteLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('projects.invitationsCreated')}</h2>
            <p className="text-slate-600 mb-6">
              {t('projects.invitationLinkGenerated', { count: inviteProjectCount })}
            </p>

            <a
              href={`mailto:${inviteRecipientEmail}?subject=${encodeURIComponent(t('projects.invitationEmailSubject', { count: inviteProjectCount }))}&body=${encodeURIComponent(t('projects.invitationEmailBody', { count: inviteProjectCount, role: inviteRole, link: inviteLink }))}`}
              className="block w-full btn btn-primary text-center mb-4 py-3 shadow-lg shadow-primary-200"
            >
              {t('projects.openEmailClient')}
            </a>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t('projects.combinedInviteLink')}</p>
              <p className="text-sm text-primary-600 break-all font-medium">{inviteLink}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => {
                  const fullMessage =
                    `Subject: ${t('projects.invitationEmailSubject', { count: inviteProjectCount })}\n\n` +
                    `${t('projects.invitationEmailBody', { count: inviteProjectCount, role: inviteRole, link: inviteLink })}`
                  navigator.clipboard.writeText(fullMessage)
                  alert(t('projects.messageCopied'))
                }}
                className="btn btn-secondary py-2.5"
              >
                {t('projects.copyMessage')}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink)
                  alert(t('projects.linkCopied'))
                }}
                className="btn btn-secondary py-2.5"
              >
                {t('projects.copyLinkOnly')}
              </button>
            </div>

            <button
              onClick={() => setShowInviteLink(false)}
              className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
