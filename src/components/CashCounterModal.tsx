/**
 * @MX:NOTE: Cash Counter Modal - Ultra-compact two-column layout (SPEC-UI-003)
 *
 * Refactored from category toggle workflow to parallel anonymous + named entry.
 * Real-time total calculation without "Add Entry" button.
 * Named entries managed in separate detail modal.
 * V1 to V2 localStorage migration support.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project } from '../types'

// ==================== TYPES & INTERFACES ====================

/**
 * V2 localStorage data structure with version flag for migration
 */
interface StoredCashDataV2 {
  projectId: string
  version: 2
  anonymous: Record<number, number>
  namedEntries: Array<{
    id: string
    name: string
    denominations: Record<number, number>
  }>
  lastDate: string
}

/**
 * V1 legacy data structure (for migration)
 */
interface StoredCashDataV1 {
  projectId: string
  entries: Array<{
    id: string
    category: 'named' | 'anonymous'
    name?: string
    denominations: Record<number, number>
    timestamp: number
  }>
  lastDate: string
}

type StoredCashData = StoredCashDataV1 | StoredCashDataV2

/**
 * Named entry representing a person with their own denomination counts
 */
export interface NamedEntry {
  id: string
  name: string
  denominations: Record<number, number>
}

/**
 * Cash counter state for both anonymous and named entries
 */
export interface CashCounterState {
  anonymous: Record<number, number>
  namedEntries: NamedEntry[]
}

// ==================== CONSTANTS ====================

/**
 * All supported denominations for EUR currency
 */
export const DENOMINATIONS: Array<{
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

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get emoji for currency and denomination type
 */
const getCurrencyEmoji = (currency: string, type: 'bill' | 'coin'): string => {
  const currencyEmojis: Record<string, { bill: string; coin: string }> = {
    'EUR': { bill: '💶', coin: '⚪' },
    'USD': { bill: '💵', coin: '⚪' },
    'GBP': { bill: '💷', coin: '⚪' },
    'JPY': { bill: '💴', coin: '⚪' },
    'KRW': { bill: '💴', coin: '⚪' },
    'CNY': { bill: '💴', coin: '⚪' },
    'INR': { bill: '💵', coin: '⚪' },
  }
  return currencyEmojis[currency]?.[type] || (type === 'bill' ? '💵' : '⚪')
}

/**
 * Get local date string in YYYY-MM-DD format
 */
const getLocalDateString = (): string => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Calculate total amount from denomination counts
 */
const calculateTotal = (denominations: Record<number, number>): number => {
  return DENOMINATIONS.reduce((sum, denom) => {
    return sum + (denominations[denom.value] || 0) * denom.value
  }, 0)
}

/**
 * Calculate bills and coins breakdown
 */
const calculateBreakdown = (denominations: Record<number, number>) => {
  return DENOMINATIONS.reduce(
    (acc, denom) => {
      const amount = (denominations[denom.value] || 0) * denom.value
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

/**
 * Migrate V1 data format to V2
 */
const migrateV1ToV2 = (v1Data: StoredCashDataV1): StoredCashDataV2 => {
  const anonymous: Record<number, number> = {}
  const namedEntries: NamedEntry[] = []

  for (const entry of v1Data.entries) {
    if (entry.category === 'anonymous') {
      // Accumulate anonymous counts
      for (const [value, count] of Object.entries(entry.denominations)) {
        const numValue = Number(value)
        anonymous[numValue] = (anonymous[numValue] || 0) + count
      }
    } else {
      // Convert named entry
      namedEntries.push({
        id: entry.id,
        name: entry.name || 'Unnamed',
        denominations: entry.denominations,
      })
    }
  }

  return {
    projectId: v1Data.projectId,
    version: 2,
    anonymous,
    namedEntries,
    lastDate: v1Data.lastDate,
  }
}

/**
 * Create empty cash counter state with all denominations initialized to 0
 */
const createEmptyState = (): CashCounterState => ({
  anonymous: DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {} as Record<number, number>),
  namedEntries: [],
})

// ==================== MAIN MODAL COMPONENT ====================

interface CashCounterModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project
  totalTransactionsAmount: number
}

/**
 * Cash Counter Modal - Ultra-compact two-column layout
 *
 * Key changes from V1:
 * - No category toggle switch
 * - Parallel anonymous and named entry columns
 * - Real-time total calculation (no "Add Entry" button)
 * - Named entries managed in detail modal
 * - V1 to V2 localStorage migration
 */
export default function CashCounterModal({
  isOpen,
  onClose,
  project,
  totalTransactionsAmount,
}: CashCounterModalProps) {
  const { t } = useTranslation()

  // ==================== STATE ====================

  const [state, setState] = useState<CashCounterState>(createEmptyState)

  const [isNamedEntriesModalOpen, setIsNamedEntriesModalOpen] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // ==================== LOCALSTORAGE ====================

  const saveToLocalStorage = useCallback((currentState: CashCounterState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      const storageKey = `cash_counter_${project.id}`
      try {
        const data: StoredCashDataV2 = {
          projectId: project.id,
          version: 2,
          anonymous: currentState.anonymous,
          namedEntries: currentState.namedEntries,
          lastDate: getLocalDateString(),
        }
        localStorage.setItem(storageKey, JSON.stringify(data))
      } catch (err) {
        console.error('Error saving cash counter data:', err)
      }
    }, 500) // Debounce saves
  }, [project.id])

  // Load from localStorage on mount
  useEffect(() => {
    if (!isOpen || !project) return

    const storageKey = `cash_counter_${project.id}`
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data: StoredCashData = JSON.parse(stored)

        // Check if date has changed
        const today = getLocalDateString()
        if (data.lastDate !== today) {
          // Clear old data and reset state
          localStorage.removeItem(storageKey)
          setState(createEmptyState())
          return
        }

        // Check version and migrate if needed
        if ('version' in data && data.version === 2) {
          // V2 format - load directly
          setState({
            anonymous: data.anonymous,
            namedEntries: data.namedEntries,
          })
        } else {
          // V1 format - migrate
          const v2Data = migrateV1ToV2(data as StoredCashDataV1)
          setState({
            anonymous: v2Data.anonymous,
            namedEntries: v2Data.namedEntries,
          })
          // Save migrated data
          localStorage.setItem(storageKey, JSON.stringify(v2Data))
        }
      } else {
        // No localStorage data exists - start fresh
        setState(createEmptyState())
      }
    } catch (err) {
      console.error('Error loading cash counter data:', err)
      setState(createEmptyState())
    }
  }, [isOpen, project?.id])

  // Save state changes to localStorage (debounced)
  useEffect(() => {
    if (isOpen) {
      saveToLocalStorage(state)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [state, isOpen, saveToLocalStorage])

  // ==================== HANDLERS ====================

  const handleAnonymousCountChange = useCallback((denomination: number, delta: number) => {
    setState(prev => ({
      ...prev,
      anonymous: {
        ...prev.anonymous,
        [denomination]: Math.max(0, (prev.anonymous[denomination] || 0) + delta),
      },
    }))
  }, [])

  const handleAnonymousDirectInput = useCallback((denomination: number, value: number) => {
    setState(prev => ({
      ...prev,
      anonymous: {
        ...prev.anonymous,
        [denomination]: Math.max(0, value),
      },
    }))
  }, [])

  const handleAddNamedEntry = useCallback((entry: Omit<NamedEntry, 'id'>) => {
    const newEntry: NamedEntry = {
      ...entry,
      id: Date.now().toString(),
    }
    setState(prev => ({
      ...prev,
      namedEntries: [...prev.namedEntries, newEntry],
    }))
  }, [])

  const handleUpdateNamedEntry = useCallback((id: string, entry: Omit<NamedEntry, 'id'>) => {
    setState(prev => ({
      ...prev,
      namedEntries: prev.namedEntries.map(e => e.id === id ? { ...entry, id } : e),
    }))
  }, [])

  const handleDeleteNamedEntry = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      namedEntries: prev.namedEntries.filter(e => e.id !== id),
    }))
  }, [])

  const handleClearAll = useCallback(() => {
    if (confirm(t('cashCounter.clearAllConfirm'))) {
      setState(createEmptyState())
      localStorage.removeItem(`cash_counter_${project.id}`)
    }
  }, [project.id, t])

  // ==================== CALCULATIONS ====================

  const anonymousTotal = calculateTotal(state.anonymous)
  const anonymousBreakdown = calculateBreakdown(state.anonymous)

  // Calculate totals from all named entries
  const namedEntriesTotal = state.namedEntries.reduce((sum, entry) => {
    return sum + calculateTotal(entry.denominations)
  }, 0)

  // Calculate breakdown from all named entries
  const namedEntriesBreakdown = state.namedEntries.reduce(
    (acc, entry) => {
      const breakdown = calculateBreakdown(entry.denominations)
      acc.bills += breakdown.bills
      acc.coins += breakdown.coins
      return acc
    },
    { bills: 0, coins: 0 }
  )

  // Grand total
  const grandTotal = anonymousTotal + namedEntriesTotal
  const grandBreakdown = {
    bills: anonymousBreakdown.bills + namedEntriesBreakdown.bills,
    coins: anonymousBreakdown.coins + namedEntriesBreakdown.coins,
  }

  // Match status
  const getMatchStatus = (): 'match' | 'excess' | 'shortage' => {
    const difference = Math.abs(grandTotal - totalTransactionsAmount)
    const tolerance = 0.01

    if (difference <= tolerance) return 'match'
    if (grandTotal > totalTransactionsAmount) return 'excess'
    return 'shortage'
  }

  // ==================== RENDER ====================

  if (!isOpen) return null

  const matchStatus = getMatchStatus()
  const currency = project.settings?.currency || 'EUR'
  const bills = DENOMINATIONS.filter(d => d.type === 'bill')
  const coins = DENOMINATIONS.filter(d => d.type === 'coin')

  // Calculate sum of all named entries per denomination
  const namedDenominationSums: Record<number, number> = {}
  for (const denom of DENOMINATIONS) {
    namedDenominationSums[denom.value] = state.namedEntries.reduce((sum, entry) => {
      return sum + (entry.denominations[denom.value] || 0)
    }, 0)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black dark:bg-slate-900/80 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center p-4 z-50 pointer-events-none">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto relative">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 z-10">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>🧮</span>
                {t('cashCounter.title')}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
                aria-label={t('common.close')}
              >
                ×
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-4 sm:px-6 py-4">
            {/* Bills Section */}
            <div className="mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                💵 {t('cashCounter.bills', { defaultValue: 'Bills' })}
              </h3>

              {/* Header Row */}
              <div className="hidden sm:grid grid-cols-[80px_1fr_1fr] gap-4 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <div></div>
                <div className="text-teal-600 dark:text-teal-400">
                  {t('cashCounter.anonymousSection', { defaultValue: 'Anonymous' })}
                </div>
                <div className="text-blue-600 dark:text-blue-400">
                  {t('cashCounter.namedSection', { defaultValue: 'Named Entries' })}
                </div>
              </div>

              {/* Denomination Rows */}
              {bills.map((denom) => (
                <DenominationRow
                  key={denom.value}
                  denomination={denom}
                  currency={currency}
                  anonymousCount={state.anonymous[denom.value] || 0}
                  namedCount={namedDenominationSums[denom.value] || 0}
                  onAnonymousChange={handleAnonymousCountChange}
                  onAnonymousInput={handleAnonymousDirectInput}
                  onNamedClick={() => setIsNamedEntriesModalOpen(true)}
                />
              ))}
            </div>

            {/* Coins Section */}
            <div className="mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                ⚪ {t('cashCounter.coins', { defaultValue: 'Coins' })}
              </h3>

              {/* Denomination Rows */}
              {coins.map((denom) => (
                <DenominationRow
                  key={denom.value}
                  denomination={denom}
                  currency={currency}
                  anonymousCount={state.anonymous[denom.value] || 0}
                  namedCount={namedDenominationSums[denom.value] || 0}
                  onAnonymousChange={handleAnonymousCountChange}
                  onAnonymousInput={handleAnonymousDirectInput}
                  onNamedClick={() => setIsNamedEntriesModalOpen(true)}
                />
              ))}
            </div>

            {/* Section Totals */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border-2 border-teal-200 dark:border-teal-800/50">
                <div className="text-sm font-medium text-teal-700 dark:text-teal-300 mb-1">
                  {t('cashCounter.anonymousSection', { defaultValue: 'Anonymous' })}
                </div>
                <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                  {currency} {anonymousTotal.toFixed(2)}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800/50">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                  {t('cashCounter.namedSection', { defaultValue: 'Named Entries' })}
                </div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {currency} {namedEntriesTotal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Grand Total & Match Status */}
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-slate-700">
            <div className="py-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t('cashCounter.grandTotal', { defaultValue: 'Total Counted' })}:
                </span>
                <span
                  className={`text-3xl font-black dark:text-white ${
                    matchStatus === 'match'
                      ? 'text-green-600 dark:text-green-400'
                      : matchStatus === 'excess'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {currency} {grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Grand Total Breakdown */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">💵 {t('cashCounter.bills', { defaultValue: 'Bills' })}:</span>
                  <span className="font-bold text-lg dark:text-white">{currency} {grandBreakdown.bills.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-100 dark:bg-slate-700 p-3 rounded-lg border border-gray-200 dark:border-slate-600">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">⚪ {t('cashCounter.coins', { defaultValue: 'Coins' })}:</span>
                  <span className="font-bold text-lg dark:text-white">{currency} {grandBreakdown.coins.toFixed(2)}</span>
                </div>
              </div>

              {/* Transaction Total */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t('cashCounter.transactionsTotal', { defaultValue: 'Transactions Total' })}:
                </span>
                <span className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                  {currency} {totalTransactionsAmount.toFixed(2)}
                </span>
              </div>

              {/* Difference */}
              <div
                className={`flex justify-between items-center p-3 rounded-lg ${
                  matchStatus === 'match'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                    : matchStatus === 'excess'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                    : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                }`}
              >
                <span className="font-semibold">
                  {matchStatus === 'match'
                    ? '✓ ' + t('cashCounter.match', { defaultValue: 'Match' })
                    : matchStatus === 'excess'
                    ? '↑ ' + t('cashCounter.excess', { defaultValue: 'Excess' })
                    : '↓ ' + t('cashCounter.shortage', { defaultValue: 'Shortage' })}:
                </span>
                <span className="font-bold text-lg dark:text-white">
                  {currency} {Math.abs(grandTotal - totalTransactionsAmount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsNamedEntriesModalOpen(true)}
                className="flex-1 btn btn-primary"
              >
                + {t('cashCounter.addPerson', { defaultValue: 'Add Person' })}
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-6 btn btn-secondary text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                {t('cashCounter.clearAll', { defaultValue: 'Clear All' })}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Named Entries Detail Modal */}
      <NamedEntriesModal
        isOpen={isNamedEntriesModalOpen}
        onClose={() => setIsNamedEntriesModalOpen(false)}
        entries={state.namedEntries}
        onAdd={handleAddNamedEntry}
        onUpdate={handleUpdateNamedEntry}
        onDelete={handleDeleteNamedEntry}
        currency={currency}
      />
    </>
  )
}

// ==================== SUBCOMPONENTS ====================

interface DenominationRowProps {
  denomination: { value: number; label: string; type: 'bill' | 'coin' }
  currency: string
  anonymousCount: number
  namedCount: number
  onAnonymousChange: (denomination: number, delta: number) => void
  onAnonymousInput: (denomination: number, value: number) => void
  onNamedClick: () => void
}

/**
 * Denomination Row - Displays a single denomination with anonymous and named controls
 *
 * Desktop layout: [Label] | [Anonymous Controls] | [Named Display]
 * Mobile layout: Stacked with anonymous on top, named below
 */
function DenominationRow({
  denomination,
  currency,
  anonymousCount,
  namedCount,
  onAnonymousChange,
  onAnonymousInput,
  onNamedClick,
}: DenominationRowProps) {
  const { t } = useTranslation()
  const emoji = getCurrencyEmoji(currency, denomination.type)

  return (
    <div className="mb-2 sm:mb-3">
      {/* Mobile: Label */}
      <div className="sm:hidden mb-2">
        <span className="text-base sm:text-lg font-black">
          {emoji} {denomination.label}
        </span>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:grid grid-cols-[80px_1fr_1fr] gap-4 items-center">
        {/* Label */}
        <div className="text-base sm:text-lg font-black">
          {emoji} {denomination.label}
        </div>

        {/* Anonymous Controls */}
        <DenominationControls
          count={anonymousCount}
          onChange={(delta) => onAnonymousChange(denomination.value, delta)}
          onInput={(value) => onAnonymousInput(denomination.value, value)}
          color="teal"
        />

        {/* Named Display (Clickable) */}
        <button
          type="button"
          onClick={onNamedClick}
          className="flex items-center justify-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {namedCount}
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-400">
            ({t('cashCounter.person', { defaultValue: 'Person' })})
          </span>
        </button>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden space-y-2">
        {/* Anonymous Controls */}
        <div className="p-3 rounded-lg border-2 border-teal-200 dark:border-teal-800/50 bg-teal-50 dark:bg-teal-900/20">
          <div className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-2">
            {t('cashCounter.anonymousSection', { defaultValue: 'Anonymous' })}
          </div>
          <DenominationControls
            count={anonymousCount}
            onChange={(delta) => onAnonymousChange(denomination.value, delta)}
            onInput={(value) => onAnonymousInput(denomination.value, value)}
            color="teal"
          />
        </div>

        {/* Named Display (Clickable) */}
        <button
          type="button"
          onClick={onNamedClick}
          className="w-full p-3 rounded-lg border-2 border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 text-left"
        >
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
            {t('cashCounter.namedSection', { defaultValue: 'Named Entries' })}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {namedCount}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              → {t('cashCounter.entries', { defaultValue: 'Entries' })}
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}

interface DenominationControlsProps {
  count: number
  onChange: (delta: number) => void
  onInput: (value: number) => void
  color: 'teal' | 'blue'
}

/**
 * Denomination Controls - Plus/minus buttons and direct input
 */
function DenominationControls({ count, onChange, onInput, color }: DenominationControlsProps) {
  const colorClasses = {
    teal: {
      minus: 'bg-red-500 hover:bg-red-600 disabled:bg-red-300',
      plus: 'bg-green-500 hover:bg-green-600',
      input: 'border-gray-300 dark:border-slate-600 focus:ring-teal-500 dark:bg-slate-700 dark:text-white',
    },
    blue: {
      minus: 'bg-red-500 hover:bg-red-600 disabled:bg-red-300',
      plus: 'bg-green-500 hover:bg-green-600',
      input: 'border-gray-300 dark:border-slate-600 focus:ring-blue-500 dark:bg-slate-700 dark:text-white',
    },
  }

  const classes = colorClasses[color]

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(-1)}
        className={`w-10 h-10 rounded ${classes.minus} text-white font-bold text-lg disabled:opacity-30`}
        disabled={count === 0}
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        className="flex-1 text-center font-semibold text-base min-w-[60px] border rounded focus:outline-none focus:ring-2 py-2 px-3"
        value={count}
        onChange={(e) => onInput(parseInt(e.target.value) || 0)}
      />
      <button
        type="button"
        onClick={() => onChange(1)}
        className={`w-10 h-10 rounded ${classes.plus} text-white font-bold text-lg`}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  )
}

interface NamedEntriesModalProps {
  isOpen: boolean
  onClose: () => void
  entries: NamedEntry[]
  onAdd: (entry: Omit<NamedEntry, 'id'>) => void
  onUpdate: (id: string, entry: Omit<NamedEntry, 'id'>) => void
  onDelete: (id: string) => void
  currency: string
}

/**
 * Named Entries Modal - Detail modal for managing individual named entries
 */
function NamedEntriesModal({
  isOpen,
  onClose,
  entries,
  onAdd,
  onUpdate,
  onDelete,
  currency,
}: NamedEntriesModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black dark:bg-slate-900/80 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center p-4 z-[60] pointer-events-none">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('cashCounter.entries', { defaultValue: 'Named Entries' })}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
              aria-label={t('common.close')}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>{t('cashCounter.noNamedEntries', { defaultValue: 'No named entries yet. Click "Add Person" to create one.' })}</p>
            </div>
          ) : (
            entries.map((entry) => (
              <PersonCard
                key={entry.id}
                entry={entry}
                currency={currency}
                onUpdate={(updatedEntry) => onUpdate(entry.id, updatedEntry)}
                onDelete={() => onDelete(entry.id)}
              />
            ))
          )}

          {/* Add New Person Form */}
          <AddPersonForm onSubmit={onAdd} currency={currency} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="w-full btn btn-secondary"
          >
            {t('common.close', { defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </div>
  )
}

interface PersonCardProps {
  entry: NamedEntry
  currency: string
  onUpdate: (entry: Omit<NamedEntry, 'id'>) => void
  onDelete: () => void
}

/**
 * Person Card - Displays and edits a single named entry
 */
function PersonCard({ entry, currency, onUpdate, onDelete }: PersonCardProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(entry.name)
  const [denominations, setDenominations] = useState(entry.denominations)

  const total = calculateTotal(denominations)
  const bills = DENOMINATIONS.filter(d => d.type === 'bill')
  const coins = DENOMINATIONS.filter(d => d.type === 'coin')

  const handleSave = () => {
    onUpdate({ name, denominations })
  }

  const handleCountChange = (denomination: number, delta: number) => {
    setDenominations(prev => ({
      ...prev,
      [denomination]: Math.max(0, (prev[denomination] || 0) + delta),
    }))
  }

  const handleDirectInput = (denomination: number, value: number) => {
    setDenominations(prev => ({
      ...prev,
      [denomination]: Math.max(0, value),
    }))
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border-2 border-blue-200 dark:border-blue-800/50">
      {/* Header: Name, Total, Delete */}
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          className="flex-1 font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-slate-600 focus:border-blue-500 focus:outline-none px-1"
        />
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {currency} {total.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={onDelete}
            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
          >
            {t('cashCounter.delete', { defaultValue: 'Delete' })}
          </button>
        </div>
      </div>

      {/* Bills Section */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">
          💵 {t('cashCounter.bills', { defaultValue: 'Bills' })}
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {bills.map((denom) => (
            <div key={denom.value} className="flex items-center gap-1">
              <span className="text-xs font-medium w-12">{denom.label}</span>
              <DenominationControls
                count={denominations[denom.value] || 0}
                onChange={(delta) => handleCountChange(denom.value, delta)}
                onInput={(value) => handleDirectInput(denom.value, value)}
                color="blue"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Coins Section */}
      <div>
        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">
          ⚪ {t('cashCounter.coins', { defaultValue: 'Coins' })}
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {coins.map((denom) => (
            <div key={denom.value} className="flex items-center gap-1">
              <span className="text-xs font-medium w-10">{denom.label}</span>
              <DenominationControls
                count={denominations[denom.value] || 0}
                onChange={(delta) => handleCountChange(denom.value, delta)}
                onInput={(value) => handleDirectInput(denom.value, value)}
                color="blue"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface AddPersonFormProps {
  onSubmit: (entry: Omit<NamedEntry, 'id'>) => void
  currency: string
}

/**
 * Add Person Form - Form to add a new named entry
 */
function AddPersonForm({ onSubmit, currency }: AddPersonFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [denominations, setDenominations] = useState<Record<number, number>>(() =>
    DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {} as Record<number, number>)
  )

  const handleSubmit = () => {
    if (!name.trim()) {
      alert(t('cashCounter.enterName', { defaultValue: 'Please enter a name' }))
      return
    }

    onSubmit({
      name: name.trim(),
      denominations,
    })

    // Reset form
    setName('')
    setDenominations(
      DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {} as Record<number, number>)
    )
  }

  const handleCountChange = (denomination: number, delta: number) => {
    setDenominations(prev => ({
      ...prev,
      [denomination]: Math.max(0, (prev[denomination] || 0) + delta),
    }))
  }

  const handleDirectInput = (denomination: number, value: number) => {
    setDenominations(prev => ({
      ...prev,
      [denomination]: Math.max(0, value),
    }))
  }

  const total = calculateTotal(denominations)
  const bills = DENOMINATIONS.filter(d => d.type === 'bill')
  const coins = DENOMINATIONS.filter(d => d.type === 'coin')

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700/50">
      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
        + {t('cashCounter.addPerson', { defaultValue: 'Add Person' })}
      </h4>

      {/* Name Input */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('cashCounter.personName', { defaultValue: 'Person Name' })}
        className="w-full input mb-3"
      />

      {/* Bills Section */}
      <div className="mb-3">
        <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">
          💵 {t('cashCounter.bills', { defaultValue: 'Bills' })}
        </h5>
        <div className="grid grid-cols-3 gap-2">
          {bills.map((denom) => (
            <div key={denom.value} className="flex items-center gap-1">
              <span className="text-xs font-medium w-12">{denom.label}</span>
              <DenominationControls
                count={denominations[denom.value] || 0}
                onChange={(delta) => handleCountChange(denom.value, delta)}
                onInput={(value) => handleDirectInput(denom.value, value)}
                color="blue"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Coins Section */}
      <div className="mb-3">
        <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">
          ⚪ {t('cashCounter.coins', { defaultValue: 'Coins' })}
        </h5>
        <div className="grid grid-cols-4 gap-2">
          {coins.map((denom) => (
            <div key={denom.value} className="flex items-center gap-1">
              <span className="text-xs font-medium w-10">{denom.label}</span>
              <DenominationControls
                count={denominations[denom.value] || 0}
                onChange={(delta) => handleCountChange(denom.value, delta)}
                onInput={(value) => handleDirectInput(denom.value, value)}
                color="blue"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Total and Submit */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {t('cashCounter.total', { defaultValue: 'Total' })}: {currency} {total.toFixed(2)}
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={!name.trim() || total === 0}
        >
          {t('cashCounter.addPerson', { defaultValue: 'Add Person' })}
        </button>
      </div>
    </div>
  )
}
