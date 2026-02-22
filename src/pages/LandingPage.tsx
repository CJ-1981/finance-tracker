import { Link } from 'react-router-dom'

export default function LandingPage() {
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
            Track expenses, manage budgets, and analyze spending patterns with ease and elegance.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full border border-primary-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            COLLABORATIVE & SECURE
          </div>
        </div>

        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Features</h2>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Multi-Currency Support</h3>
                <p className="text-sm text-slate-600">Track expenses in USD, EUR, GBP, JPY, KRW, CNY, INR</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Custom Categories</h3>
                <p className="text-sm text-slate-600">Create and organize categories your way</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Visual Charts</h3>
                <p className="text-sm text-slate-600">Pie charts and area plots for insights</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Team Collaboration</h3>
                <p className="text-sm text-slate-600">Share projects with team members</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Custom Fields</h3>
                <p className="text-sm text-slate-600">Add dropdown lists and custom data fields</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">CSV Export</h3>
                <p className="text-sm text-slate-600">Export your data for analysis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="btn btn-primary px-8 py-3 text-lg"
          >
            Get Started
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Your data is secured with Supabase Auth and stored in your own project
        </p>
      </div>
    </div>
  )
}
