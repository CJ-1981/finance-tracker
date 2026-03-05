import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSupabaseClient, resetSupabaseClient } from '../lib/supabase'
import { getConfig } from '../lib/config'
import type { Project, Transaction, Category } from '../types'
import TransactionModal from '../components/TransactionModal'
import CashCounterModal from '../components/CashCounterModal'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js'
import { Pie, Line } from 'react-chartjs-2'
import { useAuth } from '../hooks/useAuth'
import { filterByCurrency } from '../utils/currencyFilter'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler)

export default function ProjectDetailPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugMessages, setDebugMessages] = useState<string[]>([])
  const [showDebugPanel, setShowDebugPanel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('debugPanelEnabled') === 'true'
    }
    return false
  })
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  // Enhanced hash function that includes more data for better detection
  const createDataHash = (data: any): string => {
    if (!data) return 'null'
    if (Array.isArray(data)) {
      // Include length, all IDs, and first 3 items for better hash
      const ids = data.map(d => d.id).sort().join(',')
      const sample = JSON.stringify(data.slice(0, 3))
      return `array-${data.length}-${ids}-${sample}`
    }
    if (data.id) {
      // For single objects, include key fields
      return `obj-${data.id}-${data.name || data.title || ''}-${JSON.stringify(data).slice(0, 50)}`
    }
    return JSON.stringify(data).slice(0, 100)
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({ name: '', description: '', currency: 'USD' })

  // Quick add transaction modal states
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false)
  const [showCashCounterModal, setShowCashCounterModal] = useState(false)
  const [chartMode, setChartMode] = useState<'cumulative' | 'absolute'>('absolute')

  // Chart grouping states (what to group segments by - category or custom text field)
  const [categoryChartGroupBy, setCategoryChartGroupBy] = useState<string>('category')
  const [timeChartGroupBy, setTimeChartGroupBy] = useState<string>('category')

  // Chart metric states (what values to aggregate - amount, count, or custom number field)
  const [categoryChartMetric, setCategoryChartMetric] = useState<string>('amount')
  const [timeChartMetric, setTimeChartMetric] = useState<string>('amount')

  // Date filter states
  const [datePeriod, setDatePeriod] = useState<'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'all'>('today')

  // Flag to track if initial preferences have been loaded from project settings
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)

  // Current date and time state
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  // Debug logger helper
  const addDebugMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const formattedMessage = `[${timestamp}] ${message}`
    setDebugMessages(prev => [...prev.slice(-9), formattedMessage]) // Keep last 10 messages
    console.log('[DEBUG]', formattedMessage)
  }

  // Sync debug panel state with localStorage changes (e.g., from config page)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'debugPanelEnabled') {
        setShowDebugPanel(e.newValue === 'true')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Network change detection - detect WiFi ↔ Cellular switching
  useEffect(() => {
    const handleOnline = async () => {
      addDebugMessage('Network online - resetting Supabase client and retrying...')
      await resetSupabaseClient(getConfig())
      fetchProject()
    }

    const handleOffline = () => {
      addDebugMessage('Network offline - waiting for connection...')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [id])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

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

  // Load chart preferences from project settings
  useEffect(() => {
    if (project?.settings) {
      if (project.settings.category_chart_group_by) {
        setCategoryChartGroupBy(project.settings.category_chart_group_by)
      }
      if (project.settings.category_chart_metric) {
        setCategoryChartMetric(project.settings.category_chart_metric)
      }
      if (project.settings.time_chart_group_by) {
        setTimeChartGroupBy(project.settings.time_chart_group_by)
      }
      if (project.settings.time_chart_metric) {
        setTimeChartMetric(project.settings.time_chart_metric)
      }
      if (project.settings.chart_mode) {
        setChartMode(project.settings.chart_mode)
      }
      // Mark preferences as loaded after setting all chart preferences
      setPreferencesLoaded(true)
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

  // Save all chart preferences when changed (consolidated debounced saver)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only save if preferences have been loaded and project exists
      if (project && preferencesLoaded) {
        saveConsolidatedChartPreferences()
      }
    }, 500)
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryChartGroupBy, categoryChartMetric, timeChartGroupBy, timeChartMetric, preferencesLoaded])

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

  const saveConsolidatedChartPreferences = async (newChartMode?: 'cumulative' | 'absolute') => {
    if (!project) return
    try {
      const supabase = getSupabaseClient()
      const updatedSettings = {
        ...project.settings,
        category_chart_group_by: categoryChartGroupBy,
        category_chart_metric: categoryChartMetric,
        time_chart_group_by: timeChartGroupBy,
        time_chart_metric: timeChartMetric,
        chart_mode: newChartMode ?? chartMode,
      }
      await (supabase
        .from('projects') as any)
        .update({ settings: updatedSettings })
        .eq('id', id)
      setProject({ ...project, settings: updatedSettings as any })
    } catch (err) {
      console.error('Error saving consolidated chart preferences:', err)
    }
  }

  const fetchProjectWithRetry = async (attemptNumber: number = 0): Promise<boolean> => {
    if (!id) return false

    // Check if user is authenticated before fetching
    if (!user?.id) {
      setError(t('projectDetail.notAuthenticated'))
      setLoading(false)
      return false
    }

    if (attemptNumber === 0) {
      setLoading(true)
      setError(null)
      setRetryCount(0)
    }

    const retryLabel = attemptNumber > 0 ? ` (retry ${attemptNumber}/${maxRetries})` : ''
    addDebugMessage(`Starting project fetch${retryLabel}...`)

    try {
      const supabase = getSupabaseClient()

      // NOTE: No getSession() call here — useAuth already validates the session
      // via onAuthStateChange before fetch functions are invoked. Calling
      // getSession() with a short timeout keeps the old abandoned promise alive
      // while resetSupabaseClient() creates a new GoTrueClient, triggering
      // "Multiple GoTrueClient instances" warnings.

      // Fetch project with generous timeout
      addDebugMessage(`Fetching project${retryLabel} (8s timeout)...`)
      const startTime = Date.now()

      const { data, error } = await Promise.race([
        supabase.from('projects').select('*').eq('id', id).single(),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 8000)
        )
      ])

      const elapsed = Date.now() - startTime
      addDebugMessage(`Project fetch completed${retryLabel} in ${elapsed}ms`)

      if (error) {
        console.error('Error fetching project:', error)
        throw error
      }

      if (!data) {
        console.error('Project not found')
        setError(t('projectDetail.projectNotFound'))
        setLoading(false)
        return false
      }

      // Enhanced safety check: Validate project data integrity
      const newHash = createDataHash(data)
      const isValidProject = data.id && data.name

      // Only trigger safety retry for truly invalid data (missing id or name)
      // Unchanged hash is NOT suspicious - it just means data hasn't changed
      const suspiciousResult = !isValidProject

      if (suspiciousResult && attemptNumber < maxRetries) {
        addDebugMessage(`⚠️ Suspicious: Project data looks invalid (${newHash.slice(0, 50)}...) (safety retry ${attemptNumber + 1}/${maxRetries})`)
        addDebugMessage('Triggering safety check retry...')

        // Resetting the client clears stale fetch connections. Safe now because
        // we no longer call getSession(), so no GoTrueClient is kept alive by
        // an abandoned promise during the reset.
        await resetSupabaseClient(getConfig())
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Retry with incremented attempt number
        const safetyResult = await fetchProjectWithRetry(attemptNumber + 1)

        if (safetyResult) {
          addDebugMessage('✓ Safety retry succeeded')
        } else {
          addDebugMessage(`⚠️ Safety retry ${attemptNumber + 1}/${maxRetries} failed`)
        }
      }

      // Always update hash for localStorage persistence
      if (typeof window !== 'undefined' && id) {
        localStorage.setItem(`project-hash-${id}`, newHash)
      }

      setProject(data)

      // Fetch user role from project_members
      try {
        const { data: memberData } = await Promise.race([
          supabase
            .from('project_members')
            .select('role')
            .eq('project_id', id)
            .eq('user_id', user?.id)
            .single(),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 8000)
          )
        ])
        if (memberData && 'role' in memberData) {
          setUserRole((memberData as any).role)
        }
      } catch (roleError) {
        console.error('Error fetching user role:', roleError)
        // Non-critical error, don't fail the whole page
      }

      setError(null)
      setRetryCount(0) // Reset retry count on success
      setLoading(false) // Ensure loading is false on success
      addDebugMessage(`✓ Success (retries: ${retryCount}/${maxRetries})`)
      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      const isTimeout = errorMsg === 'Request timeout'
      // Retry on both timeout errors and session/network errors
      const isRetryable = isTimeout || errorMsg.includes('Session') || errorMsg.includes('session') ||
        errorMsg.includes('Network') || errorMsg.includes('network') ||
        errorMsg.includes('fetch')

      addDebugMessage(`ERROR${retryLabel}: ${errorMsg}`)

      // Automatic retry with exponential backoff for retryable errors
      if (isRetryable && attemptNumber < maxRetries) {
        const backoffDelay = Math.pow(2, attemptNumber) * 1000 // 1s, 2s, 4s
        const nextAttempt = attemptNumber + 1
        addDebugMessage(`Retrying in ${backoffDelay / 1000}s... (attempt ${nextAttempt}/${maxRetries})`)
        setRetryCount(nextAttempt)

        // Resetting the client clears stale fetch connections. Safe now because
        // we no longer call getSession(), so no GoTrueClient is kept alive by
        // an abandoned promise during the reset.
        addDebugMessage('Resetting Supabase client...')
        await resetSupabaseClient(getConfig())
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
        return fetchProjectWithRetry(nextAttempt)
      }

      // Max retries reached or non-retryable error
      const errorMessage = isTimeout
        ? `Request failed after ${maxRetries + 1} attempts. Please try again.`
        : t('projectDetail.projectLoadError')

      console.error('Error fetching project:', error)
      setError(errorMessage)
      setLoading(false)
      return false
    }
  }

  const fetchProject = () => {
    fetchProjectWithRetry(0)
  }

  const fetchTransactionsWithRetry = async (attemptNumber: number = 0): Promise<boolean> => {
    if (!id) return false

    const retryLabel = attemptNumber > 0 ? ` (retry ${attemptNumber}/${maxRetries})` : ''
    addDebugMessage(`Starting transactions fetch${retryLabel}...`)

    try {
      const supabase = getSupabaseClient()

      // Fetch transactions with timeout
      const startTime = Date.now()
      const { data, error } = await Promise.race([
        supabase.from('transactions').select('*').eq('project_id', id).is('deleted_at', null).order('date', { ascending: false }).order('created_at', { ascending: false }),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 8000)
        )
      ])

      const elapsed = Date.now() - startTime
      addDebugMessage(`Transactions fetch completed${retryLabel} in ${elapsed}ms`)

      if (error) {
        console.error('Error fetching transactions:', error)
        throw error
      }

      const transactions = data || []

      // Enhanced safety check for suspicious 0 results
      const previousTransactionsHash = localStorage.getItem(`transactions-hash-${id}`)
      const currentHash = createDataHash(transactions)

      // Suspicious if: 0 transactions + we had data before + hash changed
      const suspiciousZeroResult = transactions.length === 0 &&
        previousTransactionsHash &&
        previousTransactionsHash !== 'empty' &&
        currentHash !== previousTransactionsHash &&
        attemptNumber < maxRetries

      if (suspiciousZeroResult) {
        addDebugMessage(`⚠️ Suspicious: Got 0 transactions when we had data before (safety retry ${attemptNumber + 1}/${maxRetries})`)
        addDebugMessage('Previous hash:' + previousTransactionsHash.slice(0, 50))
        addDebugMessage('Current hash:' + currentHash)

        // Resetting the client clears stale fetch connections.
        await resetSupabaseClient(getConfig())
        await new Promise(resolve => setTimeout(resolve, 1000))
        return fetchTransactionsWithRetry(attemptNumber + 1)
      }

      // Save to localStorage for next comparison
      localStorage.setItem(`transactions-hash-${id}`, currentHash)

      setTransactions(transactions)
      addDebugMessage(`✓ Transactions loaded: ${transactions.length} items`)
      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      const isTimeout = errorMsg === 'Request timeout'
      const isRetryable = isTimeout || errorMsg.includes('Network') || errorMsg.includes('network') ||
        errorMsg.includes('fetch') || errorMsg.includes('timeout')

      addDebugMessage(`ERROR fetching transactions${retryLabel}: ${errorMsg}`)

      // Automatic retry with exponential backoff for retryable errors
      if (isRetryable && attemptNumber < maxRetries) {
        const backoffDelay = Math.pow(2, attemptNumber) * 1000 // 1s, 2s, 4s
        const nextAttempt = attemptNumber + 1
        addDebugMessage(`Retrying transactions in ${backoffDelay / 1000}s... (attempt ${nextAttempt}/${maxRetries})`)

        // Resetting the client clears stale fetch connections.
        addDebugMessage('Resetting Supabase client...')
        await resetSupabaseClient(getConfig())
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
        return fetchTransactionsWithRetry(nextAttempt)
      }

      // Max retries reached or non-retryable error
      console.error('Error fetching transactions after retries:', error)
      return false
    }
  }

  const fetchTransactions = () => {
    fetchTransactionsWithRetry(0)
  }

  const fetchCategoriesWithRetry = async (attemptNumber: number = 0): Promise<boolean> => {
    if (!id) return false

    const retryLabel = attemptNumber > 0 ? ` (retry ${attemptNumber}/${maxRetries})` : ''
    addDebugMessage(`Starting categories fetch${retryLabel}...`)

    try {
      const supabase = getSupabaseClient()

      // Fetch categories with timeout
      const startTime = Date.now()
      const { data, error } = await Promise.race([
        supabase.from('categories').select('*').eq('project_id', id).order('order', { ascending: true }),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 8000)
        )
      ])

      const elapsed = Date.now() - startTime
      addDebugMessage(`Categories fetch completed${retryLabel} in ${elapsed}ms`)

      if (error) {
        console.error('Error fetching categories:', error)
        throw error
      }

      setCategories(data || [])
      addDebugMessage(`✓ Categories loaded: ${data?.length || 0} items`)
      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      const isTimeout = errorMsg === 'Request timeout'
      const isRetryable = isTimeout || errorMsg.includes('Network') || errorMsg.includes('network') ||
        errorMsg.includes('fetch') || errorMsg.includes('timeout')

      addDebugMessage(`ERROR fetching categories${retryLabel}: ${errorMsg}`)

      // Automatic retry with exponential backoff for retryable errors
      if (isRetryable && attemptNumber < maxRetries) {
        const backoffDelay = Math.pow(2, attemptNumber) * 1000 // 1s, 2s, 4s
        const nextAttempt = attemptNumber + 1
        addDebugMessage(`Retrying categories in ${backoffDelay / 1000}s... (attempt ${nextAttempt}/${maxRetries})`)

        // Resetting the client clears stale fetch connections.
        addDebugMessage('Resetting Supabase client...')
        await resetSupabaseClient(getConfig())
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
        return fetchCategoriesWithRetry(nextAttempt)
      }

      // Max retries reached or non-retryable error
      console.error('Error fetching categories after retries:', error)
      return false
    }
  }

  const fetchCategories = () => {
    fetchCategoriesWithRetry(0)
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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || t('projectDetail.uncategorized')
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.color || '#6B7280'
  }

  const handleGoToSettings = () => {
    navigate(`/transactions/${id}?settings=true`)
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
          return transactionDate >= sevenDaysAgo && transactionDate.toDateString() <= today.toDateString()
        })
      case 'last30days':
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return transactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= thirtyDaysAgo && transactionDate.toDateString() <= today.toDateString()
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

  // Helper function to get value from transaction based on metric
  const getTransactionValue = (transaction: Transaction, metric: string): number => {
    if (metric === 'amount') {
      return transaction.amount
    } else if (metric === 'count') {
      return 1
    } else {
      // Custom field - only support number types
      const customValue = transaction.custom_data?.[metric]
      return typeof customValue === 'number' ? customValue : 0
    }
  }

  // Get label for a metric value
  const getMetricLabel = (metric: string, value: number): string => {
    if (metric === 'amount') {
      const currency = project?.settings?.currency || 'USD'
      return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else if (metric === 'count') {
      return value.toString()
    } else {
      // Custom field
      const field = project?.settings?.custom_fields?.find(f => f.name === metric)
      if (field?.type === 'number') {
        return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      }
      return value.toString()
    }
  }

  // Get grouping key for a transaction based on groupBy selection
  const getGroupingKey = (transaction: Transaction, groupBy: string): string => {
    if (groupBy === 'category') {
      return getCategoryName(transaction.category_id)
    } else {
      // Custom field - get the value
      const customValue = transaction.custom_data?.[groupBy]
      // Only treat null/undefined as empty, preserve valid falsy values like 0 or false
      return (customValue ?? null) !== null ? String(customValue) : '(empty)'
    }
  }

  // Curated color palette for custom fields
  const customFieldColors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F97316', // orange-500
    '#6366F1', // indigo-500
    '#14B8A6', // teal-500
    '#A855F7', // purple-500
  ]

  // Get color for a grouping key
  const getGroupingColor = (key: string, groupBy: string): string => {
    if (groupBy === 'category') {
      // Find category by name to get its color
      const category = categories.find(c => c.name === key)
      return category?.color || '#6B7280'
    } else {
      // Generate consistent color based on key hash using curated palette
      let hash = 0
      for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash)
      }
      const colorIndex = Math.abs(hash) % customFieldColors.length
      return customFieldColors[colorIndex]
    }
  }

  // Get chart title based on metric and grouping
  const getChartTitle = (metric: string, groupBy: string): string => {
    const metricLabel = metric === 'amount' ? t('transactions.amount') : metric === 'count' ? t('projectDetail.chartCount') : metric
    const groupByOption = getGroupingOptions().find(opt => opt.value === groupBy)
    const groupByLabel = groupByOption?.label || groupBy
    return t('projectDetail.chartTitleFormat', { metric: metricLabel, groupBy: groupByLabel })
  }

  // Get available grouping options (category + text/select custom fields)
  const getGroupingOptions = () => {
    const standardOptions = [
      { value: 'category', label: t('transactions.category') },
    ]

    // Add custom text and select fields
    const customFields = project?.settings?.custom_fields || []
    const groupableFields = customFields
      .filter(f => f.type === 'text' || f.type === 'select')
      .map(f => ({ value: f.name, label: f.name }))

    return [...standardOptions, ...groupableFields]
  }

  const getChartData = (groupBy: string = 'category', metric: string = 'amount') => {
    // Use currency-filtered transactions for amount calculations
    const transactionsForCharts = metric === 'amount' ? transactionsForCalculation : filteredTransactions

    const groupTotals: Record<string, number> = {}
    const groupColors: Record<string, string> = {}

    transactionsForCharts.forEach((t) => {
      const groupingKey = getGroupingKey(t, groupBy)
      const value = getTransactionValue(t, metric)
      groupTotals[groupingKey] = (groupTotals[groupingKey] || 0) + value
      groupColors[groupingKey] = getGroupingColor(groupingKey, groupBy)
    })

    const labels = Object.keys(groupTotals).map(name => {
      return `${name}: ${getMetricLabel(metric, groupTotals[name])}`
    })

    return {
      labels: labels,
      datasets: [
        {
          data: Object.values(groupTotals),
          backgroundColor: Object.values(groupColors),
        },
      ],
    }
  }

  const getAreaChartData = (groupBy: string = 'category', metric: string = 'amount') => {
    // Use currency-filtered transactions for amount calculations
    const transactionsForCharts = metric === 'amount' ? transactionsForCalculation : filteredTransactions

    // Get all unique dates from transactions, sorted
    const dates = Array.from(new Set(transactionsForCharts.map(t => t.date))).sort()

    // Get all unique grouping keys
    const groupingKeys = Array.from(new Set(transactionsForCharts.map(t => getGroupingKey(t, groupBy)))).sort()

    // Build dataset for each grouping key
    const datasets = groupingKeys.map((groupingKey) => {
      const color = getGroupingColor(groupingKey, groupBy)

      // Calculate metric for each date based on chart mode
      let cumulative = 0
      const data = dates.map(date => {
        const dayTransactions = transactionsForCharts
          .filter(t => t.date === date && getGroupingKey(t, groupBy) === groupingKey)

        const dayTotal = dayTransactions.reduce((sum, t) => sum + getTransactionValue(t, metric), 0)

        if (chartMode === 'cumulative') {
          cumulative += dayTotal
          return cumulative
        } else {
          return dayTotal
        }
      })

      return {
        label: groupingKey,
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

  // Get available chart metrics (standard + custom number fields)
  const getChartMetricOptions = () => {
    const standardOptions = [
      { value: 'amount', label: 'Amount' },
      { value: 'count', label: 'Count' },
    ]

    // Add custom number fields
    const customFields = project?.settings?.custom_fields || []
    const numberFields = customFields
      .filter(f => f.type === 'number')
      .map(f => ({ value: f.name, label: f.name }))

    return [...standardOptions, ...numberFields]
  }

  // Filter transactions by project currency before calculating totals
  // Memoize to avoid recalculation on every render
  const { included: transactionsForCalculation, excluded: excludedTransactions } = useMemo(
    () => filterByCurrency(
      filteredTransactions,
      project?.settings?.currency || null
    ),
    [filteredTransactions, project?.settings?.currency]
  )
  const totalSpent = transactionsForCalculation.reduce((sum, t) => sum + t.amount, 0)

  // Calculate totals by other currencies
  const otherCurrencyTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    excludedTransactions.forEach(t => {
      const currency = t.currency_code || 'N/A'
      totals[currency] = (totals[currency] || 0) + t.amount
    })
    return totals
  }, [excludedTransactions])

  // Show error state with retry option
  if (error && !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-8">
        <div className="max-w-md mx-auto mt-16">
          <div className="card p-8 text-center">
            <div className="text-red-500 dark:text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('projectDetail.errorLoadingProject')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setError(null); fetchProject() }} className="btn btn-primary">
                {t('projectDetail.tryAgain')}
              </button>
              <Link to="/projects" className="btn btn-secondary">
                {t('projectDetail.backToProjectsList')}
              </Link>
            </div>

            {/* Debug Panel */}
            {showDebugPanel && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-700 z-50">
                <div className="max-w-md mx-auto">
                  <h3 className="text-white text-sm font-bold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Debug Log (Last 10 messages)
                  </h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {debugMessages.length === 0 ? (
                      <div className="text-xs font-mono text-gray-500">No debug messages yet</div>
                    ) : (
                      debugMessages.map((msg, i) => (
                        <div key={i} className="text-xs font-mono text-green-400">
                          {msg}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Only show "project not found" if we've finished loading and project is still null
  // Don't show during initial render to avoid flickering
  if (!project && !loading && error === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('projectDetail.projectNotFound')}</h1>
          <Link to="/projects" className="btn btn-secondary">
            {t('projectDetail.backToProjectsList')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-0 overflow-x-hidden">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <Link to="/projects" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-2 inline-flex items-center gap-1">
                ← {t('projectDetail.backToProjectsList')}
              </Link>
              {!project ? (
                // Skeleton loader while project is loading
                <div className="mt-3 space-y-3">
                  <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-1/2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-1/4 mt-2"></div>
                </div>
              ) : isEditing ? (
                <form onSubmit={handleEditProject} className="flex flex-col gap-3 mt-1 w-full max-w-md">
                  <input type="text" className="input" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} required placeholder={t('projectDetail.projectName')} />
                  <textarea className="input" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} rows={2} placeholder={t('projectDetail.projectDescription')} />
                  <div className="flex gap-2 items-center">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{t('projectDetail.currencyLabel')}</label>
                    <input type="text" className="input w-24" value={editFormData.currency} onChange={e => setEditFormData({ ...editFormData, currency: e.target.value })} placeholder="USD, EUR, etc." maxLength={5} />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button type="submit" className="btn btn-primary px-4 py-1">{t('projectDetail.saveChanges')}</button>
                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary px-4 py-1">{t('projectDetail.cancel')}</button>
                  </div>
                </form>
              ) : (
                <div className="group flex flex-col gap-1 items-start mt-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate flex-shrink">{project.name}</h1>
                    <button onClick={() => {
                      setIsEditing(true)
                      setEditFormData({ name: project.name, description: project.description || '', currency: project.settings?.currency || 'USD' })
                    }} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">{t('projectDetail.edit')}</button>
                  </div>
                  {project.description && <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl break-words">{project.description}</p>}

                  {/* Date Period Selector */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 min-w-0">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('projectDetail.period')}</label>
                    <select
                      value={datePeriod}
                      onChange={(e) => setDatePeriod(e.target.value as any)}
                      className="input py-1 px-2 text-xs sm:py-1 sm:px-3 w-full sm:w-auto sm:min-w-0 flex-1"
                    >
                      <option value="today">{t('projectDetail.today')}</option>
                      <option value="yesterday">{t('projectDetail.yesterday')}</option>
                      <option value="last7days">{t('projectDetail.last7')}</option>
                      <option value="last30days">{t('projectDetail.last30')}</option>
                      <option value="thisMonth">{t('projectDetail.thisMonth')}</option>
                      <option value="lastMonth">{t('projectDetail.lastMonth')}</option>
                      <option value="thisYear">{t('projectDetail.thisYear')}</option>
                      <option value="all">{t('projectDetail.allTime')}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowCashCounterModal(true)} className="btn btn-secondary text-sm whitespace-nowrap flex" title="Cash Counter">
                <span>🧮</span>
                <span className="hidden sm:inline ml-1">{t('cashCounter.title')}</span>
              </button>
              <button onClick={() => setShowAddTransactionModal(true)} className="btn btn-primary text-sm whitespace-nowrap" title="Add Transaction">
                + {t('projectDetail.addTransaction')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Summary Cards */}
          <div className="lg:col-span-3 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {/* Date & Time Widget */}
            <div className="card border-t-4 border-t-blue-500 overflow-hidden min-w-0">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                <span className="mr-1">☀️</span> {t('projectDetail.dateTime')}
              </div>
              <div className="flex flex-col">
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {currentDateTime.toLocaleDateString(i18n.language || undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="text-xl font-medium text-slate-900 dark:text-slate-100">
                  {currentDateTime.toLocaleTimeString(i18n.language || undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>
            {/* Total Amount Widget */}
            <div className="card border-t-4 border-t-primary-500 overflow-hidden min-w-0">
              <div className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">{t('projectDetail.totalAmount')}</div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 break-words overflow-hidden">
                {loading ? '...' : (project?.settings?.currency || 'USD')} {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {Object.keys(otherCurrencyTotals).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Other currencies</div>
                  <div className="space-y-1">
                    {Object.entries(otherCurrencyTotals).sort(([a], [b]) => a.localeCompare(b)).map(([currency, amount]) => (
                      <div key={currency} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-400">{currency}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Transactions Widget */}
            <Link to={`/transactions/${id}`} className="card border-t-4 border-t-teal-500 overflow-hidden min-w-0 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">{t('transactions.transactions')}</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{filteredTransactions.length}</div>
                </div>
                <span className="text-lg font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700">
                  →
                </span>
              </div>
            </Link>
          </div>

          {/* Charts and Recent Transactions */}
          {!project || loading ? (
            // Loading state for charts and transactions
            <div className="lg:col-span-3 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 card border-t-4 border-t-gray-300 dark:border-slate-600 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                  <div className="flex justify-center p-8">
                    <div className="w-64 h-64 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1 card border-t-4 border-t-gray-300 dark:border-slate-600 p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <>
              {/* Pie Chart and Recent Transactions in same row */}
              <div className="lg:col-span-2 card border-t-4 border-t-primary-500 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6 min-w-0">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 min-w-0">
                    <span className="w-2 h-6 bg-primary-500 rounded-full flex-shrink-0"></span>
                    <span className="truncate">{getChartTitle(categoryChartMetric, categoryChartGroupBy)}</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <select
                      value={categoryChartGroupBy}
                      onChange={(e) => setCategoryChartGroupBy(e.target.value)}
                      className="input py-1 px-2 text-xs sm:py-1 sm:px-3 w-full sm:w-auto sm:min-w-0"
                      title="Group by"
                    >
                      {getGroupingOptions().map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <select
                      value={categoryChartMetric}
                      onChange={(e) => setCategoryChartMetric(e.target.value)}
                      className="input py-1 px-2 text-xs sm:py-1 sm:px-3 w-full sm:w-auto sm:min-w-0"
                      title="Metric"
                    >
                      {getChartMetricOptions().map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-center p-4">
                  <div className="w-full max-w-xs" style={{ minHeight: '280px' }}>
                    <Pie data={getChartData(categoryChartGroupBy, categoryChartMetric)} options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                              size: 11
                            }
                          }
                        }
                      }
                    }} />
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div id="recent-transactions" className="lg:col-span-1 card border-t-4 border-t-teal-500 flex flex-col overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                <Link to={`/transactions/${id}`} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-6 bg-teal-500 rounded-full flex-shrink-0"></span>
                    {t('projectDetail.recent')}
                  </h2>
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 whitespace-nowrap">
                    {t('projectDetail.viewAll')} →
                  </span>
                </Link>
                <div className="space-y-3 flex-1 overflow-auto">
                  {filteredTransactions.slice(0, 6).map((transaction) => (
                    <Link key={transaction.id} to={`/transactions/${id}`} className="flex justify-between items-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 group">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex-shrink-0" style={{ color: getCategoryColor(transaction.category_id) }}>
                          {getCategoryName(transaction.category_id).charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{getCategoryName(transaction.category_id)}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider truncate">{transaction.date}</div>
                        </div>
                      </div>
                      <div className="text-right min-w-0">
                        <div className={`font-extrabold text-sm break-all ${transaction.amount < 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                          {transaction.amount < 0 ? '-' : ''}{transaction.currency_code || project.settings?.currency || 'USD'} {Math.abs(transaction.amount).toFixed(2)}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                      {t('projectDetail.noTransactionsForPeriod')}
                    </div>
                  )}
                </div>
              </div>

              {datePeriod !== 'today' && (
                <div className="lg:col-span-3 card border-t-4 border-t-primary-500 overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 min-w-0">
                    <h2 className="text-lg font-semibold truncate pr-2 min-w-0">
                      {t('projectDetail.chartOverTimeTitle', { title: getChartTitle(timeChartMetric, timeChartGroupBy) })}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <select
                        value={timeChartGroupBy}
                        onChange={(e) => setTimeChartGroupBy(e.target.value)}
                        className="input py-1 px-2 text-xs sm:py-1 sm:px-3 w-full sm:w-auto sm:min-w-0"
                        title="Group by"
                      >
                        {getGroupingOptions().map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <select
                        value={timeChartMetric}
                        onChange={(e) => setTimeChartMetric(e.target.value)}
                        className="input py-1 px-2 text-xs sm:py-1 sm:px-3 w-full sm:w-auto sm:min-w-0"
                        title="Metric"
                      >
                        {getChartMetricOptions().map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={async () => {
                          setChartMode('cumulative')
                          await saveConsolidatedChartPreferences('cumulative')
                        }}
                        className={`px-1.5 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${chartMode === 'cumulative'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                          }`}
                      >
                        <span className="hidden sm:inline">{t('projectDetail.cumulative')}</span>
                        <span className="inline sm:hidden">Cumul.</span>
                      </button>
                      <button
                        onClick={async () => {
                          setChartMode('absolute')
                          await saveConsolidatedChartPreferences('absolute')
                        }}
                        className={`px-1.5 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${chartMode === 'absolute'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                          }`}
                      >
                        <span className="hidden sm:inline">{t('projectDetail.absolute')}</span>
                        <span className="inline sm:hidden">Abs.</span>
                      </button>
                    </div>
                  </div>
                  <div className="h-64">
                    <Line
                      data={getAreaChartData(timeChartGroupBy, timeChartMetric)}
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
                              text: t('projectDetail.chartDate'),
                            },
                          },
                          y: {
                            stacked: true,
                            title: {
                              display: true,
                              text: t('projectDetail.chartYAxisTitle', {
                                mode: chartMode === 'cumulative' ? t('projectDetail.cumulative') : '',
                                metric: timeChartMetric === 'amount' ? t('transactions.amount') : timeChartMetric === 'count' ? t('projectDetail.chartCount') : timeChartMetric
                              }).trim(),
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
              )}
            </>
          ) : null}
        </div>
      </main>

      {/* Quick Add Transaction Modal */}
      {project && (
        <TransactionModal
          isOpen={showAddTransactionModal}
          onClose={() => setShowAddTransactionModal(false)}
          onSuccess={fetchTransactions}
          project={project}
          categories={categories}
          onGoToSettings={handleGoToSettings}
          allTransactions={transactions}
          userRole={userRole as 'owner' | 'member' | 'viewer' | null}
        />
      )}

      {/* Cash Counter Modal */}
      {project && (
        <CashCounterModal
          isOpen={showCashCounterModal}
          onClose={() => setShowCashCounterModal(false)}
          project={project}
          totalTransactionsAmount={transactionsForCalculation.reduce((sum, t) => sum + t.amount, 0)}
        />
      )}
    </div>
  )
}
