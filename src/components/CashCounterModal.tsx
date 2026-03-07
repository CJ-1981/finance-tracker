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
import {
  getDenominations,
  getCurrencyEmoji,
} from '../config/currencyDenominations'
import {
  createEmptyDenominationState,
  calculateDenominationTotal,
  calculateDenominationBreakdown,
  filterDenominationsByType,
  getDenominationsWithData,
  formatCurrencyAmount,
} from '../utils/denominationUtils'

// ==================== TYPES & INTERFACES ====================

/**
 * V2/V3 localStorage data structure with version flag for migration
 */
interface StoredCashDataV2 {
  projectId: string
  version: 2 | 3  // Supports both V2 and V3
  anonymous: Record<number, number>
  namedCounts: Record<number, number>
  lastDate: string
  currency?: string  // Added in V3, optional for V2 backwards compatibility
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
  currency: string  // NEW: Track currency for denomination-specific data
}

// ==================== UTILITY FUNCTIONS ====================

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
const createEmptyState = (currency: string): CashCounterState => ({
  anonymous: createEmptyDenominationState(currency),
  namedCounts: createEmptyDenominationState(currency),
  currency,
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

  const [state, setState] = useState<CashCounterState>(() =>
    createEmptyState(project.settings?.currency || 'EUR')
  )
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // ==================== LOCALSTORAGE ====================

  // @MX:ANCHOR: Persisted state management with debouncing for data integrity
  // @MX:REASON: Called from useEffect, dependency array, and cleanup - critical for preventing data loss
  const saveToLocalStorage = useCallback((currentState: CashCounterState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // @MX:NOTE: 500ms debounce timeout prevents excessive localStorage writes
    saveTimeoutRef.current = setTimeout(() => {
      const storageKey = `cash_counter_${project.id}`
      try {
        const data: StoredCashDataV2 = {
          projectId: project.id,
          version: 3,
          anonymous: currentState.anonymous,
          namedCounts: currentState.namedCounts,
          lastDate: getLocalDateString(),
          currency: currentState.currency,
        }
        localStorage.setItem(storageKey, JSON.stringify(data))
      } catch (err) {
        console.error('Error saving cash counter data:', err)
      }
    }, 500)
  }, [project.id])

  // Handle currency changes - reset denomination state when project currency changes
  useEffect(() => {
    const projectCurrency = project.settings?.currency || 'EUR'
    if (state.currency !== projectCurrency) {
      // Reset state with new currency
      setState(createEmptyState(projectCurrency))
    }
  }, [project.settings?.currency])

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
          setState(createEmptyState(project.settings?.currency || 'EUR'))
          return
        }

        // Check version and migrate if needed
        if ('version' in data && data.version === 2) {
          // V2 format - validate and load directly
          const loadedCurrency = data.currency || 'EUR'  // Default to EUR for V2
          if (typeof data.anonymous === 'object' && data.anonymous !== null &&
            typeof data.namedCounts === 'object' && data.namedCounts !== null) {
            setState({
              anonymous: data.anonymous,
              namedCounts: data.namedCounts,
              currency: loadedCurrency,
            })
          } else {
            // Invalid V2 payload - reset to empty state
            console.error('Invalid V2 payload structure, resetting to empty state')
            setState(createEmptyState(project.settings?.currency || 'EUR'))
          }
        } else if ('version' in data && data.version === 3) {
          // V3 format - validate and load directly
          const loadedCurrency = data.currency || 'EUR'
          const projectCurrency = project.settings?.currency || 'EUR'

          // Only load V3 data if currencies match, otherwise reset to ensure consistency
          if (loadedCurrency !== projectCurrency) {
            console.log('V3 currency mismatch with project settings, resetting to project currency')
            setState(createEmptyState(projectCurrency))
            return
          }

          if (typeof data.anonymous === 'object' && data.anonymous !== null &&
            typeof data.namedCounts === 'object' && data.namedCounts !== null) {
            setState({
              anonymous: data.anonymous,
              namedCounts: data.namedCounts,
              currency: loadedCurrency,
            })
          } else {
            // Invalid V3 payload - reset to empty state
            console.error('Invalid V3 payload structure, resetting to empty state')
            setState(createEmptyState(project.settings?.currency || 'EUR'))
          }
        } else {
          // V1 format - migrate to V3
          const v2Data = migrateV1ToV2(data as StoredCashDataV1)
          const loadedCurrency = 'EUR'  // Default to EUR for V1
          setState({
            anonymous: v2Data.anonymous,
            namedCounts: v2Data.namedCounts,
            currency: loadedCurrency,
          })
          // Save migrated data in V3 format
          const v3Data: StoredCashDataV2 = {
            ...v2Data,
            currency: loadedCurrency,
          }
          localStorage.setItem(storageKey, JSON.stringify(v3Data))
        }
      } else {
        // No localStorage data exists - start fresh
        setState(createEmptyState(project.settings?.currency || 'EUR'))
      }
    } catch (err) {
      console.error('Error loading cash counter data:', err)
      setState(createEmptyState(project.settings?.currency || 'EUR'))
    }
  }, [isOpen, project?.id, project.settings?.currency])

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
      setState(createEmptyState(project.settings?.currency || 'EUR'))
      localStorage.removeItem(`cash_counter_${project.id}`)
    }
  }, [project.id, project.settings?.currency, t])

  const [copySuccess, setCopySuccess] = useState(false)

  // @MX:ANCHOR: Public API for exporting cash counter data as markdown
  // @MX:REASON: User-facing functionality for sharing counts via clipboard
  const handleShare = useCallback(() => {
    const currency = project.settings?.currency || 'EUR'
    const today = getLocalDateString()

    const lines: string[] = []
    lines.push(`## 🧮 ${t('cashCounter.title')} — ${today}`)
    lines.push('')

    // Named column
    const namedTotalLocal = calculateDenominationTotal(state.namedCounts, currency)
    const namedBreakdownLocal = calculateDenominationBreakdown(state.namedCounts, currency)
    const namedHasData = namedTotalLocal > 0

    // Anonymous column
    const anonymousTotalLocal = calculateDenominationTotal(state.anonymous, currency)
    const anonymousBreakdownLocal = calculateDenominationBreakdown(state.anonymous, currency)
    const anonymousHasData = anonymousTotalLocal > 0

    if (namedHasData || anonymousHasData) {
      const denominations = getDenominations(currency)
      // Bills
      const billsWithData = getDenominationsWithData(
        filterDenominationsByType(denominations, 'bill'),
        state.anonymous,
        state.namedCounts
      )
      if (billsWithData.length > 0) {
        lines.push(`### 💵 ${t('cashCounter.bills')}`)
        lines.push(`| ${t('cashCounter.denomination')} | ${t('cashCounter.named')} | ${t('cashCounter.anonymous')} |`)
        lines.push('|---|---|---|')
        for (const d of billsWithData) {
          const nc = state.namedCounts[d.value] || 0
          const ac = state.anonymous[d.value] || 0
          lines.push(`| ${d.label} | ${nc > 0 ? `${nc} × ${currency} ${d.label} = **${currency} ${(nc * d.value).toFixed(2)}**` : '—'} | ${ac > 0 ? `${ac} × ${currency} ${d.label} = **${currency} ${(ac * d.value).toFixed(2)}**` : '—'} |`)
        }
        lines.push('')
      }

      // Coins
      const coinsWithData = getDenominationsWithData(
        filterDenominationsByType(denominations, 'coin'),
        state.anonymous,
        state.namedCounts
      )
      if (coinsWithData.length > 0) {
        lines.push(`### ⚪ ${t('cashCounter.coins')}`)
        lines.push(`| ${t('cashCounter.denomination')} | ${t('cashCounter.named')} | ${t('cashCounter.anonymous')} |`)
        lines.push('|---|---|---|')
        for (const d of coinsWithData) {
          const nc = state.namedCounts[d.value] || 0
          const ac = state.anonymous[d.value] || 0
          lines.push(`| ${d.label} | ${nc > 0 ? `${nc} × ${currency} ${d.label} = **${currency} ${(nc * d.value).toFixed(2)}**` : '—'} | ${ac > 0 ? `${ac} × ${currency} ${d.label} = **${currency} ${(ac * d.value).toFixed(2)}**` : '—'} |`)
        }
        lines.push('')
      }
    }

    // Subtotals
    lines.push('---')
    lines.push(`**${t('cashCounter.namedTotal')}:** ${currency} ${namedTotalLocal.toFixed(2)} (${t('cashCounter.bills')}: ${currency} ${namedBreakdownLocal.bills.toFixed(2)}, ${t('cashCounter.coins')}: ${currency} ${namedBreakdownLocal.coins.toFixed(2)})`)
    lines.push(`**${t('cashCounter.anonymousTotal')}:** ${currency} ${anonymousTotalLocal.toFixed(2)} (${t('cashCounter.bills')}: ${currency} ${anonymousBreakdownLocal.bills.toFixed(2)}, ${t('cashCounter.coins')}: ${currency} ${anonymousBreakdownLocal.coins.toFixed(2)})`)
    lines.push('')

    const grandTotalLocal = namedTotalLocal + anonymousTotalLocal
    const grandBreakdownLocal = {
      bills: namedBreakdownLocal.bills + anonymousBreakdownLocal.bills,
      coins: namedBreakdownLocal.coins + anonymousBreakdownLocal.coins,
    }

    lines.push(`**${t('cashCounter.grandTotal')}:** ${currency} ${grandTotalLocal.toFixed(2)} (${t('cashCounter.bills')}: ${currency} ${grandBreakdownLocal.bills.toFixed(2)}, ${t('cashCounter.coins')}: ${currency} ${grandBreakdownLocal.coins.toFixed(2)})`)
    lines.push(`**${t('cashCounter.transactionsTotal')}:** ${currency} ${totalTransactionsAmount.toFixed(2)}`)
    lines.push('')

    const diff = grandTotalLocal - totalTransactionsAmount
    const absDiff = Math.abs(diff)
    // @MX:NOTE: 0.01 tolerance accounts for floating point precision in currency calculations
    const tolerance = 0.01
    if (absDiff <= tolerance) {
      lines.push(`✅ **${t('cashCounter.match')}** — ${currency} ${absDiff.toFixed(2)}`)
    } else if (diff > 0) {
      lines.push(`⬆️ **${t('cashCounter.excess')}** — ${currency} ${absDiff.toFixed(2)}`)
    } else {
      lines.push(`⬇️ **${t('cashCounter.shortage')}** — ${currency} ${absDiff.toFixed(2)}`)
    }

    const markdown = lines.join('\n')
    navigator.clipboard.writeText(markdown).then(() => {
      setCopySuccess(true)
      // @MX:NOTE: 2000ms success feedback timeout for user visibility
      setTimeout(() => setCopySuccess(false), 2000)
    }).catch(() => {
      // Fallback for environments without navigator.clipboard
      const textarea = document.createElement('textarea')
      textarea.value = markdown
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopySuccess(true)
      // @MX:NOTE: 2000ms success feedback timeout for user visibility
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }, [state, project, totalTransactionsAmount, t])

  // ==================== CALCULATIONS ====================
  const currency = project.settings?.currency || 'EUR'

  const anonymousTotal = calculateDenominationTotal(state.anonymous, currency)
  const anonymousBreakdown = calculateDenominationBreakdown(state.anonymous, currency)

  const namedTotal = calculateDenominationTotal(state.namedCounts, currency)
  const namedBreakdown = calculateDenominationBreakdown(state.namedCounts, currency)

  // Grand total
  const grandTotal = anonymousTotal + namedTotal
  const grandBreakdown = {
    bills: anonymousBreakdown.bills + namedBreakdown.bills,
    coins: anonymousBreakdown.coins + namedBreakdown.coins,
  }

  // Match status
  const getMatchStatus = (): 'match' | 'excess' | 'shortage' => {
    const difference = Math.abs(grandTotal - totalTransactionsAmount)
    // @MX:NOTE: 0.01 tolerance accounts for floating point precision in currency calculations
    const tolerance = 0.01

    if (difference <= tolerance) return 'match'
    if (grandTotal > totalTransactionsAmount) return 'excess'
    return 'shortage'
  }

  // ==================== RENDER ====================

  if (!isOpen) return null

  const matchStatus = getMatchStatus()
  const denominations = getDenominations(currency)
  const bills = filterDenominationsByType(denominations, 'bill')
  const coins = filterDenominationsByType(denominations, 'coin')

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
          {/* Column Headers - Only at top, with boundary boxes */}
          <div className="mb-4">
            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <div className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800/50">
                <div className="text-[10px] font-medium text-blue-700 dark:text-blue-400 text-center">
                  {t('cashCounter.named')}
                </div>
              </div>
              <div className="px-2 py-1 bg-teal-50 dark:bg-teal-900/20 rounded-md border border-teal-200 dark:border-teal-800/50">
                <div className="text-[10px] font-medium text-teal-700 dark:text-teal-400 text-center">
                  {t('cashCounter.anonymous')}
                </div>
              </div>
            </div>
          </div>

          {/* Bills Section */}
          <div className="mb-6">
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
                {formatCurrencyAmount(namedTotal, currency)}
              </div>
            </div>

            <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-md border border-teal-200 dark:border-teal-800/50">
              <div className="text-[10px] font-medium text-teal-700 dark:text-teal-400 mb-1">
                {t('cashCounter.anonymousTotal')}
              </div>
              <div className="text-lg font-bold text-teal-900 dark:text-teal-100">
                {formatCurrencyAmount(anonymousTotal, currency)}
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
                className={`text-3xl font-black dark:text-white ${matchStatus === 'match'
                    ? 'text-green-600 dark:text-green-400'
                    : matchStatus === 'excess'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
              >
                {formatCurrencyAmount(grandTotal, currency)}
              </span>
            </div>

            {/* Grand Total Breakdown - Stacked Labels */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md border border-yellow-200 dark:border-yellow-800/50">
                <div className="text-[9px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  💵 {t('cashCounter.bills')}
                </div>
                <div className="text-base font-bold dark:text-white">
                  {formatCurrencyAmount(grandBreakdown.bills, currency)}
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md border border-gray-200 dark:border-slate-600">
                <div className="text-[9px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  ⚪ {t('cashCounter.coins')}
                </div>
                <div className="text-base font-bold dark:text-white">
                  {formatCurrencyAmount(grandBreakdown.coins, currency)}
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
              className={`flex justify-between items-center p-3 rounded-lg ${matchStatus === 'match'
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
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-6 btn btn-secondary text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              {t('cashCounter.clearAll')}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className={`px-6 btn btn-secondary flex items-center gap-2 transition-colors ${copySuccess
                  ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                  : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'
                }`}
            >
              {copySuccess ? (
                <><span>✓</span> {t('cashCounter.copied')}</>
              ) : (
                <><span>📋</span> {t('cashCounter.share')}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
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
 * Simplified layout: Label at top, inputs with +/- buttons below, totals at bottom
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

  // Calculate running totals for this denomination
  const namedAmount = namedCount * denomination.value
  const anonymousAmount = anonymousCount * denomination.value

  return (
    <div className="mb-4">
      {/* Row 1: Label centered */}
      <div className="text-xs sm:text-sm font-black text-center mb-2">
        {emoji} {denomination.label}
      </div>

      {/* Row 2: Input fields with centered +/- buttons */}
      <div className="grid grid-cols-[1fr_1fr] gap-2 mb-1">
        <DenominationControls
          count={namedCount}
          onChange={(delta) => onNamedChange(denomination.value, delta)}
          onInput={(value) => onNamedInput(denomination.value, value)}
          color="blue"
          increaseLabel={tIncrease}
          decreaseLabel={tDecrease}
          inputLabel={`${t('cashCounter.named')} ${denomination.label}`}
        />
        <DenominationControls
          count={anonymousCount}
          onChange={(delta) => onAnonymousChange(denomination.value, delta)}
          onInput={(value) => onAnonymousInput(denomination.value, value)}
          color="teal"
          increaseLabel={tIncrease}
          decreaseLabel={tDecrease}
          inputLabel={`${t('cashCounter.anonymous')} ${denomination.label}`}
        />
      </div>

      {/* Row 3: Running totals */}
      <div className="grid grid-cols-[1fr_1fr] gap-2 mt-1">
        <div className="text-[9px] font-medium text-blue-600 dark:text-blue-400 text-center">
          {formatCurrencyAmount(namedAmount, currency)}
        </div>
        <div className="text-[9px] font-medium text-teal-600 dark:text-teal-400 text-center">
          {formatCurrencyAmount(anonymousAmount, currency)}
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
  increaseLabel: string
  decreaseLabel: string
  inputLabel: string
}

/**
 * Denomination Controls - Direct input with centered +/- buttons below
 * Input fields have boundary boxes matching the color theme
 */
function DenominationControls({ count, onChange, onInput, color, increaseLabel, decreaseLabel, inputLabel }: DenominationControlsProps) {
  const colorClasses = {
    teal: {
      minus: 'bg-red-500 hover:bg-red-600 disabled:bg-red-300',
      plus: 'bg-green-500 hover:bg-green-600',
      container: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/50',
      input: 'border-gray-300 dark:border-slate-600 focus:ring-teal-500 dark:bg-slate-700 dark:text-white',
    },
    blue: {
      minus: 'bg-red-500 hover:bg-red-600 disabled:bg-red-300',
      plus: 'bg-green-500 hover:bg-green-600',
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50',
      input: 'border-gray-300 dark:border-slate-600 focus:ring-blue-500 dark:bg-slate-700 dark:text-white',
    },
  }

  return (
    <div className="flex flex-col gap-1 items-center">
      <div className={`p-1 rounded-md border ${colorClasses[color].container} w-full`}>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          className={`text-center font-semibold text-sm w-full border rounded focus:outline-none focus:ring-2 py-1 px-1 ${colorClasses[color].input}`}
          value={count > 0 ? count : ''}
          placeholder="0"
          onChange={(e) => onInput(parseInt(e.target.value) || 0)}
          aria-label={inputLabel}
        />
      </div>
      <div className="flex gap-1 items-center w-full justify-center">
        <button
          type="button"
          className={`w-8 h-8 rounded ${colorClasses[color].minus} text-white font-bold text-xs disabled:opacity-30 flex items-center justify-center`}
          onClick={() => onChange(-1)}
          disabled={count === 0}
          aria-label={decreaseLabel}
        >
          −
        </button>
        <button
          type="button"
          className={`w-8 h-8 rounded ${colorClasses[color].plus} text-white font-bold text-xs flex items-center justify-center`}
          onClick={() => onChange(1)}
          aria-label={increaseLabel}
        >
          +
        </button>
      </div>
    </div>
  )
}
