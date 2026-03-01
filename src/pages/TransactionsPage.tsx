import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabase'
import { exportToCSV } from '../utils/csvExport'
import type { Project, Transaction, Category } from '../types'
import TransactionModal from '../components/TransactionModal'

export default function TransactionsPage() {
  const { t } = useTranslation()
  const { } = useAuth()
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#' + Math.floor(Math.random() * 16777215).toString(16).padEnd(6, '0'))
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [editingCategoryColor, setEditingCategoryColor] = useState('')
  const [isUpdatingCategory, setIsUpdatingCategory] = useState<string | null>(null)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'select'>('text')
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([]) // For select type
  const [editingFieldOriginalName, setEditingFieldOriginalName] = useState<string | null>(null)
  const [editingFieldName, setEditingFieldName] = useState('')
  const [editingFieldOptions, setEditingFieldOptions] = useState<string[]>([]) // For editing select fields
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFieldName, setImportFieldName] = useState('')
  const [importValues, setImportValues] = useState('')
  const [importedFieldValues, setImportedFieldValues] = useState<Record<string, string[]>>({})
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [currentEditIndex, setCurrentEditIndex] = useState(0)

  // Filter, search, sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortColumn, setSortColumn] = useState<'date' | 'category' | 'amount'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [datePeriod, setDatePeriod] = useState<'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'all' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  useEffect(() => {
    if (projectId) {
      fetchProject()
      fetchTransactions()
      fetchCategories()
    }

    // Check for settings parameter in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('settings') === 'true') {
      setShowSettings(true)
      setTimeout(() => {
        document.getElementById('manage-custom-fields')?.scrollIntoView({ behavior: 'smooth' })
      }, 500)
    }
  }, [projectId])

  const fetchProject = async () => {
    if (!projectId) return
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
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
    if (!projectId) return
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchCategories = async () => {
    if (!projectId) return
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', projectId)
        .order('order', { ascending: true })

      if (error) throw error
      setCategories(data || [])

      // Create default category if none exist
      if (!data || data.length === 0) {
        await createDefaultCategory()
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const createDefaultCategory = async () => {
    if (!projectId) return
    try {
      const supabase = getSupabaseClient()
      // Type assertion needed: Supabase insert types require generated types from Supabase CLI
      const { data } = await supabase
        .from('categories')
        .insert({
          project_id: projectId,
          name: 'General',
          color: '#6B7280',
          order: 0,
        } as any)
        .select('id, name, color, order')
        .single()

      if (data) {
        const category = data as any
        setCategories([category])
      }
    } catch (error) {
      console.error('Error creating default category:', error)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransactionId(transaction.id)
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (transactionId: string) => {
    if (!confirm(t('transactions.confirmDelete'))) {
      return
    }

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)

      if (error) throw error
      fetchTransactions()
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const handleToggleSelect = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedTransactions(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTransactions.size === 0) return

    if (!confirm(t('transactions.confirmBulkDelete', { count: selectedTransactions.size }))) {
      return
    }

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', Array.from(selectedTransactions))

      if (error) throw error
      setSelectedTransactions(new Set())
      setIsMultiSelectMode(false)
      fetchTransactions()
    } catch (error) {
      console.error('Error deleting transactions:', error)
    }
  }

  // Fix: Clear selection when canceling multi-select mode
  const handleCancelMultiSelect = () => {
    setSelectedTransactions(new Set())
    setIsMultiSelectMode(false)
  }

  // Multi-edit navigation
  const handleMultiEdit = () => {
    if (selectedTransactions.size === 0) return
    setCurrentEditIndex(0)
    const firstId = Array.from(selectedTransactions)[0]
    const transaction = transactions.find(t => t.id === firstId)
    if (transaction) {
      handleEdit(transaction)
    }
  }

  const handleNavigateEdit = (direction: 'prev' | 'next') => {
    const selectedIds = Array.from(selectedTransactions)
    if (direction === 'prev' && currentEditIndex > 0) {
      const newIndex = currentEditIndex - 1
      setCurrentEditIndex(newIndex)
      const transaction = transactions.find(t => t.id === selectedIds[newIndex])
      if (transaction) {
        handleEdit(transaction)
      }
    } else if (direction === 'next' && currentEditIndex < selectedIds.length - 1) {
      const newIndex = currentEditIndex + 1
      setCurrentEditIndex(newIndex)
      const transaction = transactions.find(t => t.id === selectedIds[newIndex])
      if (transaction) {
        handleEdit(transaction)
      }
    }
  }

  // Get filtered and sorted transactions
  const getFilteredAndSortedTransactions = () => {
    let filtered = [...transactions]

    // Apply date period filter
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (datePeriod) {
      case 'today':
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate.toDateString() === today.toDateString()
        })
        break
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate.toDateString() === yesterday.toDateString()
        })
        break
      case 'last7days':
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= sevenDaysAgo && transactionDate <= today
        })
        break
      case 'last30days':
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= thirtyDaysAgo && transactionDate <= today
        })
        break
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= startOfMonth && transactionDate <= now
        })
        break
      case 'lastMonth':
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth
        })
        break
      case 'thisYear':
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const endOfYear = new Date(now.getFullYear(), 11, 31)
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= startOfYear && transactionDate <= endOfYear
        })
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate)
          const end = new Date(customEndDate)
          filtered = filtered.filter(t => {
            const transactionDate = new Date(t.date)
            return transactionDate >= start && transactionDate <= end
          })
        }
        break
      case 'all':
      default:
        // Show all transactions
        break
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.custom_data && Object.values(t.custom_data).some(v =>
          String(v).toLowerCase().includes(query)
        )
      )
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category_id === categoryFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortColumn) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'category':
          const catA = getCategoryName(a.category_id)
          const catB = getCategoryName(b.category_id)
          comparison = catA.localeCompare(catB)
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName || !projectId) return
    try {
      const supabase = getSupabaseClient()
      const order = categories.length // New category goes at the end
      const { data, error } = await (supabase
        .from('categories') as any)
        .insert([{ project_id: projectId, name: newCategoryName, color: newCategoryColor, order }])
        .select()
        .single()
      if (error) throw error
      setCategories([...categories, data as Category])
      setNewCategoryName('')
      setNewCategoryColor('#' + Math.floor(Math.random() * 16777215).toString(16).padEnd(6, '0'))
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFieldName || !project) return

    const currentFields = project.settings?.custom_fields || []
    if (currentFields.some(f => f.name.toLowerCase() === newFieldName.toLowerCase())) {
      alert('A field with this name already exists')
      return
    }

    const filteredOptions = newFieldOptions.map(o => o.trim()).filter(Boolean)
    const newField: any = { name: newFieldName, type: newFieldType }

    // For select type, add options
    if (newFieldType === 'select') {
      newField.options = filteredOptions.length > 0 ? filteredOptions : ['Option 1', 'Option 2', 'Option 3']
    }

    const updatedSettings = {
      ...project.settings,
      currency: project.settings?.currency || 'USD',
      date_format: project.settings?.date_format || 'YYYY-MM-DD',
      notifications_enabled: project.settings?.notifications_enabled ?? true,
      custom_fields: [...currentFields, newField]
    }
    await updateProjectSettings(updatedSettings)
    setNewFieldName('')
    setNewFieldOptions([])
    setNewFieldType('text')
  }

  const handleDeleteField = async (fieldName: string) => {
    if (!project) return
    const currentFields = project.settings?.custom_fields || []
    const updatedSettings = {
      ...project.settings,
      custom_fields: currentFields.filter(f => f.name !== fieldName)
    }
    await updateProjectSettings(updatedSettings)
  }

  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    if (!project) return
    const currentFields = [...(project.settings?.custom_fields || [])]
    if (direction === 'up' && index > 0) {
      const temp = currentFields[index];
      currentFields[index] = currentFields[index - 1];
      currentFields[index - 1] = temp;
    } else if (direction === 'down' && index < currentFields.length - 1) {
      const temp = currentFields[index];
      currentFields[index] = currentFields[index + 1];
      currentFields[index + 1] = temp;
    } else {
      return
    }
    const updatedSettings = {
      ...project.settings,
      custom_fields: currentFields
    }
    await updateProjectSettings(updatedSettings)
  }

  const updateProjectSettings = async (updatedSettings: any) => {
    try {
      const supabase = getSupabaseClient()
      const { error } = await (supabase
        .from('projects') as any)
        .update({ settings: updatedSettings })
        .eq('id', projectId as string)

      if (error) throw error
      setProject({ ...project!, settings: updatedSettings as any })
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm(t('transactions.confirmDeleteCategory'))) return;
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from('categories').delete().eq('id', categoryId)
      if (error) throw error
      setCategories(categories.filter(c => c.id !== categoryId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateCategory = async (categoryId: string, updates: { name?: string, color?: string }) => {
    if (updates.name !== undefined && !updates.name.trim()) return
    if (!projectId) return

    // Update local state instantly for responsiveness (optimistic update)
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updates } : c))

    try {
      console.log('Sending category update to DB:', { categoryId, updates, projectId });
      setIsUpdatingCategory(categoryId)
      const supabase = getSupabaseClient()
      const { data, error } = await (supabase
        .from('categories') as any)
        .update(updates)
        .eq('id', categoryId)
        .eq('project_id', projectId)
        .select()

      if (error) {
        console.error('Supabase error updating category:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('Update failed: No rows affected. Possible RLS denial.');
        throw new Error('You do not have permission to update categories.');
      }

      console.log('Category update successful. Response data:', data);

      if (updates.name !== undefined) {
        setEditingCategoryId(null)
      }
    } catch (err) {
      console.error('Error updating category:', err)
      // Revert local state on error by re-fetching
      fetchCategories()
      alert('Failed to save category changes. Please check your connection.')
    } finally {
      setIsUpdatingCategory(null)
    }
  }

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    if (index < 0 || index >= categories.length) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === categories.length - 1) return
    if (!projectId) return

    const currentCategory = categories[index]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const targetCategory = categories[targetIndex]

    // Ensure they have different orders to swap. If same, just assign new sequential orders.
    const currentOrder = currentCategory.order
    const targetOrder = targetCategory.order

    // Optimistically update local state for instant feedback
    setCategories(prev => {
      const next = [...prev]
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next
    })

    try {
      const supabase = getSupabaseClient()
      console.log('Swapping category orders:', {
        c1: { id: currentCategory.id, old: currentOrder, new: targetOrder },
        c2: { id: targetCategory.id, old: targetOrder, new: currentOrder }
      });

      // If orders are the same, we need to re-verify all orders
      if (currentOrder === targetOrder) {
        console.warn('Categories have same order value, performing fallback re-order');
        // Fallback: update target with current + 1 or -1
        const newOrder = direction === 'up' ? Math.max(0, targetOrder - 1) : targetOrder + 1
        const { error } = await (supabase
          .from('categories') as any)
          .update({ order: newOrder })
          .eq('id', currentCategory.id)
          .eq('project_id', projectId)
        if (error) throw error
      } else {
        // Normal swap
        const { data: d1, error: error1 } = await (supabase
          .from('categories') as any)
          .update({ order: targetOrder })
          .eq('id', currentCategory.id)
          .eq('project_id', projectId)
          .select()

        if (error1) throw error1
        if (!d1 || d1.length === 0) throw new Error('Failed to update category order (RLS?)')

        const { data: d2, error: error2 } = await (supabase
          .from('categories') as any)
          .update({ order: currentOrder })
          .eq('id', targetCategory.id)
          .eq('project_id', projectId)
          .select()

        if (error2) throw error2
        if (!d2 || d2.length === 0) throw new Error('Failed to update category order (RLS?)')
      }
      console.log('Category swap successful');
    } catch (err) {
      console.error('Error moving category:', err)
      alert(err instanceof Error ? err.message : 'Failed to save category order. Reverting...')
      fetchCategories() // Revert to server state
    }
  }

  const handleRenameField = async (oldName: string, newName: string) => {
    if (!project || !newName.trim()) return
    const currentFields = project.settings?.custom_fields || []

    // Check if name changed and if new name already exists elsewhere
    if (oldName !== newName && currentFields.some(f => f.name === newName)) {
      alert('A field with this name already exists')
      return
    }

    const filteredOptions = editingFieldOptions.map(o => o.trim()).filter(Boolean)
    const updatedSettings = {
      ...project.settings,
      custom_fields: currentFields.map(f =>
        f.name === oldName
          ? { ...f, name: newName, options: filteredOptions.length > 0 ? filteredOptions : f.options }
          : f
      )
    }

    try {
      const supabase = getSupabaseClient()
      const { error: projectError } = await (supabase.from('projects') as any)
        .update({ settings: updatedSettings })
        .eq('id', projectId as string)
      if (projectError) throw projectError

      // Only sync transaction data if the field NAME changed
      if (oldName !== newName) {
        const { data: txs } = await (supabase.from('transactions') as any)
          .select('id, custom_data')
          .eq('project_id', projectId as string)
        if (txs) {
          for (const tx of txs as any[]) {
            if (tx.custom_data && tx.custom_data[oldName] !== undefined) {
              const newData = { ...tx.custom_data, [newName]: tx.custom_data[oldName] }
              delete newData[oldName]
              await (supabase.from('transactions') as any).update({ custom_data: newData }).eq('id', tx.id)
            }
          }
        }
      }

      setProject({ ...project, settings: updatedSettings as any })
      setEditingFieldOriginalName(null)
      fetchTransactions()
    } catch (err) {
      console.error(err)
    }
  }

  const handleImportFieldValues = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFieldName || !importValues.trim() || !project) return

    try {
      // Parse the import values (one per line)
      const values = importValues
        .split('\n')
        .map(v => v.trim())
        .filter(v => v.length > 0)

      // Store in project settings for later use
      const currentFieldValues = project.settings?.custom_field_values || {}
      const updatedSettings = {
        ...project.settings,
        custom_field_values: {
          ...currentFieldValues,
          [importFieldName]: values
        }
      }

      await updateProjectSettings(updatedSettings)
      setImportedFieldValues({
        ...importedFieldValues,
        [importFieldName]: values
      })
      setShowImportModal(false)
      setImportFieldName('')
      setImportValues('')
      alert(`Successfully imported ${values.length} values for field "${importFieldName}"`)
    } catch (err) {
      console.error(err)
      alert('Failed to import values')
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || 'Uncategorized'
  }

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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('transactions.projectNotFound')}</h1>
          <Link to="/projects" className="btn btn-secondary">
            {t('transactions.backToProjects')}
          </Link>
        </div>
      </div>
    )
  }

  const handleGoToSettings = () => {
    setShowAddForm(false)
    setShowSettings(true)
    setTimeout(() => {
      document.getElementById('manage-custom-fields')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <header className="bg-white border-b border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="min-w-0">
              <Link to={`/projects/${projectId}`} className="text-sm font-medium text-primary-600 hover:text-primary-700 mb-2 inline-flex items-center gap-1">
                {t('transactions.backToDashboard')}
              </Link>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">{t('transactions.transactions')}</h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowSettings(!showSettings)} className="btn btn-secondary text-sm whitespace-nowrap">
                {showSettings ? t('transactions.closeSettings') : `⚙️ ${t('common.settings')}`}
              </button>
              <button onClick={() => {
                setEditingTransactionId(null)
                setShowAddForm(true)
              }} className="btn btn-primary text-sm whitespace-nowrap">
                {t('transactions.addTransaction')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSettings && (
          <div className="grid md:grid-cols-2 gap-6 mb-8 mt-2">
            <div className="card border-t-4 border-t-primary-500">
              <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                <span className="p-1.5 bg-primary-100 text-primary-600 rounded-lg">🏷️</span>
                {t('transactions.manageCategories')}
              </h2>
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none p-0"
                  title="Choose new category color"
                />
                <input type="text" className="input flex-1" placeholder="New Category Name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} required />
                <button type="submit" className="btn btn-primary whitespace-nowrap">Add</button>
              </form>
              <ul className="space-y-3">
                {categories.map((c, index) => (
                  <li key={c.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-primary-100 transition-colors">
                    {editingCategoryId === c.id ? (
                      <div className="flex-1 flex gap-2 items-center">
                        <input
                          type="color"
                          value={editingCategoryColor}
                          onChange={(e) => setEditingCategoryColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0"
                          title="Choose category color"
                        />
                        <input
                          type="text"
                          className="input py-1 px-2 text-sm flex-1"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateCategory(c.id, { name: editingCategoryName, color: editingCategoryColor })
                            if (e.key === 'Escape') setEditingCategoryId(null)
                          }}
                        />
                        <button onClick={() => handleUpdateCategory(c.id, { name: editingCategoryName, color: editingCategoryColor })} className="text-primary-600 hover:text-primary-800 font-bold px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors">Save</button>
                        <button onClick={() => setEditingCategoryId(null)} className="text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 group relative">
                          <input
                            type="color"
                            value={c.color}
                            onInput={(e) => {
                              const color = (e.target as HTMLInputElement).value;
                              setCategories(prev => prev.map(item => item.id === c.id ? { ...item, color } : item));
                            }}
                            onChange={(e) => {
                              const val = (e.target as HTMLInputElement).value;
                              console.log('Category color change triggered:', val);
                              handleUpdateCategory(c.id, { color: val });
                            }}
                            onBlur={(e) => {
                              const val = (e.target as HTMLInputElement).value;
                              console.log('Category color blur triggered:', val);
                              handleUpdateCategory(c.id, { color: val });
                            }}
                            className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-2 border-white shadow-sm hover:scale-110 transition-transform p-0"
                            title="Quick change color"
                          />
                          <span className="font-semibold text-slate-700">{c.name}</span>
                          {isUpdatingCategory === c.id && (
                            <span className="absolute -left-1 -top-1 w-2 h-2 bg-primary-500 rounded-full animate-ping"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex bg-white rounded-lg border border-slate-100 p-0.5">
                            <button disabled={index === 0} onClick={() => handleMoveCategory(index, 'up')} className="p-1 text-slate-400 hover:text-primary-600 disabled:opacity-20 transition-colors" title="Move Up">↑</button>
                            <button disabled={index === categories.length - 1} onClick={() => handleMoveCategory(index, 'down')} className="p-1 text-slate-400 hover:text-primary-600 disabled:opacity-20 transition-colors" title="Move Down">↓</button>
                          </div>
                          <button onClick={() => {
                            setEditingCategoryId(c.id)
                            setEditingCategoryName(c.name)
                            setEditingCategoryColor(c.color)
                          }} className="btn border border-slate-200 bg-white text-slate-600 hover:text-primary-600 hover:border-primary-200 py-1 px-3 text-[10px] uppercase font-bold rounded-lg transition-all">Rename</button>
                          <button onClick={() => handleDeleteCategory(c.id)} className="btn border border-red-100 bg-white text-red-500 hover:bg-red-50 py-1 px-3 text-[10px] uppercase font-bold rounded-lg transition-all">Delete</button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card border-t-4 border-t-teal-500" id="manage-custom-fields">
              <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                <span className="p-1.5 bg-teal-100 text-teal-600 rounded-lg">📋</span>
                {t('transactions.customFields')}
              </h2>
              <form onSubmit={handleAddField} className="flex flex-col gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex gap-2">
                  <input type="text" className="input flex-1" placeholder="Field Name (e.g., Note, Tag)" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} required />
                  <select className="input w-32" value={newFieldType} onChange={e => setNewFieldType(e.target.value as any)}>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Dropdown</option>
                  </select>
                </div>
                {newFieldType === 'select' && (
                  <div className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                    <label className="text-xs font-bold text-slate-500 uppercase">Dropdown Options (one per line)</label>
                    <textarea
                      className="input min-h-20 font-mono text-sm border-transparent focus:border-transparent focus:ring-0 p-0"
                      placeholder="Enter each option on a new line..."
                      value={newFieldOptions.join('\n')}
                      onChange={(e) => setNewFieldOptions(e.target.value.split('\n'))}
                    />
                  </div>
                )}
                <button type="submit" className="btn btn-primary w-full">Add Field</button>
              </form>
              <div className="space-y-3">
                {project?.settings?.custom_fields?.map((f, index) => (
                  <div key={f.name} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                    {editingFieldOriginalName === f.name ? (
                      <div className="flex-1 flex gap-2 flex-col">
                        <input
                          type="text"
                          className="input py-1 px-2 text-sm"
                          value={editingFieldName}
                          onChange={(e) => setEditingFieldName(e.target.value)}
                          autoFocus
                        />
                        {f.type === 'select' && (
                          <textarea
                            className="input min-h-20 font-mono text-sm"
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            value={editingFieldOptions.join('\n')}
                            onChange={(e) => setEditingFieldOptions(e.target.value.split('\n'))}
                          />
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => handleRenameField(f.name, editingFieldName)} className="text-blue-600 hover:text-blue-800 font-semibold text-xs">Save</button>
                          <button onClick={() => {
                            setEditingFieldOriginalName(null)
                            setEditingFieldOptions([])
                          }} className="text-gray-500 hover:text-gray-700 text-xs">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div>
                            <span className="font-semibold">{f.name}</span> <span className="text-gray-500 text-xs">({f.type})</span>
                            {f.type === 'select' && f.options && (
                              <span className="text-gray-400 text-xs ml-2">[{f.options.length} options]</span>
                            )}
                            {f.type === 'text' && project?.settings?.custom_field_values?.[f.name] && (
                              <span className="text-green-600 text-xs ml-2">[{project.settings.custom_field_values[f.name].length} imported values]</span>
                            )}
                          </div>
                          {f.type === 'text' && project?.settings?.custom_field_values?.[f.name] && (
                            <div className="mt-1 text-xs text-gray-600 max-w-md">
                              <span className="font-medium">Values: </span>
                              <span className="text-gray-500">
                                {project.settings.custom_field_values[f.name].slice(0, 5).join(', ')}
                                {project.settings.custom_field_values[f.name].length > 5 && ` ...and ${project.settings.custom_field_values[f.name].length - 5} more`}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <button disabled={index === 0} onClick={() => handleMoveField(index, 'up')} className="text-gray-500 hover:text-blue-600 disabled:opacity-30">↑</button>
                          <button disabled={index === (project.settings?.custom_fields?.length || 0) - 1} onClick={() => handleMoveField(index, 'down')} className="text-gray-500 hover:text-blue-600 disabled:opacity-30">↓</button>
                          {f.type === 'text' && (
                            <button onClick={() => {
                              setImportFieldName(f.name)
                              setShowImportModal(true)
                              // Load existing values from both stored imports and transactions
                              const storedValues = project?.settings?.custom_field_values?.[f.name] || []
                              const transactionValues = transactions
                                .map(t => t.custom_data?.[f.name])
                                .filter(Boolean)
                              const allValues = Array.from(new Set([...storedValues, ...transactionValues]))
                              setImportValues(allValues.join('\n'))
                            }} className="text-green-600 hover:text-green-700">Import</button>
                          )}
                          {f.type === 'select' && (
                            <button onClick={() => {
                              setEditingFieldOriginalName(f.name)
                              setEditingFieldName(f.name)
                              setEditingFieldOptions(f.options || [])
                            }} className="text-purple-600 hover:text-purple-700">Edit Options</button>
                          )}
                          <button onClick={() => {
                            setEditingFieldOriginalName(f.name)
                            setEditingFieldName(f.name)
                            setEditingFieldOptions(f.options || [])
                          }} className="text-blue-500 hover:text-blue-700">Rename</button>
                          <button onClick={() => handleDeleteField(f.name)} className="text-red-500 hover:text-red-700 ml-2">Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {(!project?.settings?.custom_fields || project.settings.custom_fields.length === 0) && (
                  <p className="text-sm text-gray-500">No custom fields defined yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Import Values for "{importFieldName}"</h2>
              <form onSubmit={handleImportFieldValues} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Values (one per line)
                  </label>
                  <textarea
                    className="input min-h-40 font-mono text-sm"
                    placeholder="Value 1&#10;Value 2&#10;Value 3&#10;..."
                    value={importValues}
                    onChange={(e) => setImportValues(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter one value per line. These will be available for autocomplete.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary w-full">
                    Import Values
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false)
                      setImportFieldName('')
                      setImportValues('')
                    }}
                    className="btn btn-secondary w-full"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {project && (
          <TransactionModal
            isOpen={showAddForm}
            onClose={() => {
              setShowAddForm(false)
              setEditingTransactionId(null)
            }}
            onSuccess={fetchTransactions}
            project={project}
            categories={categories}
            transaction={editingTransactionId ? transactions.find(t => t.id === editingTransactionId) : null}
            onGoToSettings={handleGoToSettings}
            allTransactions={transactions}
          >
            {selectedTransactions.size > 1 && editingTransactionId && (
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleNavigateEdit('prev')}
                  disabled={currentEditIndex === 0}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigateEdit('next')}
                  disabled={currentEditIndex >= selectedTransactions.size - 1}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </TransactionModal>
        )}

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('transactions.noTransactionsYet')}</h2>
            <p className="text-gray-600 mb-6">{t('transactions.addFirstTransaction')}</p>
            <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
              {t('transactions.addTransaction')}
            </button>
          </div>
        ) : (
          <div className="card">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input w-full"
                />
              </div>

              {/* Period Filter */}
              <div className="sm:w-40">
                <select
                  value={datePeriod}
                  onChange={(e) => setDatePeriod(e.target.value as any)}
                  className="input w-full"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="sm:w-48">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input w-full"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Date Range Inputs */}
            {datePeriod === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    className="input"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Multi-select and Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-lg font-semibold">
                  Transactions ({getFilteredAndSortedTransactions().length}/{transactions.length})
                </h2>
                <button
                  onClick={isMultiSelectMode ? handleCancelMultiSelect : () => setIsMultiSelectMode(true)}
                  className={`text-sm px-3 py-1 rounded ${isMultiSelectMode ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {isMultiSelectMode ? 'Cancel' : 'Select'}
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {isMultiSelectMode ? (
                  <>
                    {selectedTransactions.size > 0 && (
                      <>
                        <span className="text-sm text-gray-600 py-1">{selectedTransactions.size} selected</span>
                        <button
                          onClick={handleMultiEdit}
                          className="btn btn-primary text-sm whitespace-nowrap"
                        >
                          Edit Selected
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          className="btn bg-red-600 hover:bg-red-700 text-white text-sm whitespace-nowrap"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      if (project) {
                        exportToCSV({ transactions: getFilteredAndSortedTransactions(), project, categories })
                      }
                    }}
                    className="btn btn-secondary text-sm whitespace-nowrap"
                  >
                    Export CSV
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {isMultiSelectMode && (
                      <th className="text-center py-3 px-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.size === getFilteredAndSortedTransactions().length && getFilteredAndSortedTransactions().length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </th>
                    )}
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('category')}
                    >
                      Category {sortColumn === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    {project?.settings?.custom_fields?.map((field: any) => (
                      <th key={field.name} className="text-left py-3 px-4 text-sm font-semibold text-gray-900">{field.name}</th>
                    ))}
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Currency</th>
                    <th
                      className="text-right py-3 px-4 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('amount')}
                    >
                      Amount {sortColumn === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    {!isMultiSelectMode && (
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {getFilteredAndSortedTransactions().map((transaction) => (
                    <tr
                      key={transaction.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${isMultiSelectMode && selectedTransactions.has(transaction.id) ? 'bg-blue-50' : ''}`}
                    >
                      {isMultiSelectMode && (
                        <td className="text-center py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={() => handleToggleSelect(transaction.id)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        </td>
                      )}
                      <td className="py-3 px-4 text-sm text-gray-900">{transaction.date}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {getCategoryName(transaction.category_id)}
                      </td>
                      {project?.settings?.custom_fields?.map((field: any) => (
                        <td key={field.name} className="py-3 px-4 text-sm text-gray-900">
                          {transaction.custom_data?.[field.name] || '-'}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-sm text-right text-gray-600">
                        {transaction.currency_code || 'USD'}
                      </td>
                      <td className={`py-3 px-4 text-sm text-right font-semibold ${
                        transaction.amount < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {transaction.amount < 0 ? '-' : ''}{Math.abs(transaction.amount).toFixed(2)}
                      </td>
                      {!isMultiSelectMode && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-sm text-blue-600 hover:text-blue-800 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
