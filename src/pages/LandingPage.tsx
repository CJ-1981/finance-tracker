import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function LandingPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
      {/* Background blobs for flair */}
      <div className="absolute top-0 -right-20 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 -left-20 w-80 h-80 bg-secondary-100 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-3xl w-full text-center relative z-10">
        <div className="mb-12">
          <h1 className="text-6xl font-black text-slate-900 mb-6 tracking-tight">
            Financial <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">Tracker</span>
          </h1>
          <p className="text-xl text-slate-600 mb-4 max-w-xl mx-auto leading-relaxed">
            {t('landing.tagline')}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full border border-primary-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            {t('landing.collaborativeSecure')}
          </div>
        </div>

        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('landing.features')}</h2>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{t('landing.multiCurrencySupport')}</h3>
                <p className="text-sm text-slate-600">{t('landing.multiCurrencyDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{t('landing.customCategories')}</h3>
                <p className="text-sm text-slate-600">{t('landing.customCategoriesDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{t('landing.visualCharts')}</h3>
                <p className="text-sm text-slate-600">{t('landing.visualChartsDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{t('landing.teamCollaboration')}</h3>
                <p className="text-sm text-slate-600">{t('landing.teamCollaborationDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{t('landing.customFields')}</h3>
                <p className="text-sm text-slate-600">{t('landing.customFieldsDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{t('landing.csvExport')}</h3>
                <p className="text-sm text-slate-600">{t('landing.csvExportDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="btn btn-primary px-8 py-3 text-lg"
          >
            {t('landing.getStarted')}
          </Link>
          <Link
            to="/config"
            className="btn btn-secondary px-8 py-3 text-lg"
          >
            {t('landing.configureDatabase')}
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          {t('landing.dataSecured')}
        </p>
      </div>
    </div>
  )
}
