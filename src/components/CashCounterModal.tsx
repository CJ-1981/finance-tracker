/**
 * @MX:NOTE: Cash Counter Modal - Ultra-compact two-column layout (SPEC-UI-003)
 *
 * Simplified to parallel anonymous + named denomination inputs.
 * Removed person management features (no named entries, no add person button).
 * Real-time total calculation without "Add Entry" button.
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
  namedCounts: Record<number, number>
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
 * Cash counter state for both anonymous and named counts
 */
export interface CashCounterState {
  anonymous: Record<number, number>
  namedCounts: Record<number, number>
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
 * Consolidates all named entries into single namedCounts
 */
const migrateV1ToV2 = (v1Data: StoredCashDataV1): StoredCashDataV2 => {
  const anonymous: Record<number, number> = {}
  const namedCounts: Record<number, number> = {}

  for (const entry of v1Data.entries) {
    if (entry.category === 'anonymous') {
      // Accumulate anonymous counts
      for (const [value, count] of Object.entries(entry.denominations)) {
        const numValue = Number(value)
        anonymous[numValue] = (anonymous[numValue] || 0) + count
      }
    } else {
      // Consolidate all named entries into single namedCounts
      for (const [value, count] of Object.entries(entry.denominations)) {
        const numValue = Number(value)
        namedCounts[numValue] = (namedCounts[numValue] || 0) + count
      }
    }
  }

  return {
    projectId: v1Data.projectId,
    version: 2,
    anonymous,
    namedCounts,
    lastDate: v1Data.lastDate,
  }
}

/**
 * Create empty cash counter state with all denominations initialized to 0
 */
const createEmptyState = (): CashCounterState => ({
  anonymous: DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {} as Record<number, number>),
  namedCounts: DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {} as Record<number, number>),
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
 * Key features:
 * - Parallel anonymous and named denomination input columns
 * - Real-time total calculation (no "Add Entry" button)
 * - Simplified state (no person management)
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
          namedCounts: currentState.namedCounts,
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
          // V2 format - validate and load directly
          if (typeof data.anonymous === 'object' && data.anonymous !== null &&
              typeof data.namedCounts === 'object' && data.namedCounts !== null) {
            setState({
              anonymous: data.anonymous,
              namedCounts: data.namedCounts,
            })
          } else {
            // Invalid V2 payload - reset to empty state
            console.error('Invalid V2 payload structure, resetting to empty state')
            setState(createEmptyState())
          }
        } else {
          // V1 format - migrate
          const v2Data = migrateV1ToV2(data as StoredCashDataV1)
          setState({
            anonymous: v2Data.anonymous,
            namedCounts: v2Data.namedCounts,
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

  const handleNamedCountChange = useCallback((denomination: number, delta: number) => {
    setState(prev => ({
      ...prev,
      namedCounts: {
        ...prev.namedCounts,
        [denomination]: Math.max(0, (prev.namedCounts[denomination] || 0) + delta),
      },
    }))
  }, [])

  const handleNamedDirectInput = useCallback((denomination: number, value: number) => {
    setState(prev => ({
      ...prev,
      namedCounts: {
        ...prev.namedCounts,
        [denomination]: Math.max(0, value),
      },
    }))
  }, [])

  const handleClearAll = useCallback(() => {
    if (confirm(t('cashCounter.confirmClearAll'))) {
      setState(createEmptyState())
      localStorage.removeItem(`cash_counter_${project.id}`)
    }
  }, [project.id, t])

  // ==================== CALCULATIONS ====================

  const anonymousTotal = calculateTotal(state.anonymous)
  const anonymousBreakdown = calculateBreakdown(state.anonymous)

  const namedTotal = calculateTotal(state.namedCounts)
  const namedBreakdown = calculateBreakdown(state.namedCounts)

  // Grand total
  const grandTotal = anonymousTotal + namedTotal
  const grandBreakdown = {
    bills: anonymousBreakdown.bills + namedBreakdown.bills,
    coins: anonymousBreakdown.coins + namedBreakdown.coins,
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

  return (
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
              💵 {t('cashCounter.bills')}
            </h3>

            {/* Header Row */}
            <div className="hidden sm:grid grid-cols-[80px_1fr_1fr] gap-2 mb-1 text-[9px] font-medium text-gray-500 dark:text-gray-400">
              <div></div>
              <div className="text-teal-600 dark:text-teal-400 leading-none">
                {t('cashCounter.anonymous')}
              </div>
              <div className="text-blue-600 dark:text-blue-400 leading-none">
                {t('cashCounter.named')}
              </div>
            </div>

            {/* Denomination Rows */}
            {bills.map((denom) => (
              <DenominationRow
                key={denom.value}
                denomination={denom}
                currency={currency}
                anonymousCount={state.anonymous[denom.value] || 0}
                namedCount={state.namedCounts[denom.value] || 0}
                onAnonymousChange={handleAnonymousCountChange}
                onAnonymousInput={handleAnonymousDirectInput}
                onNamedChange={handleNamedCountChange}
                onNamedInput={handleNamedDirectInput}
              />
            ))}
          </div>

          {/* Coins Section */}
          <div className="mb-6">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              ⚪ {t('cashCounter.coins')}
            </h3>

            {/* Denomination Rows */}
            {coins.map((denom) => (
              <DenominationRow
                key={denom.value}
                denomination={denom}
                currency={currency}
                anonymousCount={state.anonymous[denom.value] || 0}
                namedCount={state.namedCounts[denom.value] || 0}
                onAnonymousChange={handleAnonymousCountChange}
                onAnonymousInput={handleAnonymousDirectInput}
                onNamedChange={handleNamedCountChange}
                onNamedInput={handleNamedDirectInput}
              />
            ))}
          </div>

          {/* Section Totals - Swapped: Named first, Anonymous second */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800/50">
              <div className="text-[10px] font-medium text-blue-700 dark:text-blue-400 mb-1">
                {t('cashCounter.namedTotal')}
              </div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {currency} {namedTotal.toFixed(2)}
              </div>
            </div>

            <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-md border border-teal-200 dark:border-teal-800/50">
              <div className="text-[10px] font-medium text-teal-700 dark:text-teal-400 mb-1">
                {t('cashCounter.anonymousTotal')}
              </div>
              <div className="text-lg font-bold text-teal-900 dark:text-teal-100">
                {currency} {anonymousTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Grand Total & Match Status */}
        <div className="px-6 pb-6 border-t border-gray-200 dark:border-slate-700">
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t('cashCounter.grandTotal')}:
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

            {/* Grand Total Breakdown - Stacked Labels */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md border border-yellow-200 dark:border-yellow-800/50">
                <div className="text-[9px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  💵 {t('cashCounter.bills')}
                </div>
                <div className="text-base font-bold dark:text-white">
                  {currency} {grandBreakdown.bills.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md border border-gray-200 dark:border-slate-600">
                <div className="text-[9px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  ⚪ {t('cashCounter.coins')}
                </div>
                <div className="text-base font-bold dark:text-white">
                  {currency} {grandBreakdown.coins.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Transaction Total */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t('cashCounter.transactionsTotal')}:
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
                  ? '✓ ' + t('cashCounter.match')
                  : matchStatus === 'excess'
                  ? '↑ ' + t('cashCounter.excess')
                  : '↓ ' + t('cashCounter.shortage')}:
                </span>
              <span className="font-bold text-lg dark:text-white">
                {currency} {Math.abs(grandTotal - totalTransactionsAmount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-6 btn btn-secondary text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              {t('cashCounter.clearAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
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
  onNamedChange: (denomination: number, delta: number) => void
  onNamedInput: (denomination: number, value: number) => void
}

/**
 * Denomination Row - Displays a single denomination with anonymous and named controls
 *
 * Desktop layout: [Label] | [Anonymous Controls] | [Named Controls]
 * Mobile layout: Stacked with anonymous on top, named below
 */
function DenominationRow({
  denomination,
  currency,
  anonymousCount,
  namedCount,
  onAnonymousChange,
  onAnonymousInput,
  onNamedChange,
  onNamedInput,
}: DenominationRowProps) {
  const { t } = useTranslation()
  const emoji = getCurrencyEmoji(currency, denomination.type)
  const tIncrease = t('cashCounter.increase')
  const tDecrease = t('cashCounter.decrease')

  return (
    <div className="mb-2">
      {/* Compact Design - Equal width columns, works on all screen sizes */}
      <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-start">
        {/* Compact Label Inline */}
        <div className="text-xs sm:text-sm font-black text-center leading-tight">
          {emoji} {denomination.label}
        </div>

        {/* Named Controls Column - Equal width with Anonymous */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-[9px] font-medium text-blue-600 dark:text-blue-400 text-center leading-none">
            {t('cashCounter.named')}
          </div>
          <DenominationControls
            count={namedCount}
            onChange={(delta) => onNamedChange(denomination.value, delta)}
            onInput={(value) => onNamedInput(denomination.value, value)}
            color="blue"
            isMobile={true}
            increaseLabel={tIncrease}
            decreaseLabel={tDecrease}
            inputLabel={`${t('cashCounter.named')} ${denomination.label}`}
          />
        </div>

        {/* Anonymous Controls Column - Equal width with Named */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-[9px] font-medium text-teal-600 dark:text-teal-400 text-center leading-none">
            {t('cashCounter.anonymous')}
          </div>
          <DenominationControls
            count={anonymousCount}
            onChange={(delta) => onAnonymousChange(denomination.value, delta)}
            onInput={(value) => onAnonymousInput(denomination.value, value)}
            color="teal"
            isMobile={true}
            increaseLabel={tIncrease}
            decreaseLabel={tDecrease}
            inputLabel={`${t('cashCounter.anonymous')} ${denomination.label}`}
          />
        </div>
      </div>
    </div>
  )
}

interface DenominationControlsProps {
  count: number
  onChange: (delta: number) => void
  onInput: (value: number) => void
  color: 'teal' | 'blue'
  isMobile?: boolean
  increaseLabel: string
  decreaseLabel: string
  inputLabel: string
}

/**
 * Denomination Controls - Direct input with optional vertical buttons for compact design
 */
function DenominationControls({ count, onChange, onInput, color, isMobile, increaseLabel, decreaseLabel, inputLabel }: DenominationControlsProps) {
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

  return (
    <div className="flex flex-col gap-1">
      <input
        type="number"
        inputMode="numeric"
        min="0"
        className={`text-center font-semibold text-sm w-full border rounded focus:outline-none focus:ring-2 py-0.5 px-1 ${colorClasses[color].input}`}
        value={count}
        onChange={(e) => onInput(parseInt(e.target.value) || 0)}
        aria-label={inputLabel}
      />
      {isMobile && (
        <div className="flex gap-1 justify-center">
          <button
            type="button"
            className={`min-w-[32px] min-h-[32px] rounded ${colorClasses[color].minus} text-white font-bold text-xs disabled:opacity-30`}
            onClick={() => onChange(-1)}
            aria-label={decreaseLabel}
          >
            −
          </button>
          <button
            type="button"
            className={`min-w-[32px] min-h-[32px] rounded ${colorClasses[color].plus} text-white font-bold text-xs`}
            onClick={() => onChange(1)}
            aria-label={increaseLabel}
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}
