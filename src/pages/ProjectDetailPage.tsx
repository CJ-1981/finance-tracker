import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSupabaseClient } from '../lib/supabase'
import type { Project, Transaction, Category } from '../types'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { exportToCSV } from '../utils/csvExport'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchProject()
      fetchTransactions()
      fetchCategories()
    }
  }, [id])

  const fetchProject = async () => {
    if (!id) return
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    if (!id) return
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('project_id', id)
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchCategories = async () => {
    if (!id) return
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', id)

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleExport = () => {
    if (project) {
      exportToCSV(transactions, project.name)
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || 'Uncategorized'
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.color || '#6B7280'
  }

  const getChartData = () => {
    const categoryTotals: Record<string, number> = {}
    const categoryColors: Record<string, string> = {}

    transactions.forEach((t) => {
      const categoryName = getCategoryName(t.category_id)
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + t.amount
      categoryColors[categoryName] = getCategoryColor(t.category_id)
    })

    return {
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          data: Object.values(categoryTotals),
          backgroundColor: Object.values(categoryColors),
        },
      ],
    }
  }

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h1>
          <Link to="/projects" className="btn btn-secondary">
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link to="/projects" className="text-sm text-blue-600 hover:underline">
                ← Back to Projects
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{project.name}</h1>
            </div>
            <div className="flex gap-2">
              <Link to={`/transactions/${id}`} className="btn btn-primary">
                Add Transaction
              </Link>
              <button onClick={handleExport} className="btn btn-secondary">
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Summary Cards */}
          <div className="lg:col-span-3 grid gap-4 md:grid-cols-3">
            <div className="card">
              <div className="text-sm text-gray-600">Total Spent</div>
              <div className="text-2xl font-bold text-gray-900">
                {project.settings?.currency || 'USD'} {totalSpent.toFixed(2)}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-600">Transactions</div>
              <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-600">Categories</div>
              <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
            </div>
          </div>

          {/* Chart */}
          {transactions.length > 0 && (
            <div className="lg:col-span-2 card">
              <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
              <div className="h-64">
                <Pie data={getChartData()} />
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="lg:col-span-1 card">
            <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{transaction.description}</div>
                    <div className="text-sm text-gray-600">{getCategoryName(transaction.category_id)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {project.settings?.currency || 'USD'} {transaction.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">{transaction.date}</div>
                  </div>
                </div>
              ))}
            </div>
            {transactions.length > 5 && (
              <Link to={`/transactions/${id}`} className="block mt-4 text-center text-sm text-blue-600">
                View all transactions →
              </Link>
            )}
          </div>
        </div>
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
          <Link to="/projects" className="flex flex-col items-center p-2 text-gray-600">
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
