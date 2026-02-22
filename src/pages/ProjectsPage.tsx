import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabase'
import type { Project } from '../types'

export default function ProjectsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    fetchProjects()
  }, [user])

  const fetchProjects = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id, projects(*)')
        .eq('user_id', user?.id || '')

      if (error) throw error

      const projects = data?.map((m: { projects: Project | null }) => m.projects).filter((p): p is Project => p !== null) || []
      setProjects(projects)
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

  const handleLogout = async () => {
    await signOut()
    window.location.reload()
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
              <button onClick={() => setShowCreateForm(true)} className="btn btn-primary text-sm whitespace-nowrap">
                + New Project
              </button>
              <button onClick={() => { navigate('/config') }} className="btn btn-secondary text-sm whitespace-nowrap" title="Reconfigure Supabase connection">
                ⚙️ Settings
              </button>
              <button onClick={handleLogout} className="btn border border-red-200 text-red-600 hover:bg-red-50 text-sm whitespace-nowrap px-4 py-2 rounded-xl font-semibold transition-all">
                Logout
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
                to={`/projects/${project.id}`}
                className="card card-accent hover:border-primary-300 hover:-translate-y-1 block"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">{project.name}</h3>
                  <span className="bg-primary-50 text-primary-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-primary-100">
                    Project
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
                  <span className="text-primary-600 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
