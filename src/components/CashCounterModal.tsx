import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project } from '../types'

// Get emoji for currency and denomination type
const getCurrencyEmoji = (currency: string, type: 'bill' | 'coin'): string => {
  const currencyEmojis: Record<string, { bill: string; coin: string }> = {
    'EUR': { bill: '💶', coin: '🪙' },
    'USD': { bill: '💵', coin: '🪙' },
    'GBP': { bill: '💷', coin: '🪙' },
    'JPY': { bill: '💴', coin: '🪙' },
    'KRW': { bill: '💴', coin: '🪙' }, // Won uses same visual style as Yen
  }

  return currencyEmojis[currency]?.[type] || (type === 'bill' ? '💵' : '🪙')
}

// Denominations for EUR (can be extended for other currencies)
const DENOMINATIONS: Array<{
  value: number
  label: string
  type: 'bill' | 'coin'
}> = [
  { value: 200, label: '200', type: 'bill' },
  { value: 100, label: '100', type: 'bill' },
  { value: 50, label: '50', type: 'bill' },
  { value: 20, label: '20', type: 'bill' },
  { value: 10, label: '10', type: 'bill' },
  { value: 5, label: '5', type: 'bill' },
  { value: 2, label: '2', type: 'coin' },
  { value: 1, label: '1', type: 'coin' },
  { value: 0.50, label: '0.50', type: 'coin' },
  { value: 0.20, label: '0.20', type: 'coin' },
  { value: 0.10, label: '0.10', type: 'coin' },
  { value: 0.05, label: '0.05', type: 'coin' },
  { value: 0.02, label: '0.02', type: 'coin' },
  { value: 0.01, label: '0.01', type: 'coin' },
]

interface CashCounterModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project
  totalTransactionsAmount: number
}

interface CashEntry {
  id: string
  category: 'named' | 'anonymous'
  name?: string
  denominations: Record<number, number>
  timestamp: number
}

interface StoredCashData {
  projectId: string
  entries: CashEntry[]
  lastDate: string
}

export default function CashCounterModal({ isOpen, onClose, project, totalTransactionsAmount }: CashCounterModalProps) {
  const { t } = useTranslation()
  const [category, setCategory] = useState<'named' | 'anonymous'>('anonymous')
  const [entryName, setEntryName] = useState('')
  const [counts, setCounts] = useState<Record<number, number>>(() =>
    DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {} as Record<number, number>)
  )
  const [entries, setEntries] = useState<CashEntry[]>([])
  const [totalCashCounted, setTotalCashCounted] = useState(0)

  // Load saved data from localStorage
  useEffect(() => {
    if (!isOpen || !project) return

    const storageKey = `cash_counter_${project.id}`
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data: StoredCashData = JSON.parse(stored)
        // Check if date has changed
        const today = new Date().toISOString().split('T')[0]
        if (data.lastDate !== today) {
          // Clear old data
          localStorage.removeItem(storageKey)
          setEntries([])
        } else {
          setEntries(data.entries)
        }
      }
    } catch (err) {
      console.error('Error loading cash counter data:', err)
    }
  }, [isOpen, project?.id])

  // Calculate total whenever counts change
  useEffect(() => {
    const total = DENOMINATIONS.reduce((sum, denom) => sum + (counts[denom.value] || 0) * denom.value, 0)
    setTotalCashCounted(total)
  }, [counts])

  // Helper function to calculate bills and coins breakdown
  const calculateBreakdown = (denomCounts: Record<number, number>) => {
    return DENOMINATIONS.reduce(
      (acc, denom) => {
        const amount = (denomCounts[denom.value] || 0) * denom.value
        if (denom.type === 'bill') {
          acc.bills += amount
        } else {
          acc.coins += amount
        }
        return acc
      },
      { bills: 0, coins: 0 }
    )
  }

  // Calculate total from all entries
  const totalFromEntries = entries.reduce((sum, entry) => {
    const entryTotal = DENOMINATIONS.reduce((s, d) => s + (entry.denominations[d.value] || 0) * d.value, 0)
    return sum + entryTotal
  }, 0)

  const grandTotal = totalCashCounted + totalFromEntries

  // Calculate current entry breakdown
  const currentBreakdown = calculateBreakdown(counts)

  // Calculate grand total breakdown from all entries
  const entriesBreakdown = entries.reduce(
    (acc, entry) => {
      const breakdown = calculateBreakdown(entry.denominations)
      acc.bills += breakdown.bills
      acc.coins += breakdown.coins
      return acc
    },
    { bills: 0, coins: 0 }
  )

  const grandBreakdown = {
    bills: currentBreakdown.bills + entriesBreakdown.bills,
    coins: currentBreakdown.coins + entriesBreakdown.coins,
  }

  const handleCountChange = (denomination: number, delta: number) => {
    setCounts(prev => ({
      ...prev,
      [denomination]: Math.max(0, (prev[denomination] || 0) + delta)
    }))
  }

  const handleDirectInput = (denomination: number, value: number) => {
    setCounts(prev => ({
      ...prev,
      [denomination]: Math.max(0, value)
    }))
  }

  const handleAddEntry = () => {
    if (category === 'named' && !entryName.trim()) {
      alert(t('cashCounter.pleaseEnterName'))
      return
    }

    const newEntry: CashEntry = {
      id: Date.now().toString(),
      category,
      name: category === 'named' ? entryName.trim() : undefined,
      denominations: { ...counts },
      timestamp: Date.now()
    }

    const storageKey = `cash_counter_${project.id}`
    const updatedEntries = [...entries, newEntry]
    setEntries(updatedEntries)

    // Persist to localStorage
    try {
      const data: StoredCashData = {
        projectId: project.id,
        entries: updatedEntries,
        lastDate: new Date().toISOString().split('T')[0]
      }
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch (err) {
      console.error('Error saving cash counter data:', err)
    }

    // Reset current counts
    setCounts(() =>
      DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {} as Record<number, number>)
    )
    setEntryName('')
  }

  const handleDeleteEntry = (id: string) => {
    const updatedEntries = entries.filter(e => e.id !== id)
    setEntries(updatedEntries)

    const storageKey = `cash_counter_${project.id}`
    try {
      if (updatedEntries.length === 0) {
        localStorage.removeItem(storageKey)
      } else {
        const data: StoredCashData = {
          projectId: project.id,
          entries: updatedEntries,
          lastDate: new Date().toISOString().split('T')[0]
        }
        localStorage.setItem(storageKey, JSON.stringify(data))
      }
    } catch (err) {
      console.error('Error updating cash counter data:', err)
    }
  }

  const handleClearAll = () => {
    if (confirm(t('cashCounter.confirmClearAll'))) {
      setEntries([])
      setCounts(() =>
        DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {} as Record<number, number>)
      )

      const storageKey = `cash_counter_${project.id}`
      localStorage.removeItem(storageKey)
    }
  }

  const getMatchStatus = () => {
    const difference = Math.abs(grandTotal - totalTransactionsAmount)
    const tolerance = 0.01 // 1 cent tolerance

    if (difference <= tolerance) {
      return 'match' // Exact match
    } else if (grandTotal > totalTransactionsAmount) {
      return 'excess' // More cash counted than transactions
    } else {
      return 'shortage' // Less cash counted than transactions
    }
  }

  if (!isOpen) return null

  const matchStatus = getMatchStatus()
  const currency = project.settings?.currency || 'EUR'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>🧮</span>
              {t('cashCounter.title')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Category Selection */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setCategory('anonymous')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === 'anonymous'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('cashCounter.anonymous')}
            </button>
            <button
              type="button"
              onClick={() => setCategory('named')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === 'named'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('cashCounter.withNames')}
            </button>
          </div>

          {category === 'named' && (
            <input
              type="text"
              className="input"
              placeholder={t('cashCounter.enterName')}
              value={entryName}
              onChange={(e) => setEntryName(e.target.value)}
            />
          )}
        </div>

        {/* Denominations Grid */}
        <div className="px-6 py-4">
          {/* Bills Section */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              💵 {t('cashCounter.bills', { defaultValue: 'Bills' })}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DENOMINATIONS.filter(d => d.type === 'bill').map((denom) => (
                <div
                  key={denom.value}
                  className="p-3 rounded-lg border-2 border-yellow-200 bg-yellow-50"
                >
                  <div className="flex justify-center items-center mb-2">
                    <span className="text-lg font-black">
                      {getCurrencyEmoji(currency, denom.type)} {denom.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCountChange(denom.value, -1)}
                      className="w-10 h-10 rounded-full bg-red-500 text-white font-bold text-xl hover:bg-red-600 disabled:opacity-30"
                      disabled={(counts[denom.value] || 0) === 0}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      className="flex-1 text-center font-semibold text-lg min-w-[40px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={counts[denom.value] || 0}
                      onChange={(e) => handleDirectInput(denom.value, parseInt(e.target.value) || 0)}
                    />
                    <button
                      type="button"
                      onClick={() => handleCountChange(denom.value, 1)}
                      className="w-10 h-10 rounded-full bg-green-500 text-white font-bold text-xl hover:bg-green-600"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

          {/* Coins Section */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              🪙 {t('cashCounter.coins', { defaultValue: 'Coins' })}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DENOMINATIONS.filter(d => d.type === 'coin').map((denom) => (
                <div
                  key={denom.value}
                  className="p-3 rounded-lg border-2 border-gray-300 bg-gray-50"
                >
                  <div className="flex justify-center items-center mb-2">
                    <span className="text-lg font-black">
                      {getCurrencyEmoji(currency, denom.type)} {denom.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCountChange(denom.value, -1)}
                      className="w-10 h-10 rounded-full bg-red-500 text-white font-bold text-xl hover:bg-red-600 disabled:opacity-30"
                      disabled={(counts[denom.value] || 0) === 0}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      className="flex-1 text-center font-semibold text-lg min-w-[40px] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={counts[denom.value] || 0}
                      onChange={(e) => handleDirectInput(denom.value, parseInt(e.target.value) || 0)}
                    />
                    <button
                      type="button"
                      onClick={() => handleCountChange(denom.value, 1)}
                      className="w-10 h-10 rounded-full bg-green-500 text-white font-bold text-xl hover:bg-green-600"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Entry Total */}
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-gray-700">{t('cashCounter.currentEntry')}:</span>
              <span className="text-2xl font-bold">
                {currency} {totalCashCounted.toFixed(2)}
              </span>
            </div>
            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div className="flex items-center justify-between bg-yellow-50 p-2 rounded">
                <span className="text-gray-600">💵 {t('cashCounter.bills', { defaultValue: 'Bills' })}:</span>
                <span className="font-bold">{currency} {currentBreakdown.bills.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <span className="text-gray-600">🪙 {t('cashCounter.coins', { defaultValue: 'Coins' })}:</span>
                <span className="font-bold">{currency} {currentBreakdown.coins.toFixed(2)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddEntry}
              className="w-full btn btn-primary"
            >
              + {t('cashCounter.addEntry')}
            </button>
          </div>
        </div>

        {/* Entries List and Comparison */}
        <div className="px-6 pb-6 border-t border-gray-200">
          {/* Grand Total */}
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-gray-900">{t('cashCounter.totalCounted')}:</span>
              <span className={`text-3xl font-black ${
                matchStatus === 'match'
                  ? 'text-green-600'
                  : matchStatus === 'excess'
                  ? 'text-blue-600'
                  : 'text-red-600'
              }`}>
                {currency} {grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Grand Total Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <span className="text-gray-700 font-medium">💵 {t('cashCounter.bills', { defaultValue: 'Bills' })}:</span>
                <span className="font-bold text-lg">{currency} {grandBreakdown.bills.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border border-gray-200">
                <span className="text-gray-700 font-medium">🪙 {t('cashCounter.coins', { defaultValue: 'Coins' })}:</span>
                <span className="font-bold text-lg">{currency} {grandBreakdown.coins.toFixed(2)}</span>
              </div>
            </div>

            {/* Transaction Total */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-gray-900">{t('cashCounter.transactionsTotal')}:</span>
              <span className="text-xl font-semibold text-gray-600">
                {currency} {totalTransactionsAmount.toFixed(2)}
              </span>
            </div>

            {/* Difference */}
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              matchStatus === 'match'
                ? 'bg-green-100 text-green-800'
                : matchStatus === 'excess'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}>
              <span className="font-semibold">
                {matchStatus === 'match'
                  ? '✓ ' + t('cashCounter.match')
                  : matchStatus === 'excess'
                  ? '↑ ' + t('cashCounter.excess')
                  : '↓ ' + t('cashCounter.shortage')
                }:
              </span>
              <span className="font-bold text-lg">
                {currency} {Math.abs(grandTotal - totalTransactionsAmount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Entries List */}
          {entries.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('cashCounter.entries')}</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {entries.map((entry) => {
                  const entryTotal = DENOMINATIONS.reduce(
                    (sum, d) => sum + (entry.denominations[d.value] || 0) * d.value,
                    0
                  )

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <span className="font-semibold text-gray-900">
                          {entry.category === 'named' ? entry.name : t('cashCounter.anonymous')}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">
                          {currency} {entryTotal.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          {t('cashCounter.delete')}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Clear All Button */}
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={handleClearAll}
              className="w-full btn btn-secondary text-red-600 hover:text-red-700"
            >
              {t('cashCounter.clearAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
