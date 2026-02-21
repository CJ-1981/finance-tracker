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
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <div className="flex gap-2">
              <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
                New Project
              </button>
              <button onClick={handleLogout} className="btn btn-secondary">
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
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                )}
                <div className="text-xs text-gray-500">
                  Currency: {project.settings?.currency || 'USD'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          <Link to="/dashboard" className="flex flex-col items-center p-2 text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link to="/projects" className="flex flex-col items-center p-2 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-xs mt-1">Projects</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
