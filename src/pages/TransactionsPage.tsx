import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabase'
import { exportToCSV } from '../utils/csvExport'
import type { Project, Transaction, Category } from '../types'

export default function TransactionsPage() {
  const { user } = useAuth()
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    amount: '',
    currency_code: 'USD',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
  })

  // Update category_id when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !formData.category_id) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }))
    }
  }, [categories])

  const [customData, setCustomData] = useState<Record<string, string>>({})
  const [showSettings, setShowSettings] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
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
        setFormData((prev) => ({ ...prev, category_id: category.id }))
      }
    } catch (error) {
      console.error('Error creating default category:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user?.id || !projectId) {
      console.error('User or project not available')
      return
    }

    try {
      const supabase = getSupabaseClient()
      if (editingTransactionId) {
        const { error } = await (supabase
          .from('transactions') as any)
          .update({
            amount: parseFloat(formData.amount),
            currency_code: formData.currency_code,
            category_id: formData.category_id,
            date: formData.date,
            custom_data: customData,
          })
          .eq('id', editingTransactionId)

        if (error) throw error
      } else {
        const { error } = await (supabase
          .from('transactions') as any)
          .insert({
            project_id: projectId,
            amount: parseFloat(formData.amount),
            currency_code: formData.currency_code,
            category_id: formData.category_id,
            date: formData.date,
            created_by: user.id,
            custom_data: customData,
          })

        if (error) throw error
      }

      setFormData({
        amount: '',
        currency_code: 'USD',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
      })
      setCustomData({})
      setEditingTransactionId(null)
      setShowAddForm(false)
      fetchTransactions()
    } catch (error) {
      console.error('Error creating transaction:', error)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransactionId(transaction.id)
    setFormData({
      amount: transaction.amount.toString(),
      currency_code: transaction.currency_code || 'USD',
      category_id: transaction.category_id || '',
      date: transaction.date || new Date().toISOString().split('T')[0],
    })
    setCustomData(transaction.custom_data || {})
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
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

    if (!confirm(`Are you sure you want to delete ${selectedTransactions.size} selected transaction(s)?`)) {
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
        .insert([{ project_id: projectId, name: newCategoryName, color: '#' + Math.floor(Math.random() * 16777215).toString(16).padEnd(6, '0'), order }])
        .select()
        .single()
      if (error) throw error
      setCategories([...categories, data as Category])
      setNewCategoryName('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFieldName || !project) return

    const newField: any = { name: newFieldName, type: newFieldType }

    // For select type, add options
    if (newFieldType === 'select') {
      newField.options = newFieldOptions.length > 0 ? newFieldOptions : ['Option 1', 'Option 2', 'Option 3']
    }

    const currentFields = project.settings?.custom_fields || []
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
    if (!confirm('Are you sure you want to delete this category? Transactions using it will become Uncategorized.')) return;
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from('categories').delete().eq('id', categoryId)
      if (error) throw error
      setCategories(categories.filter(c => c.id !== categoryId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleRenameCategory = async (categoryId: string, newName: string) => {
    if (!newName.trim()) return
    try {
      const supabase = getSupabaseClient()
      const { error } = await (supabase.from('categories') as any).update({ name: newName }).eq('id', categoryId)
      if (error) throw error
      setCategories(categories.map(c => c.id === categoryId ? { ...c, name: newName } : c))
      setEditingCategoryId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    if (index < 0 || index >= categories.length) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === categories.length - 1) return

    try {
      const supabase = getSupabaseClient()
      const currentCategory = categories[index]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      const targetCategory = categories[targetIndex]

      // Swap the order values in the database
      const { error: error1 } = await (supabase.from('categories') as any)
        .update({ order: targetCategory.order })
        .eq('id', currentCategory.id)
      if (error1) throw error1

      const { error: error2 } = await (supabase.from('categories') as any)
        .update({ order: currentCategory.order })
        .eq('id', targetCategory.id)
      if (error2) throw error2

      // Update local state
      const newCategories = [...categories]
      newCategories[index] = targetCategory
      newCategories[targetIndex] = currentCategory
      setCategories(newCategories)
    } catch (err) {
      console.error('Error moving category:', err)
    }
  }

  const handleRenameField = async (oldName: string, newName: string) => {
    if (!project || !newName.trim() || oldName === newName) return
    const currentFields = project.settings?.custom_fields || []
    if (currentFields.some(f => f.name === newName)) {
      alert('A field with this name already exists')
      return
    }

    const updatedSettings = {
      ...project.settings,
      custom_fields: currentFields.map(f =>
        f.name === oldName
          ? { ...f, name: newName, options: editingFieldOptions.length > 0 ? editingFieldOptions : f.options }
          : f
      )
    }

    try {
      const supabase = getSupabaseClient()
      const { error: projectError } = await (supabase.from('projects') as any)
        .update({ settings: updatedSettings })
        .eq('id', projectId as string)
      if (projectError) throw projectError

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
            <div className="min-w-0">
              <Link to={`/projects/${projectId}`} className="text-sm text-blue-600 hover:underline">
                ← Back to Project
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">Transactions</h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowSettings(!showSettings)} className="btn btn-secondary text-sm whitespace-nowrap">
                {showSettings ? 'Close' : 'Settings'}
              </button>
              <button onClick={() => {
                setEditingTransactionId(null)
                setFormData({
                  amount: '',
                  currency_code: project?.settings?.currency || 'USD',
                  category_id: categories.length > 0 ? categories[0].id : '',
                  date: new Date().toISOString().split('T')[0],
                })
                setCustomData({})
                setShowAddForm(true)
              }} className="btn btn-primary text-sm whitespace-nowrap">
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSettings && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Manage Categories</h2>
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                <input type="text" className="input" placeholder="New Category Name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} required />
                <button type="submit" className="btn btn-primary whitespace-nowrap">Add</button>
              </form>
              <ul className="space-y-2">
                {categories.map((c, index) => (
                  <li key={c.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                    {editingCategoryId === c.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          className="input py-1 px-2 text-sm"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameCategory(c.id, editingCategoryName)
                            if (e.key === 'Escape') setEditingCategoryId(null)
                          }}
                        />
                        <button onClick={() => handleRenameCategory(c.id, editingCategoryName)} className="text-blue-600 hover:text-blue-800 font-semibold">Save</button>
                        <button onClick={() => setEditingCategoryId(null)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }}></span>
                          {c.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <button disabled={index === 0} onClick={() => handleMoveCategory(index, 'up')} className="text-gray-500 hover:text-blue-600 disabled:opacity-30">↑</button>
                          <button disabled={index === categories.length - 1} onClick={() => handleMoveCategory(index, 'down')} className="text-gray-500 hover:text-blue-600 disabled:opacity-30">↓</button>
                          <button onClick={() => {
                            setEditingCategoryId(c.id)
                            setEditingCategoryName(c.name)
                          }} className="text-blue-500 hover:text-blue-700">Rename</button>
                          <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:text-red-700">Delete</button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Manage Custom Fields</h2>
              <form onSubmit={handleAddField} className="flex flex-col gap-2 mb-4">
                <div className="flex gap-2">
                  <input type="text" className="input flex-1" placeholder="Field Name" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} required />
                  <select className="input w-32" value={newFieldType} onChange={e => setNewFieldType(e.target.value as any)}>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Dropdown</option>
                  </select>
                  <button type="submit" className="btn btn-primary whitespace-nowrap">Add</button>
                </div>
                {newFieldType === 'select' && (
                  <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded">
                    <label className="text-sm font-medium text-gray-700">Dropdown Options (one per line)</label>
                    <textarea
                      className="input min-h-20 font-mono text-sm"
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      value={newFieldOptions.join('\n')}
                      onChange={(e) => setNewFieldOptions(e.target.value.split('\n').filter(v => v.trim()))}
                    />
                  </div>
                )}
              </form>
              <div className="space-y-2">
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
                            onChange={(e) => setEditingFieldOptions(e.target.value.split('\n').filter(v => v.trim()))}
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
                              // Load existing values
                              const existingValues = Array.from(new Set(
                                transactions
                                  .map(t => t.custom_data?.[f.name])
                                  .filter(Boolean)
                              ))
                              setImportValues(existingValues.join('\n'))
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

        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingTransactionId ? (
                  selectedTransactions.size > 1 ? (
                    `Edit Transaction ${currentEditIndex + 1} of ${selectedTransactions.size}`
                  ) : 'Edit Transaction'
                ) : 'Add Transaction'}
              </h2>
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      inputMode="decimal"
                      className="input flex-1"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                    <select
                      id="currency_code"
                      className="input w-24"
                      value={formData.currency_code}
                      onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
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
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    className="input"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    className="input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                {project?.settings?.custom_fields?.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.name}</label>
                    {field.type === 'text' ? (
                      <>
                        <input
                          type="text"
                          list={`custom-field-${field.name}`}
                          className="input"
                          value={customData[field.name] || ''}
                          onChange={(e) => setCustomData({ ...customData, [field.name]: e.target.value })}
                        />
                        <datalist id={`custom-field-${field.name}`}>
                          {/* Combine imported values with existing transaction values */}
                          {Array.from(new Set([
                            ...(project?.settings?.custom_field_values?.[field.name] || []),
                            ...transactions.map(t => t.custom_data?.[field.name]).filter(Boolean)
                          ])).map((value, i) => (
                            <option key={i} value={value as string} />
                          ))}
                        </datalist>
                      </>
                    ) : field.type === 'select' ? (
                      <select
                        className="input"
                        value={customData[field.name] || (field.options?.[0] || '')}
                        onChange={(e) => setCustomData({ ...customData, [field.name]: e.target.value })}
                      >
                        {field.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        className="input"
                        value={customData[field.name] || ''}
                        onChange={(e) => setCustomData({ ...customData, [field.name]: e.target.value })}
                      />
                    )}
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingTransactionId(null)
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingTransactionId ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No transactions yet</h2>
            <p className="text-gray-600 mb-6">Add your first transaction to get started</p>
            <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
              Add Transaction
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

            <div className="overflow-x-auto">
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
                      <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                        {transaction.amount.toFixed(2)}
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
