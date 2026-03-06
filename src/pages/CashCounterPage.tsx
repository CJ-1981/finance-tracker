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

// ==================== CONSTANTS ====================

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

const CURRENCIES = [
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'KRW', name: 'Korean Won', flag: '🇰🇷' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
]

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }
]

// ==================== UTILITY FUNCTIONS ====================

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

const getLocalDateString = (): string => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const calculateTotal = (denominations: Record<number, number>): number => {
  return DENOMINATIONS.reduce((sum, denom) => {
    return sum + (denominations[denom.value] || 0) * denom.value
  }, 0)
}

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

const createEmptyState = (): CashCounterState => ({
  anonymous: DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {} as Record<number, number>),
  namedCounts: DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {} as Record<number, number>),
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

  const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]

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
        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{currency}</span>
      </button>

      {isCurrencyOpen && (
        <>
          <div className="fixed inset-0 z-[199]" onClick={() => setCurrencyOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 min-w-max bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-[200] overflow-hidden max-h-60 overflow-y-auto">
            {CURRENCIES.map((c) => (
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
  const [state, setState] = useState<CashCounterState>(createEmptyState)
  const [config, setConfig] = useState<Config>({ currency: 'EUR', targetAmount: 0 })
  const [copySuccess, setCopySuccess] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Refs for localStorage save optimization
  const isInitialRender = useRef(true)
  const previousStateRef = useRef<CashCounterState>(createEmptyState())

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

  // Save config to localStorage
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
          setState(createEmptyState())
          return
        }

        // Load state
        if (typeof data.anonymous === 'object' && data.anonymous !== null &&
          typeof data.namedCounts === 'object' && data.namedCounts !== null) {
          setState({
            anonymous: data.anonymous,
            namedCounts: data.namedCounts,
          })
          if (data.currency) {
            // Update currency separately without triggering data reload
            setConfig(prev => ({ ...prev, currency: data.currency }))
          }
        }
      }
    } catch (err) {
      console.error('Error loading cash counter data:', err)
    }
  }, [])

  // Save state changes to localStorage (debounced)
  const saveToLocalStorage = useCallback((currentState: CashCounterState, currentCurrency: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      const storageKey = 'cashcounter_standalone'
      try {
        const data: StoredCashData = {
          version: 1,
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

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [state, config.currency, saveToLocalStorage])

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
      setState(createEmptyState())
      localStorage.removeItem('cashcounter_standalone')
      saveConfig({ ...config, targetAmount: 0 })
    }
  }, [t, config, saveConfig])

  const handleShare = useCallback(() => {
    const currency = config.currency
    const today = getLocalDateString()

    const lines: string[] = []
    lines.push(`## 🧮 ${t('cashCounter.title')} — ${today}`)
    lines.push('')

    const namedTotalLocal = calculateTotal(state.namedCounts)
    const namedBreakdownLocal = calculateBreakdown(state.namedCounts)
    const namedHasData = namedTotalLocal > 0

    const anonymousTotalLocal = calculateTotal(state.anonymous)
    const anonymousBreakdownLocal = calculateBreakdown(state.anonymous)
    const anonymousHasData = anonymousTotalLocal > 0

    if (namedHasData || anonymousHasData) {
      const billsWithData = DENOMINATIONS.filter(
        d => d.type === 'bill' && ((state.namedCounts[d.value] || 0) > 0 || (state.anonymous[d.value] || 0) > 0)
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

      const coinsWithData = DENOMINATIONS.filter(
        d => d.type === 'coin' && ((state.namedCounts[d.value] || 0) > 0 || (state.anonymous[d.value] || 0) > 0)
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
      setTimeout(() => setCopySuccess(false), 2000)
    }).catch(() => {
      const textarea = document.createElement('textarea')
      textarea.value = markdown
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }, [state, config, t])

  // Calculations
  const anonymousTotal = calculateTotal(state.anonymous)
  const anonymousBreakdown = calculateBreakdown(state.anonymous)

  const namedTotal = calculateTotal(state.namedCounts)
  const namedBreakdown = calculateBreakdown(state.namedCounts)

  const grandTotal = anonymousTotal + namedTotal
  const grandBreakdown = {
    bills: anonymousBreakdown.bills + namedBreakdown.bills,
    coins: anonymousBreakdown.coins + namedBreakdown.coins,
  }

  const getMatchStatus = (): 'match' | 'excess' | 'shortage' | 'none' => {
    if (config.targetAmount === 0) return 'none'
    const difference = Math.abs(grandTotal - config.targetAmount)
    const tolerance = 0.01
    if (difference <= tolerance) return 'match'
    if (grandTotal > config.targetAmount) return 'excess'
    return 'shortage'
  }

  const bills = DENOMINATIONS.filter(d => d.type === 'bill')
  const coins = DENOMINATIONS.filter(d => d.type === 'coin')
  const currency = config.currency
  const matchStatus = getMatchStatus()

  // Denomination Row Component
  function DenominationRow({ denomination }: { denomination: typeof DENOMINATIONS[0] }) {
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
            {currency} {(namedCount * denomination.value).toFixed(2)}
          </div>
          <div className="text-[9px] font-medium text-teal-600 dark:text-teal-400 text-center">
            {currency} {(anonymousCount * denomination.value).toFixed(2)}
          </div>
        </div>
      </div>
    )
  }

  function DenominationControls({ count, onChange, onInput, color }: { count: number; onChange: (delta: number) => void; onInput: (value: number) => void; color: 'teal' | 'blue' }) {
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
            value={count}
            onChange={(e) => onInput(parseInt(e.target.value) || 0)}
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
              onCurrencyChange={(c) => saveConfig({ ...config, currency: c })}
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
            <DenominationRow key={denom.value} denomination={denom} />
          ))}
        </div>

        {/* Coins Section */}
        <div className="mb-6">
          {coins.map((denom) => (
            <DenominationRow key={denom.value} denomination={denom} />
          ))}
        </div>

        {/* Section Totals */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
              {t('cashCounter.namedTotal')}
            </div>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {currency} {namedTotal.toFixed(2)}
            </div>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800/50">
            <div className="text-xs font-medium text-teal-700 dark:text-teal-400 mb-1">
              {t('cashCounter.anonymousTotal')}
            </div>
            <div className="text-xl font-bold text-teal-900 dark:text-teal-100">
              {currency} {anonymousTotal.toFixed(2)}
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
            >
              {currency} {grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Grand Total Breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                💵 {t('cashCounter.bills')}
              </div>
              <div className="text-lg font-bold dark:text-white">
                {currency} {grandBreakdown.bills.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-700 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                ⚪ {t('cashCounter.coins')}
              </div>
              <div className="text-lg font-bold dark:text-white">
                {currency} {grandBreakdown.coins.toFixed(2)}
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
                  {currency} {config.targetAmount.toFixed(2)}
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
                  {currency} {Math.abs(grandTotal - config.targetAmount).toFixed(2)}
                </span>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-6 py-2 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
            >
              {t('cashCounter.clearAll')}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium ${copySuccess
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
    </div>
  )
}
