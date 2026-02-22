import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSupabaseClient } from '../lib/supabase'
import { getPendingInvitation } from '../lib/invitations'
import type { Project, Transaction, Category } from '../types'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js'
import { Pie, Line } from 'react-chartjs-2'
import { useAuth } from '../hooks/useAuth'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler)

export default function ProjectDetailPage() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({ name: '', description: '', currency: 'USD' })
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member')
  const [inviteLink, setInviteLink] = useState('')
  const [showInviteLink, setShowInviteLink] = useState(false)
  const [inviteRecipientEmail, setInviteRecipientEmail] = useState('') // Store for mailto link

  // Quick add transaction modal states
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false)
  const [transactionFormData, setTransactionFormData] = useState({
    amount: '',
    currency_code: 'USD',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [transactionCustomData, setTransactionCustomData] = useState<Record<string, string>>({})
  const [savingTransaction, setSavingTransaction] = useState(false)

  // Date filter states
  const [datePeriod, setDatePeriod] = useState<'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'all'>('today')

  useEffect(() => {
    if (id) {
      fetchProject()
      fetchTransactions()
      fetchCategories()
    }
  }, [id])

  // Load date period preference from project settings
  useEffect(() => {
    if (project?.settings?.default_date_period) {
      setDatePeriod(project.settings.default_date_period)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id])

  // Save date period preference when changed (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (project && datePeriod !== project.settings?.default_date_period) {
        saveDatePeriodPreference(datePeriod)
      }
    }, 500) // Debounce to avoid too many updates
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePeriod])

  const saveDatePeriodPreference = async (period: typeof datePeriod) => {
    if (!project) return
    try {
      const supabase = getSupabaseClient()
      const updatedSettings = {
        ...project.settings,
        default_date_period: period
      }
      await (supabase
        .from('projects') as any)
        .update({ settings: updatedSettings })
        .eq('id', id)
      setProject({ ...project, settings: updatedSettings as any })
    } catch (err) {
      console.error('Error saving date period preference:', err)
    }
  }

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

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()
      const updatedSettings = {
        ...(project?.settings || {}),
        currency: editFormData.currency,
        date_format: project?.settings?.date_format || 'YYYY-MM-DD',
        notifications_enabled: project?.settings?.notifications_enabled ?? true,
      }
      const { error } = await (supabase.from('projects') as any).update({
        name: editFormData.name,
        description: editFormData.description,
        settings: updatedSettings
      }).eq('id', id as string)
      if (error) throw error
      setProject({ ...project!, name: editFormData.name, description: editFormData.description, settings: updatedSettings as any })
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating project:', err)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id || !inviteEmail) return
    try {
      const supabase = getSupabaseClient()

      // Check for existing pending invitation to this email for this project
      const existingInvite = await getPendingInvitation(id!, inviteEmail)

      let token: string | null = null
      let isNewInvite = false

      if (existingInvite) {
        // Reuse existing invitation if role matches
        if (existingInvite.role === inviteRole) {
          if (!confirm(`An invitation to ${inviteEmail} is already pending. Resend the same invitation link?`)) {
            return
          }
          token = existingInvite.token
          isNewInvite = false
        } else {
          // Role changed - ask to create new invitation or update existing
          const shouldCreateNew = confirm(
            `${inviteEmail} already has a pending invitation as ${existingInvite.role}.\n\n` +
            `Click OK to send a new invitation as ${inviteRole}.\n` +
            `Click Cancel to keep the existing invitation.`
          )
          if (!shouldCreateNew) {
            return
          }
          // Mark old invitation as expired (replaced by new one)
          await (supabase.from('invitations') as any)
            .update({ status: 'expired' })
            .eq('id', existingInvite.id)
          // Create new invitation below
          isNewInvite = true
        }
      } else {
        isNewInvite = true
      }

      if (isNewInvite) {
        // Create new invitation
        token = Math.random().toString(36).substring(2) + Date.now().toString(36)
        const { error } = await (supabase.from('invitations') as any).insert({
          project_id: id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: user.id,
          token: token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        if (error) throw error
      }

      // Generate invite link and store recipient email for mailto link
      const link = `${window.location.origin}/finance-tracker/invite?token=${token!}`
      setInviteLink(link)
      setInviteRecipientEmail(inviteEmail) // Store before clearing
      setShowInviteLink(true)
      setShowInviteModal(false)
      setInviteEmail('')
    } catch (err) {
      console.error(err)
      alert('Failed to send invitation')
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

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    setSavingTransaction(true)
    try {
      const supabase = getSupabaseClient()
      const { error } = await (supabase.from('transactions') as any).insert({
        project_id: id,
        amount: parseFloat(transactionFormData.amount),
        currency_code: transactionFormData.currency_code,
        category_id: transactionFormData.category_id || null,
        date: transactionFormData.date,
        custom_data: transactionCustomData,
        created_by: user?.id,
      })

      if (error) throw error

      // Reset form and close modal
      setTransactionFormData({
        amount: '',
        currency_code: 'USD',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
      })
      setTransactionCustomData({})
      setShowAddTransactionModal(false)

      // Refresh transactions
      fetchTransactions()
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('Failed to add transaction. Please try again.')
    } finally {
      setSavingTransaction(false)
    }
  }

  const openAddTransactionModal = () => {
    setTransactionFormData({
      amount: '',
      currency_code: project?.settings?.currency || 'USD',
      category_id: '',
      date: new Date().toISOString().split('T')[0],
    })
    setTransactionCustomData({})
    setShowAddTransactionModal(true)
  }

  // Filter transactions based on selected date period
  const getFilteredTransactions = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (datePeriod) {
      case 'today':
        return transactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate.toDateString() === today.toDateString()
        })
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return transactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate.toDateString() === yesterday.toDateString()
        })
      case 'last7days':
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return transactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= sevenDaysAgo && transactionDate <= today
        })
      case 'last30days':
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return transactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= thirtyDaysAgo && transactionDate <= today
        })
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return transactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= startOfMonth && transactionDate <= endOfMonth
        })
      case 'lastMonth':
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        return transactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth
        })
      case 'thisYear':
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const endOfYear = new Date(now.getFullYear(), 11, 31)
        return transactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= startOfYear && transactionDate <= endOfYear
        })
      case 'all':
      default:
        return transactions
    }
  }

  const filteredTransactions = getFilteredTransactions()

  const getChartData = () => {
    const categoryTotals: Record<string, number> = {}
    const categoryColors: Record<string, string> = {}

    filteredTransactions.forEach((t) => {
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

  const getAreaChartData = () => {
    // Get all unique dates from filtered transactions, sorted
    const dates = Array.from(new Set(filteredTransactions.map(t => t.date))).sort()

    // Get all categories
    const categoryNames = Array.from(new Set(filteredTransactions.map(t => getCategoryName(t.category_id))))

    // Build dataset for each category
    const datasets = categoryNames.map((categoryName) => {
      const category = categories.find(c => c.name === categoryName)
      const color = category?.color || '#6B7280'

      // Calculate cumulative amount for each date
      let cumulative = 0
      const data = dates.map(date => {
        const dayTotal = filteredTransactions
          .filter(t => t.date === date && getCategoryName(t.category_id) === categoryName)
          .reduce((sum, t) => sum + t.amount, 0)
        cumulative += dayTotal
        return cumulative
      })

      return {
        label: categoryName,
        data: data,
        borderColor: color,
        backgroundColor: `${color}33`,
        fill: true,
        tension: 0.4,
      }
    })

    return {
      labels: dates,
      datasets: datasets,
    }
  }

  const totalSpent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  const avgTransaction = filteredTransactions.length > 0 ? totalSpent / filteredTransactions.length : 0

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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <Link to="/projects" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
                ← Back to Projects
              </Link>
              {isEditing ? (
                <form onSubmit={handleEditProject} className="flex flex-col gap-3 mt-1 w-full max-w-md">
                  <input type="text" className="input" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} required placeholder="Project Name" />
                  <textarea className="input" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} rows={2} placeholder="Project Description (Optional)" />
                  <div className="flex gap-2 items-center">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Currency:</label>
                    <input type="text" className="input w-24" value={editFormData.currency} onChange={e => setEditFormData({ ...editFormData, currency: e.target.value })} placeholder="USD, EUR, etc." maxLength={5} />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button type="submit" className="btn btn-primary px-4 py-1">Save</button>
                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary px-4 py-1">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="group flex flex-col gap-1 items-start mt-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                    <button onClick={() => {
                      setIsEditing(true)
                      setEditFormData({ name: project.name, description: project.description || '', currency: project.settings?.currency || 'USD' })
                    }} className="text-blue-500 hover:text-blue-700 text-sm opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                  </div>
                  {project.description && <p className="text-sm text-gray-600 max-w-2xl">{project.description}</p>}

                  {/* Date Period Selector */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Period:</label>
                    <select
                      value={datePeriod}
                      onChange={(e) => setDatePeriod(e.target.value as any)}
                      className="input py-1 px-3 text-sm w-40 flex-shrink-0"
                    >
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="last7days">Last 7 Days</option>
                      <option value="last30days">Last 30 Days</option>
                      <option value="thisMonth">This Month</option>
                      <option value="lastMonth">Last Month</option>
                      <option value="thisYear">This Year</option>
                      <option value="all">All Time</option>
                    </select>
                    <span className="text-xs text-gray-500">
                      ({filteredTransactions.length} transactions)
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setShowInviteModal(true)} className="btn btn-secondary border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm whitespace-nowrap">
                Invite
              </button>
              <button onClick={openAddTransactionModal} className="btn btn-primary text-sm whitespace-nowrap">
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      </header>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Invite to Project</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required className="input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="input" value={inviteRole} onChange={e => setInviteRole(e.target.value as any)}>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn btn-primary w-full">Send Invite</button>
                <button type="button" onClick={() => setShowInviteModal(false)} className="btn btn-secondary w-full">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInviteLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Invitation Created!</h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose how you want to send the invitation:
            </p>

            {/* Email Client Button */}
            <a
              href={`mailto:${inviteRecipientEmail}?subject=${encodeURIComponent(`You're invited to join "${project?.name}"`)}&body=${encodeURIComponent(`You've been invited to join the project "${project?.name}" as a ${inviteRole}.\n\nClick the link below to accept the invitation:\n${inviteLink}\n\nThis invitation expires in 7 days.`)}`}
              className="block w-full btn btn-primary text-center mb-3"
            >
              📧 Open Email Client
            </a>

            {/* Invite Link */}
            <div className="bg-gray-50 p-3 rounded-md mb-3">
              <p className="text-xs text-gray-500 mb-1">Invite Link:</p>
              <p className="text-sm text-blue-600 break-all">{inviteLink}</p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const fullMessage =
                    `Subject: You're invited to join "${project?.name}"\n\n` +
                    `You've been invited to join the project "${project?.name}" as a ${inviteRole}.\n\n` +
                    `Click the link below to accept the invitation:\n${inviteLink}\n\n` +
                    `This invitation expires in 7 days.`
                  navigator.clipboard.writeText(fullMessage)
                  alert('Full invitation copied to clipboard!')
                }}
                className="btn btn-secondary"
              >
                📋 Copy Full Message
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink)
                  alert('Link copied to clipboard!')
                }}
                className="btn btn-secondary"
              >
                🔗 Copy Link Only
              </button>
            </div>

            <button
              onClick={() => setShowInviteLink(false)}
              className="w-full mt-3 text-sm text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      )}

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
              <div className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-600">Avg Transaction</div>
              <div className="text-2xl font-bold text-gray-900">
                {project.settings?.currency || 'USD'} {avgTransaction.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Charts */}
          {filteredTransactions.length > 0 && (
            <>
              <div className="lg:col-span-2 card">
                <h2 className="text-lg font-semibold mb-4">Amount by Category</h2>
                <div className="h-64">
                  <Pie data={getChartData()} />
                </div>
              </div>

              <div className="lg:col-span-3 card">
                <h2 className="text-lg font-semibold mb-4">Amount Over Time by Category</h2>
                <div className="h-64">
                  <Line
                    data={getAreaChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        tooltip: {
                          mode: 'index' as const,
                          intersect: false,
                        },
                      },
                      scales: {
                        x: {
                          stacked: true,
                          title: {
                            display: true,
                            text: 'Date',
                          },
                        },
                        y: {
                          stacked: true,
                          title: {
                            display: true,
                            text: 'Cumulative Amount',
                          },
                          beginAtZero: true,
                        },
                      },
                      elements: {
                        point: {
                          radius: 0,
                          hitRadius: 10,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Recent Transactions */}
          <div className="lg:col-span-1 card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
              <Link to={`/transactions/${id}`} className="text-sm text-blue-600 hover:text-blue-700">
                Show All →
              </Link>
            </div>
            <div className="space-y-1">
              {filteredTransactions.slice(0, 5).map((transaction) => (
                <Link key={transaction.id} to={`/transactions/${id}`} className="flex justify-between items-start p-2 -mx-2 hover:bg-gray-50 rounded transition-colors group cursor-pointer block">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">{getCategoryName(transaction.category_id)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {project.settings?.currency || 'USD'} {transaction.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">{transaction.date}</div>
                  </div>
                </Link>
              ))}
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500">
                  No transactions for selected period
                </div>
              )}
            </div>
            {filteredTransactions.length > 5 && (
              <Link to={`/transactions/${id}`} className="block mt-4 text-center text-sm text-blue-600">
                View all transactions →
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Quick Add Transaction Modal */}
      {showAddTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Transaction</h2>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label htmlFor="t-amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <div className="flex gap-2">
                  <input
                    id="t-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    inputMode="decimal"
                    className="input flex-1"
                    value={transactionFormData.amount}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: e.target.value })}
                    required
                  />
                  <select
                    id="t-currency"
                    className="input w-24"
                    value={transactionFormData.currency_code}
                    onChange={(e) => setTransactionFormData({ ...transactionFormData, currency_code: e.target.value })}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="KRW">KRW</option>
                    <option value="CNY">CNY</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="t-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  id="t-date"
                  type="date"
                  className="input"
                  value={transactionFormData.date}
                  onChange={(e) => setTransactionFormData({ ...transactionFormData, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="t-category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="t-category"
                  className="input"
                  value={transactionFormData.category_id}
                  onChange={(e) => setTransactionFormData({ ...transactionFormData, category_id: e.target.value })}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Fields */}
              {project?.settings?.custom_fields?.map((field: any) => (
                <div key={field.name}>
                  <label htmlFor={`t-${field.name}`} className="block text-sm font-medium text-gray-700 mb-1">
                    {field.name}
                  </label>
                  {field.type === 'text' ? (
                    <input
                      id={`t-${field.name}`}
                      type="text"
                      className="input"
                      value={transactionCustomData[field.name] || ''}
                      onChange={(e) => setTransactionCustomData({ ...transactionCustomData, [field.name]: e.target.value })}
                    />
                  ) : field.type === 'number' ? (
                    <input
                      id={`t-${field.name}`}
                      type="number"
                      step="0.01"
                      className="input"
                      value={transactionCustomData[field.name] || ''}
                      onChange={(e) => setTransactionCustomData({ ...transactionCustomData, [field.name]: e.target.value })}
                    />
                  ) : (
                    <input
                      id={`t-${field.name}`}
                      type="date"
                      className="input"
                      value={transactionCustomData[field.name] || ''}
                      onChange={(e) => setTransactionCustomData({ ...transactionCustomData, [field.name]: e.target.value })}
                    />
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTransactionModal(false)}
                  className="btn btn-secondary flex-1"
                  disabled={savingTransaction}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={savingTransaction}
                >
                  {savingTransaction ? 'Adding...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
