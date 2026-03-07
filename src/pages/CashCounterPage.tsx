/**
 * @MX:NOTE: Standalone Cash Counter Page (public route, no auth required)
 *
 * Features:
 * - Accessible without authentication at /cashcounter route
 * - Language selector included
 * - Cash counter as main content (not modal)
 * - LocalStorage persistence
 * - Configurable currency
 */
// @MX:TODO: No test file exists - CashCounterPage.test.tsx or CashCounterPage.spec.tsx needed
// @MX:PRIORITY: High - Public route component requires test coverage

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'

// ==================== TYPES & INTERFACES ====================

interface StoredCashData {
  version: number
  anonymous: Record<number, number>
  namedCounts: Record<number, number>
  lastDate: string
  currency: string
}

interface CashCounterState {
  anonymous: Record<number, number>
  namedCounts: Record<number, number>
}

interface Config {
  currency: string
  targetAmount: number
}

interface CurrencyChangeState {
  showCurrencyConfirm: boolean
  pendingCurrency: string | null
}

// ==================== IMPORTS ====================

import {
  getDenominations,
  getCurrencyInfo,
  getCurrencyEmoji,
  getSupportedCurrencies,
} from '../config/currencyDenominations'
import {
  createEmptyDenominationState,
  calculateDenominationTotal,
  calculateDenominationBreakdown,
  filterDenominationsByType,
  getDenominationsWithData,
  formatCurrencyAmount,
} from '../utils/denominationUtils'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }
]

// ==================== UTILITY FUNCTIONS ====================

const getLocalDateString = (): string => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const createEmptyState = (currency: string): CashCounterState => ({
  anonymous: createEmptyDenominationState(currency),
  namedCounts: createEmptyDenominationState(currency),
})

// ==================== LANGUAGE SELECTOR COMPONENT ====================

function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isLanguageOpen, setLanguageOpen] = useState(false)

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setLanguageOpen(false)
  }

  const getCurrentLanguageCode = () => {
    const lang = i18n.language || 'en'
    return lang.split('-')[0]
  }

  const currentLangCode = getCurrentLanguageCode()
  const currentLanguage = LANGUAGES.find(l => l.code === currentLangCode) || LANGUAGES[0]

  const toggleDropdown = () => setLanguageOpen(!isLanguageOpen)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLanguageOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleDropdown()
    }
  }

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-expanded={isLanguageOpen}
        aria-haspopup="true"
      >
        <span className="text-xl leading-none">{currentLanguage.flag}</span>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {currentLanguage.name}
        </span>
      </button>

      {isLanguageOpen && (
        <>
          <div
            className="fixed inset-0 z-[199]"
            onClick={() => setLanguageOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 min-w-max bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-[200] overflow-hidden">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${currentLangCode === language.code ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'
                  }`}
              >
                <span className="text-xl leading-none">{language.flag}</span>
                <span className="font-medium whitespace-nowrap">{language.name}</span>
                {currentLangCode === language.code && (
                  <span className="ml-4 text-primary-600 dark:text-primary-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ==================== CURRENCY SELECTOR COMPONENT ====================

function CurrencySelector({ currency, onCurrencyChange }: { currency: string; onCurrencyChange: (currency: string) => void }) {
  const [isCurrencyOpen, setCurrencyOpen] = useState(false)

  const toggleDropdown = () => setCurrencyOpen(!isCurrencyOpen)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCurrencyOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleDropdown()
    }
  }

  const currentCurrency = getCurrencyInfo(currency)

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-expanded={isCurrencyOpen}
        aria-haspopup="true"
      >
        <span className="text-xl">{currentCurrency.flag}</span>
        <span className="text-sm font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">{currentCurrency.name}</span>
      </button>

      {isCurrencyOpen && (
        <>
          <div className="fixed inset-0 z-[199]" onClick={() => setCurrencyOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 min-w-max bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-[200] overflow-hidden max-h-60 overflow-y-auto">
            {getSupportedCurrencies().map((c) => (
              <button
                key={c.code}
                onClick={() => { onCurrencyChange(c.code); setCurrencyOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${currency === c.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
                  }`}
              >
                <span className="text-xl">{c.flag}</span>
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">{c.code}</span>
                {currency === c.code && <span className="ml-2 text-blue-600 dark:text-blue-400">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ==================== MAIN PAGE COMPONENT ====================

export default function CashCounterPage() {
  const { t } = useTranslation()

  // State
  const [state, setState] = useState<CashCounterState>(() => createEmptyState('EUR'))
  const [currencyChange, setCurrencyChange] = useState<CurrencyChangeState>({
    showCurrencyConfirm: false,
    pendingCurrency: null
  })
  const [config, setConfig] = useState<Config>({ currency: 'EUR', targetAmount: 0 })
  const [copySuccess, setCopySuccess] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Refs for localStorage save optimization
  const isInitialRender = useRef(true)
  const previousStateRef = useRef<CashCounterState>(createEmptyState('EUR'))

  // Load config from localStorage (run once)
  useEffect(() => {
    const storedConfig = localStorage.getItem('cashcounter_config')
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig)
        setConfig(parsed)
      } catch (err) {
        console.error('Error loading config:', err)
      }
    }
  }, [])

  // @MX:ANCHOR: Config state management with localStorage persistence
  // @MX:REASON: Called from 8+ locations - critical config management across component lifecycle
  const saveConfig = useCallback((newConfig: Config | ((prev: Config) => Config)) => {
    setConfig(prevConfig => {
      const updatedConfig = typeof newConfig === 'function' ? newConfig(prevConfig) : newConfig
      localStorage.setItem('cashcounter_config', JSON.stringify(updatedConfig))
      return updatedConfig
    })
  }, [])

  // Load data from localStorage (run once after component mount)
  useEffect(() => {
    const storageKey = 'cashcounter_standalone'
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data: StoredCashData = JSON.parse(stored)

        // Check if date has changed
        const today = getLocalDateString()
        if (data.lastDate !== today) {
          localStorage.removeItem(storageKey)
          setState(createEmptyState('EUR'))
          return
        }

        // Check version and migrate if needed
        if (data.version === 3) {
          // V3 format - validate and load directly
          if (typeof data.anonymous === 'object' && data.anonymous !== null &&
            typeof data.namedCounts === 'object' && data.namedCounts !== null) {
            const loadedCurrency = data.currency || 'EUR'
            setState({
              anonymous: data.anonymous,
              namedCounts: data.namedCounts,
            })
            setConfig(prev => ({ ...prev, currency: loadedCurrency }))
          } else {
            // Invalid V3 payload - reset to empty state
            console.error('Invalid V3 payload structure, resetting to empty state')
            setState(createEmptyState('EUR'))
          }
        } else if (data.version === 2) {
          // V2 format - migrate to V3
          console.log('Migrating V2 to V3 format')
          const loadedCurrency = 'EUR' // Default to EUR for V2 data
          setState({
            anonymous: data.anonymous,
            namedCounts: data.namedCounts,
          })
          setConfig(prev => ({ ...prev, currency: loadedCurrency }))
          // Save in V3 format immediately
          const v3Data: StoredCashData = {
            version: 3,
            anonymous: data.anonymous,
            namedCounts: data.namedCounts,
            lastDate: data.lastDate,
            currency: loadedCurrency,
          }
          localStorage.setItem(storageKey, JSON.stringify(v3Data))
        } else {
          // V1 or unknown format - reset
          console.log('Unknown or legacy format, resetting to empty state')
          setState(createEmptyState('EUR'))
          return // Early return to avoid unnecessary state updates when V3 branch already handled
        }
        if (typeof data.anonymous === 'object' && data.anonymous !== null &&
          typeof data.namedCounts === 'object' && data.namedCounts !== null) {
          const loadedCurrency = data.currency || 'EUR'
          setState({
            anonymous: data.anonymous,
            namedCounts: data.namedCounts,
          })
          // Update currency separately without triggering data reload
          setConfig(prev => ({ ...prev, currency: loadedCurrency }))
        }
      }
    } catch (err) {
      console.error('Error loading cash counter data:', err)
    }
  }, [])

  // Handle currency change - reset denomination state when currency changes
  useEffect(() => {
    const currentConfigCurrency = config.currency
    setState(prev => {
      // Only reset if currency actually changed
      const denominations = getDenominations(currentConfigCurrency)
      const currentDenominationValues = Object.keys(prev.anonymous).map(Number)

      // Check if denomination SETS match - catches all currency changes including subset changes
      const newDenominationValues = denominations.map(d => d.value)
      const needsReset = JSON.stringify([...newDenominationValues].sort()) !== JSON.stringify([...currentDenominationValues].sort())

      if (needsReset) {
        return createEmptyState(currentConfigCurrency)
      }
      return prev
    })
  }, [config.currency])

  // Save state changes to localStorage (debounced)
  const saveToLocalStorage = useCallback((currentState: CashCounterState, currentCurrency: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // @MX:NOTE: 500ms debounce timeout prevents excessive localStorage writes
    saveTimeoutRef.current = setTimeout(() => {
      const storageKey = 'cashcounter_standalone'
      try {
        const data: StoredCashData = {
          version: 3,
          anonymous: currentState.anonymous,
          namedCounts: currentState.namedCounts,
          lastDate: getLocalDateString(),
          currency: currentCurrency,
        }
        localStorage.setItem(storageKey, JSON.stringify(data))
      } catch (err) {
        console.error('Error saving cash counter data:', err)
      }
    }, 500)
  }, [])

  // Only save when state actually changes (prevent excessive saves)
  useEffect(() => {
    // Skip initial render to prevent unnecessary save on mount
    if (isInitialRender.current) {
      isInitialRender.current = false
      previousStateRef.current = state
      return
    }

    // Check if state actually changed
    const hasStateChanged = JSON.stringify(state) !== JSON.stringify(previousStateRef.current)
    if (hasStateChanged) {
      saveToLocalStorage(state, config.currency)
      previousStateRef.current = state
    }
  }, [state, config.currency, saveToLocalStorage])

  // Cleanup on unmount - ensure pending saves are completed
  useEffect(() => {
    return () => {
      // @MX:NOTE: Flush pending save on component unmount to prevent data loss
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        // Save the most recent state immediately
        const storageKey = 'cashcounter_standalone'
        try {
          const data: StoredCashData = {
            version: 3,
            anonymous: previousStateRef.current.anonymous,
            namedCounts: previousStateRef.current.namedCounts,
            lastDate: getLocalDateString(),
            currency: config.currency,
          }
          localStorage.setItem(storageKey, JSON.stringify(data))
        } catch (err) {
          console.error('Error flushing cash counter data on unmount:', err)
        }
        saveTimeoutRef.current = undefined
      }
    }
  }, [config.currency])

  // Handlers
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
      setState(createEmptyState(config.currency))
      localStorage.removeItem('cashcounter_standalone')
      saveConfig({ ...config, targetAmount: 0 })
    }
  }, [t, config, saveConfig])

  const isStateEmpty = useCallback((stateToCheck: CashCounterState): boolean => {
    const totalAnonymous = Object.values(stateToCheck.anonymous).reduce((sum, count) => sum + count, 0)
    const totalNamed = Object.values(stateToCheck.namedCounts).reduce((sum, count) => sum + count, 0)
    return totalAnonymous === 0 && totalNamed === 0
  }, [])

  // @MX:ANCHOR: Public API for currency changes with confirmation dialog
  // @MX:REASON: Called from CurrencySelector - user-facing critical functionality
  const handleCurrencyChangeRequest = useCallback((newCurrency: string) => {
    if (isStateEmpty(state)) {
      // State is empty, proceed with currency change
      saveConfig({ ...config, currency: newCurrency })
    } else {
      // State has data, show confirmation dialog
      setCurrencyChange({
        showCurrencyConfirm: true,
        pendingCurrency: newCurrency
      })
    }
  }, [state, config, saveConfig, isStateEmpty])

  const handleCurrencyChangeConfirm = useCallback(() => {
    if (currencyChange.pendingCurrency) {
      saveConfig({ ...config, currency: currencyChange.pendingCurrency })
      setCurrencyChange({
        showCurrencyConfirm: false,
        pendingCurrency: null
      })
    }
  }, [config, currencyChange.pendingCurrency, saveConfig])

  const handleCurrencyChangeCancel = useCallback(() => {
    setCurrencyChange({
      showCurrencyConfirm: false,
      pendingCurrency: null
    })
  }, [])

  // @MX:ANCHOR: Public API for exporting cash counter data as markdown
  // @MX:REASON: User-facing functionality for sharing counts via clipboard
  const handleShare = useCallback(() => {
    const currency = config.currency
    const today = getLocalDateString()

    const lines: string[] = []
    lines.push(`## 🧮 ${t('cashCounter.title')} — ${today}`)
    lines.push('')

    const namedTotalLocal = calculateDenominationTotal(state.namedCounts, config.currency)
    const namedBreakdownLocal = calculateDenominationBreakdown(state.namedCounts, config.currency)
    const namedHasData = namedTotalLocal > 0

    const anonymousTotalLocal = calculateDenominationTotal(state.anonymous, config.currency)
    const anonymousBreakdownLocal = calculateDenominationBreakdown(state.anonymous, config.currency)
    const anonymousHasData = anonymousTotalLocal > 0

    if (namedHasData || anonymousHasData) {
      const denominations = getDenominations(config.currency)
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

    if (config.targetAmount > 0) {
      lines.push(`**${t('cashCounter.transactionsTotal')}:** ${currency} ${config.targetAmount.toFixed(2)}`)
      lines.push('')

      const diff = grandTotalLocal - config.targetAmount
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
    }

    const markdown = lines.join('\n')
    navigator.clipboard.writeText(markdown).then(() => {
      setCopySuccess(true)
      // @MX:NOTE: 2000ms success feedback timeout for user visibility
      setTimeout(() => setCopySuccess(false), 2000)
    }).catch(() => {
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
  }, [state, config, t])

  // Calculations
  const anonymousTotal = calculateDenominationTotal(state.anonymous, config.currency)
  const anonymousBreakdown = calculateDenominationBreakdown(state.anonymous, config.currency)

  const namedTotal = calculateDenominationTotal(state.namedCounts, config.currency)
  const namedBreakdown = calculateDenominationBreakdown(state.namedCounts, config.currency)

  const grandTotal = anonymousTotal + namedTotal
  const grandBreakdown = {
    bills: anonymousBreakdown.bills + namedBreakdown.bills,
    coins: anonymousBreakdown.coins + namedBreakdown.coins,
  }

  const getMatchStatus = (): 'match' | 'excess' | 'shortage' | 'none' => {
    if (config.targetAmount === 0) return 'none'
    const difference = Math.abs(grandTotal - config.targetAmount)
    // @MX:NOTE: 0.01 tolerance accounts for floating point precision in currency calculations
    const tolerance = 0.01
    if (difference <= tolerance) return 'match'
    if (grandTotal > config.targetAmount) return 'excess'
    return 'shortage'
  }

  const denominations = getDenominations(config.currency)
  const bills = filterDenominationsByType(denominations, 'bill')
  const coins = filterDenominationsByType(denominations, 'coin')
  const currency = config.currency
  const matchStatus = getMatchStatus()

  // Denomination Row Component
  function DenominationRow(props: { denomination: { value: number; label: string; type: 'bill' | 'coin' }; currency: string }) {
    const { denomination, currency } = props
    const emoji = getCurrencyEmoji(currency, denomination.type)
    const namedCount = state.namedCounts[denomination.value] || 0
    const anonymousCount = state.anonymous[denomination.value] || 0

    return (
      <div className="mb-4">
        <div className="text-xs sm:text-sm font-black text-center mb-2">
          {emoji} {denomination.label}
        </div>
        <div className="grid grid-cols-[1fr_1fr] gap-2 mb-1">
          <DenominationControls
            count={namedCount}
            onChange={(delta) => handleNamedCountChange(denomination.value, delta)}
            onInput={(value) => handleNamedDirectInput(denomination.value, value)}
            color="blue"
          />
          <DenominationControls
            count={anonymousCount}
            onChange={(delta) => handleAnonymousCountChange(denomination.value, delta)}
            onInput={(value) => handleAnonymousDirectInput(denomination.value, value)}
            color="teal"
          />
        </div>
        <div className="grid grid-cols-[1fr_1fr] gap-2 mt-1">
          <div className="text-[9px] font-medium text-blue-600 dark:text-blue-400 text-center">
            {formatCurrencyAmount(namedCount * props.denomination.value, currency)}
          </div>
          <div className="text-[9px] font-medium text-teal-600 dark:text-teal-400 text-center">
            {formatCurrencyAmount(anonymousCount * props.denomination.value, currency)}
          </div>
        </div>
      </div>
    )
  }

  function DenominationControls({ count, onChange, onInput, color, label }: { count: number; onChange: (delta: number) => void; onInput: (value: number) => void; color: 'teal' | 'blue'; label?: string }) {
    // Local state for input value to prevent focus loss on each keystroke
    const [inputValue, setInputValue] = useState(count.toString())
    
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

    // Sync local input value with parent count when it changes from outside
    useEffect(() => {
      setInputValue(count.toString())
    }, [count])

    return (
      <div className="flex flex-col gap-1 items-center">
        <div className={`p-1 rounded-md border ${colorClasses[color].container} w-full`}>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            // @MX:NOTE: 999 max value prevents overflow and limits input to reasonable denomination counts
            max="999"
            id={label ? `denomination-${label}-${color}` : `denomination-${color}`}
            name={label ? `denomination-${label}-${color}` : `denomination-${color}`}
            className={`text-center font-semibold text-sm w-full border rounded focus:outline-none focus:ring-2 py-1 px-2 ${colorClasses[color].input}`}
            value={inputValue === '' ? '' : inputValue}
            placeholder="0"
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={() => onInput(parseInt(inputValue) || 0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onInput(parseInt(inputValue) || 0)
                e.currentTarget.blur()
              }
            }}
          />
        </div>
        <div className="flex gap-1 items-center w-full justify-center">
          <button
            type="button"
            className={`w-8 h-8 rounded ${colorClasses[color].minus} text-white font-bold text-xs disabled:opacity-30 flex items-center justify-center`}
            onClick={() => onChange(-1)}
            disabled={count === 0}
          >
            −
          </button>
          <button
            type="button"
            className={`w-8 h-8 rounded ${colorClasses[color].plus} text-white font-bold text-xs flex items-center justify-center`}
            onClick={() => onChange(1)}
          >
            +
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-2xl">🧮</span>
              <span className="hidden sm:inline">{t('cashCounter.title')}</span>
            </h1>
            <CurrencySelector
              currency={currency}
              onCurrencyChange={handleCurrencyChangeRequest}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Settings"
            >
              <span className="text-2xl">⚙️</span>
            </button>
            <LanguageSelector />
          </div>
        </div>

        {/* Settings Panel */}
        {showConfig && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="max-w-4xl mx-auto">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Target Amount (optional, for comparison)
              </label>
              <div className="flex gap-2 items-center">
                <span className="text-slate-500 dark:text-slate-400">{currency}</span>
                <input
                  id="target-amount"
                  name="target-amount"
                  inputMode="decimal"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={config.targetAmount === 0 ? '' : config.targetAmount}
                  onChange={(e) => {
                    const value = e.target.value.trim()
                    const numValue = value === '' ? 0 : parseFloat(value)
                    saveConfig(prev => ({ ...prev, targetAmount: isNaN(numValue) ? 0 : numValue }))
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Column Headers */}
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
            <DenominationRow key={denom.value} denomination={denom} currency={config.currency} />
          ))}
        </div>

        {/* Coins Section */}
        <div className="mb-6">
          {coins.map((denom) => (
            <DenominationRow key={denom.value} denomination={denom} currency={config.currency} />
          ))}
        </div>

        {/* Section Totals */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50 text-center">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
              {t('cashCounter.namedTotal')}
            </div>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrencyAmount(namedTotal, currency)}
            </div>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800/50 text-center">
            <div className="text-xs font-medium text-teal-700 dark:text-teal-400 mb-1">
              {t('cashCounter.anonymousTotal')}
            </div>
            <div className="text-xl font-bold text-teal-900 dark:text-teal-100">
              {formatCurrencyAmount(anonymousTotal, currency)}
            </div>
          </div>
        </div>

        {/* Grand Total & Match Status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t('cashCounter.grandTotal')}:
            </span>
            <span
              className={`text-4xl font-black dark:text-white ${matchStatus === 'match'
                  ? 'text-green-600 dark:text-green-400'
                  : matchStatus === 'excess'
                    ? 'text-blue-600 dark:text-blue-400'
                    : matchStatus === 'shortage'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-900 dark:text-slate-100'
                }`}
              style={{
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            >
              {formatCurrencyAmount(grandTotal, currency)}
            </span>
          </div>

          {/* Grand Total Breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 rounded-lg border border-yellow-200 dark:border-yellow-800/50 text-center">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                💵 {t('cashCounter.bills')}
              </div>
              <div className="text-lg font-bold dark:text-white">
                {formatCurrencyAmount(grandBreakdown.bills, currency)}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-700 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 text-center">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                ⚪ {t('cashCounter.coins')}
              </div>
              <div className="text-lg font-bold dark:text-white">
                {formatCurrencyAmount(grandBreakdown.coins, currency)}
              </div>
            </div>
          </div>

          {/* Target Amount */}
          {config.targetAmount > 0 && (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Target:
                </span>
                <span className="text-xl font-semibold text-slate-600 dark:text-slate-400">
                  {formatCurrencyAmount(config.targetAmount, currency)}
                </span>
              </div>

              {/* Difference */}
              <div
                className={`flex justify-between items-center p-4 rounded-lg ${matchStatus === 'match'
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
                <span className="font-bold text-xl dark:text-white">
                  {formatCurrencyAmount(Math.abs(grandTotal - config.targetAmount), currency)}
                </span>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-6 py-2 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium whitespace-nowrap"
            >
              {t('cashCounter.clearAll')}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium whitespace-nowrap ${copySuccess
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/30'
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
      </main>

      {/* Currency Change Confirmation Modal */}
      {currencyChange.showCurrencyConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[298]"
            onClick={handleCurrencyChangeCancel}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[299] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span>⚠️</span>
                <span>Confirm Currency Change</span>
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-6">
                You have denomination counts in the current currency. Changing currency will reset all denomination counts to zero.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCurrencyChangeCancel}
                  className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCurrencyChangeConfirm}
                  className="px-4 py-2 rounded-lg bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white transition-colors font-medium"
                >
                  Change Currency & Reset
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
