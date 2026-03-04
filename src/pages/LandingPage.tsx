import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'

export default function LandingPage() {
  const { t } = useTranslation()

  // Fallback for translations to prevent blank page on mobile
  const text = (key: string, fallback: string) => {
    try {
      const result = t(key)
      // If translation returns the key itself, use fallback
      return result === key ? fallback : result
    } catch {
      return fallback
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 relative overflow-hidden">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      {/* Background blobs for flair */}
      <div className="absolute top-0 -right-20 w-80 h-80 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 -left-20 w-80 h-80 bg-secondary-100 dark:bg-secondary-900/20 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-3xl w-full text-center relative z-10">
        <div className="mb-12">
          <h1 className="text-6xl font-black text-slate-900 dark:text-slate-100 mb-6 tracking-tight">
            Financial <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">Tracker</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-4 max-w-xl mx-auto leading-relaxed">
            {text('landing.tagline', 'Track expenses, manage budgets, and analyze spending patterns with ease and elegance.')}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-full border border-primary-100 dark:border-primary-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            {text('landing.collaborativeSecure', 'COLLABORATIVE & SECURE')}
          </div>
        </div>

        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{text('landing.features', 'Features')}</h2>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{text('landing.multiCurrencySupport', 'Multi-Currency Support')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{text('landing.multiCurrencyDesc', 'Track expenses in USD, EUR, GBP, JPY, KRW, CNY, INR')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{text('landing.customCategories', 'Custom Categories')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{text('landing.customCategoriesDesc', 'Create and organize categories your way')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{text('landing.visualCharts', 'Visual Charts')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{text('landing.visualChartsDesc', 'Pie charts and area plots for insights')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{text('landing.teamCollaboration', 'Team Collaboration')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{text('landing.teamCollaborationDesc', 'Share projects with team members')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{text('landing.customFields', 'Custom Fields')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{text('landing.customFieldsDesc', 'Add dropdown lists and custom data fields')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{text('landing.csvExport', 'CSV Export')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{text('landing.csvExportDesc', 'Export your data for analysis')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="btn btn-primary px-8 py-3 text-lg"
          >
            {text('landing.getStarted', 'Get Started')}
          </Link>
          <Link
            to="/config"
            className="btn btn-secondary px-8 py-3 text-lg"
          >
            {text('landing.configureDatabase', 'Configure Database')}
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          {text('landing.supabaseAuthNote', 'Create your Supabase account to securely store and manage your financial data')}
        </p>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {text('landing.dataSecured', 'Your data is secured with Supabase Auth and stored in your own project')}
        </p>
      </div>
    </div>
  )
}
