import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabase'
import type { Project } from '../types'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [user])

  const fetchProjects = async () => {
    try {
      const supabase = getSupabaseClient()

      console.log('Fetching projects for user:', user?.id)

      // First try to get projects where user is the owner
      // This bypasses the project_members circular dependency
      const { data: ownedProjects, error: ownerError } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user?.id || '')

      console.log('Owner projects query result:', { ownedProjects, ownerError })

      if (ownerError) {
        console.log('Owner query error:', ownerError)
        console.log('Error code:', ownerError.code)
        console.log('Error message:', ownerError.message)
        console.log('Error hint:', ownerError.hint)

        // Check for database not set up errors
        const isDbError =
          ownerError.code === 'PGRST116' ||
          ownerError.code === 'PGRST204' ||
          ownerError.message?.includes('relation') ||
          ownerError.message?.includes('does not exist') ||
          ownerError.hint?.includes('table')

        console.log('Is DB error?', isDbError)

        if (isDbError) {
          console.log('Setting DB error to true')
          setDbError(true)
          setLoading(false)
          return
        }
        // For other errors, continue with empty result
        console.log('Continuing with empty projects due to:', ownerError.message)
      }

      // Then try to get projects where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('project_id, projects(*)')
        .eq('user_id', user?.id || '')

      let memberProjects: Project[] = []
      if (!memberError && memberData) {
        memberProjects = memberData
          .map((m: { projects: Project | null }) => m.projects)
          .filter((p): p is Project => p !== null)
      }

      // Combine both lists (avoiding duplicates)
      const allProjects = [...(ownedProjects || []), ...memberProjects]
      const uniqueProjects = Array.from(
        new Map(allProjects.map(p => [p.id, p])).values()
      )

      setProjects(uniqueProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
      // Check error object more thoroughly
      const err = error as any
      if (err?.message?.includes('relation') ||
        err?.message?.includes('does not exist') ||
        err?.code === 'PGRST116') {
        setDbError(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show database setup message if tables don't exist
  if (dbError) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">{t('dashboardPage.databaseSetupRequired')}</h1>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboardPage.databaseTablesNotFound')}</h2>
            <p className="text-gray-600 mb-6">
              {t('dashboardPage.databaseNotCreated')}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">{t('dashboardPage.toFixThis')}</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>{t('dashboardPage.step1')}</li>
                <li>{t('dashboardPage.step2')}</li>
                <li>{t('dashboardPage.step3')}</li>
                <li>{t('dashboardPage.step4')}</li>
                <li>{t('dashboardPage.step5')}</li>
                <li>{t('dashboardPage.step6')}</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              {t('dashboardPage.refreshPage')}
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{t('dashboardPage.title')}</h1>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[150px] sm:max-w-none">{user?.email}</span>
              <button onClick={() => { navigate('/config') }} className="btn btn-secondary text-sm whitespace-nowrap" title={t('common.settingsTooltip')}>
                ⚙️ {t('common.settings')}
              </button>
              <button onClick={() => { signOut(); window.location.reload() }} className="btn btn-secondary text-sm whitespace-nowrap">
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('dashboardPage.noProjectsYet')}</h2>
            <p className="text-gray-600 mb-6">{t('dashboardPage.createFirstProject')}</p>
            <Link to="/projects" className="btn btn-primary">
              {t('dashboardPage.createProject')}
            </Link>
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
                  {t('dashboardPage.currency')}: {project.settings?.currency || 'USD'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          <Link to="/dashboard" className="flex flex-col items-center p-2 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">{t('dashboardPage.home')}</span>
          </Link>
          <Link to="/projects" className="flex flex-col items-center p-2 text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-xs mt-1">{t('dashboardPage.projects')}</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
