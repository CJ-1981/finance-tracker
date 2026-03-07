---
spec_id: SPEC-DENOM-001
version: "1.0.0"
last_updated: 2026-03-07
status: draft
author: chimin
priority: high
title: Currency-Specific Denominations for Cash Counter Feature
domain: FEATURE
---

# Implementation Plan: SPEC-DENOM-001

## Milestone 1: Currency Denomination Configuration (Priority High)

### Task 1.1: Create Currency Denominations Configuration

**File:** `src/config/currencyDenominations.ts` (new)

**Description:** Define currency-specific denomination configurations with proper values, labels, and types.

**Implementation Details:**
```typescript
import { Denomination } from '../types'

export interface CurrencyDenominations {
  code: string
  name: string
  symbol: string
  flag: string
  emojiBill: string
  emojiCoin: string
  denominations: Denomination[]
}

export const CURRENCY_DENOMINATIONS: Record<string, CurrencyDenominations> = {
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '',
    flag: '🇪🇺',
    emojiBill: '💶',
    emojiCoin: '⚪',
    denominations: [
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
    ],
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    emojiBill: '💵',
    emojiCoin: '⚪',
    denominations: [
      { value: 100, label: '100', type: 'bill' },
      { value: 50, label: '50', type: 'bill' },
      { value: 20, label: '20', type: 'bill' },
      { value: 10, label: '10', type: 'bill' },
      { value: 5, label: '5', type: 'bill' },
      { value: 2, label: '2', type: 'bill' },
      { value: 1, label: '1', type: 'bill' },
      { value: 0.25, label: '0.25', type: 'coin' },
      { value: 0.10, label: '0.10', type: 'coin' },
      { value: 0.05, label: '0.05', type: 'coin' },
      { value: 0.01, label: '0.01', type: 'coin' },
    ],
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    emojiBill: '💷',
    emojiCoin: '⚪',
    denominations: [
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
    ],
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    emojiBill: '💴',
    emojiCoin: '⚪',
    denominations: [
      { value: 10000, label: '10000', type: 'bill' },
      { value: 5000, label: '5000', type: 'bill' },
      { value: 2000, label: '2000', type: 'bill' },
      { value: 1000, label: '1000', type: 'bill' },
      { value: 500, label: '500', type: 'coin' },
      { value: 100, label: '100', type: 'coin' },
      { value: 50, label: '50', type: 'coin' },
      { value: 10, label: '10', type: 'coin' },
      { value: 5, label: '5', type: 'coin' },
      { value: 1, label: '1', type: 'coin' },
    ],
  },
  KRW: {
    code: 'KRW',
    name: 'Korean Won',
    symbol: '',
    flag: '🇰🇷',
    emojiBill: '💴',
    emojiCoin: '⚪',
    denominations: [
      { value: 50000, label: '50000', type: 'bill' },
      { value: 10000, label: '10000', type: 'bill' },
      { value: 5000, label: '5000', type: 'bill' },
      { value: 1000, label: '1000', type: 'bill' },
      { value: 500, label: '500', type: 'coin' },
      { value: 100, label: '100', type: 'coin' },
      { value: 50, label: '50', type: 'coin' },
      { value: 10, label: '10', type: 'coin' },
    ],
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    flag: '🇨🇳',
    emojiBill: '💴',
    emojiCoin: '⚪',
    denominations: [
      { value: 100, label: '100', type: 'bill' },
      { value: 50, label: '50', type: 'bill' },
      { value: 20, label: '20', type: 'bill' },
      { value: 10, label: '10', type: 'bill' },
      { value: 5, label: '5', type: 'bill' },
      { value: 1, label: '1', type: 'bill' },
      { value: 1, label: '1', type: 'coin' },
      { value: 0.50, label: '0.50', type: 'coin' },
      { value: 0.10, label: '0.10', type: 'coin' },
    ],
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    emojiBill: '💵',
    emojiCoin: '⚪',
    denominations: [
      { value: 2000, label: '2000', type: 'bill' },
      { value: 500, label: '500', type: 'bill' },
      { value: 200, label: '200', type: 'bill' },
      { value: 100, label: '100', type: 'bill' },
      { value: 50, label: '50', type: 'bill' },
      { value: 20, label: '20', type: 'bill' },
      { value: 10, label: '10', type: 'bill' },
      { value: 5, label: '5', type: 'bill' },
      { value: 2, label: '2', type: 'coin' },
      { value: 1, label: '1', type: 'coin' },
      { value: 0.50, label: '0.50', type: 'coin' },
      { value: 0.25, label: '0.25', type: 'coin' },
      { value: 0.10, label: '0.10', type: 'coin' },
      { value: 0.05, label: '0.05', type: 'coin' },
    ],
  },
}

export function getDenominations(currencyCode: string): Denomination[] {
  return CURRENCY_DENOMINATIONS[currencyCode]?.denominations || CURRENCY_DENOMINATIONS.EUR.denominations
}

export function getCurrencyInfo(currencyCode: string): CurrencyDenominations {
  return CURRENCY_DENOMINATIONS[currencyCode] || CURRENCY_DENOMINATIONS.EUR
}

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_DENOMINATIONS[currencyCode]?.symbol || ''
}

export function getCurrencyEmoji(currencyCode: string, type: 'bill' | 'coin'): string {
  const currencyInfo = CURRENCY_DENOMINATIONS[currencyCode] || CURRENCY_DENOMINATIONS.EUR
  return type === 'bill' ? currencyInfo.emojiBill : currencyInfo.emojiCoin
}

export function getSupportedCurrencies(): CurrencyDenominations[] {
  return Object.values(CURRENCY_DENOMINATIONS)
}
```

**Acceptance:**
- All 7 currencies defined with correct denominations
- Type definitions exported for use in components
- Fallback to EUR for unknown currencies
- Currency symbols and emojis match real-world usage

---

### Task 1.2: Update Types for Currency Denominations

**File:** `src/types/index.ts`

**Description:** Add type definitions for currency-specific denominations.

**Implementation:**
```typescript
export interface Denomination {
  value: number        // Numeric value for calculations
  label: string         // Display label (e.g., "200", "0.50")
  type: 'bill' | 'coin'  // Bill or coin classification
  currency?: string    // Associated currency code (optional for backwards compatibility)
}

export interface CurrencyDenominations {
  code: string          // ISO 4217 currency code
  name: string          // Full currency name
  symbol: string        // Currency symbol (, $, £, etc.)
  flag: string          // Flag emoji
  emojiBill: string     // Bill emoji
  emojiCoin: string     // Coin emoji
  denominations: Denomination[]  // List of denominations for this currency
}
```

**Acceptance:**
- Types defined and exported
- TypeScript validates correctly
- No conflicts with existing types

---

## Milestone 2: Utility Functions (Priority High)

### Task 2.1: Create Denomination Utility Functions

**File:** `src/utils/denominationUtils.ts` (new)

**Description:** Create utility functions for working with currency-specific denominations.

**Implementation:**
```typescript
import { Denomination, CurrencyDenominations } from '../types'
import { getDenominations, getCurrencyInfo } from '../config/currencyDenominations'

/**
 * Create empty state for all denominations of a currency
 */
export function createEmptyDenominationState(currencyCode: string): Record<number, number> {
  const denominations = getDenominations(currencyCode)
  return denominations.reduce(
    (acc, denom) => ({ ...acc, [denom.value]: 0 }),
    {} as Record<number, number>
  )
}

/**
 * Calculate total from denomination counts
 */
export function calculateDenominationTotal(
  counts: Record<number, number>,
  currencyCode: string
): number {
  const denominations = getDenominations(currencyCode)
  return denominations.reduce(
    (sum, denom) => sum + (counts[denom.value] || 0) * denom.value,
    0
  )
}

/**
 * Calculate bills and coins breakdown
 */
export function calculateDenominationBreakdown(
  counts: Record<number, number>,
  currencyCode: string
): { bills: number; coins: number } {
  const denominations = getDenominations(currencyCode)
  return denominations.reduce(
    (acc, denom) => {
      const amount = (counts[denom.value] || 0) * denom.value
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
 * Get currency symbol with fallback
 */
export function getDisplaySymbol(currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode)
  return info?.symbol || currencyCode
}
```

**Acceptance:**
- Functions handle all currencies correctly
- Fallback behavior works for unknown currencies
- TypeScript types validated
- Functions pure and testable

---

## Milestone 3: Update CashCounterModal (Priority High)

### Task 3.1: Import and Use Currency-Specific Denominations

**File:** `src/components/CashCounterModal.tsx`

**Description:** Replace hardcoded DENOMINATIONS with dynamic currency-specific denominations.

**Changes Required:**
1. Remove hardcoded `DENOMINATIONS` constant (lines 57-76)
2. Import from `currencyDenominations` and `denominationUtils`
3. Replace `createEmptyState` to use currency parameter
4. Update state to store currency code

**Example Changes:**
```typescript
// Remove this:
export const DENOMINATIONS: Array<...> = [...]

// Replace with imports:
import { getDenominations, getCurrencySymbol, getCurrencyEmoji } from '../config/currencyDenominations'
import { createEmptyDenominationState, calculateDenominationTotal } from '../utils/denominationUtils'

// Update interface:
export interface CashCounterState {
  anonymous: Record<number, number>
  namedCounts: Record<number, number>
  currency: string  // NEW: Track currency
}

// Update createEmptyState:
const createEmptyState = (currency: string): CashCounterState => ({
  anonymous: createEmptyDenominationState(currency),
  namedCounts: createEmptyDenominationState(currency),
  currency,
})

// Update usage:
const denominations = getDenominations(state.currency)
const currencySymbol = getCurrencySymbol(state.currency)
```

**Acceptance:**
- Hardcoded denominations removed
- Dynamic denominations based on currency
- State includes currency tracking
- Calculations use currency-specific values

### Task 3.2: Update Currency Handling in CashCounterModal

**File:** `src/components/CashCounterModal.tsx`

**Description:** Ensure currency changes trigger denomination updates.

**Changes Required:**
1. Pass project currency to component
2. Initialize state with project currency
3. Handle currency changes (if project currency updates)
4. Reset denomination counts on currency change

**Implementation:**
```typescript
// Update props:
interface CashCounterModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project
  totalTransactionsAmount: number
  // project.currency determines denominations
}

// Initialize with project currency:
const [state, setState] = useState<CashCounterState>(() =>
  createEmptyState(project.settings?.currency || 'EUR')
)

// Handle currency changes:
useEffect(() => {
  const projectCurrency = project.settings?.currency || 'EUR'
  if (state.currency !== projectCurrency) {
    // Reset state with new currency
    setState(createEmptyState(projectCurrency))
  }
}, [project.settings?.currency])
```

**Acceptance:**
- Currency changes trigger denomination updates
- State reset with new currency's denominations
- No stale data from previous currency

---

## Milestone 4: Update CashCounterPage (Priority High)

### Task 4.1: Import and Use Currency-Specific Denominations

**File:** `src/pages/CashCounterPage.tsx`

**Description:** Replace hardcoded denominations with dynamic currency-specific denominations.

**Changes Required:**
1. Remove hardcoded `DENOMINATIONS` constant (lines 36-55)
2. Remove hardcoded `CURRENCIES` constant (lines 57-65)
3. Import from `currencyDenominations`
4. Update currency selector to use new configuration
5. Update state to use currency-specific denominations

**Example Changes:**
```typescript
// Remove this:
export const DENOMINATIONS: Array<...> = [...]
const CURRENCIES = [...]

// Replace with imports:
import { getDenominations, getCurrencyInfo, getSupportedCurrencies } from '../config/currencyDenominations'
import { createEmptyDenominationState, calculateDenominationTotal, calculateDenominationBreakdown } from '../utils/denominationUtils'

// Update currency selector:
const currencies = getSupportedCurrencies()

// Use in render:
const denominations = getDenominations(config.currency)
```

**Acceptance:**
- Hardcoded denominations removed
- Currency selector uses centralized config
- Denominations update based on selected currency

### Task 4.2: Update localStorage Format (V3)

**File:** `src/pages/CashCounterPage.tsx`

**Description:** Add currency field to localStorage format for currency-specific data persistence.

**Changes Required:**
1. Update `StoredCashData` interface to include currency
2. Update version to 3
3. Add migration logic for V2 to V3
4. Save currency with state

**Implementation:**
```typescript
// Update interface:
interface StoredCashData {
  version: number
  anonymous: Record<number, number>
  namedCounts: Record<number, number>
  lastDate: string
  currency: string  // NEW: Track currency
}

// Add migration:
const migrateV2ToV3 = (v2Data: StoredCashDataV2): StoredCashDataV3 => {
  return {
    ...v2Data,
    version: 3,
    currency: v2Data.currency || 'EUR',  // Default to EUR
  }
}

// Save with currency:
const data: StoredCashData = {
  version: 3,
  anonymous: currentState.anonymous,
  namedCounts: currentState.namedCounts,
  lastDate: getLocalDateString(),
  currency: currentCurrency,
}
```

**Acceptance:**
- V3 format includes currency
- Migration from V2 works correctly
- Existing data preserved during migration

---

## Milestone 5: Testing (Priority Medium)

### Task 5.1: Unit Tests for Currency Configurations

**File:** `src/config/__tests__/currencyDenominations.test.ts` (new)

**Test Cases:**
- All currencies have correct denomination arrays
- Each denomination has valid value, label, and type
- getDenominations() returns correct array for each currency
- getDenominations() returns EUR fallback for unknown currency
- getCurrencySymbol() returns correct symbol
- getCurrencyEmoji() returns correct emoji for bill/coin

**Acceptance:**
- All tests passing
- 100% coverage of configuration file

### Task 5.2: Unit Tests for Utility Functions

**File:** `src/utils/__tests__/denominationUtils.test.ts` (new)

**Test Cases:**
- createEmptyDenominationState() initializes all denominations to 0
- calculateDenominationTotal() correctly sums with currency-specific values
- calculateDenominationBreakdown() correctly separates bills and coins
- Functions work correctly for each currency

**Acceptance:**
- All currency variants tested
- Edge cases handled (unknown currency, empty state)
- 100% coverage of utility functions

### Task 5.3: Integration Tests for Currency Change

**File:** `tests/e2e/cash-counter-currency.spec.ts` (new or extend existing)

**Test Cases:**
- Currency change updates denominations correctly
- Currency change clears denomination counts
- Currency change persists to localStorage
- Currency change displays correct symbols
- Running totals update correctly after currency change

**Acceptance:**
- Each currency tested independently
- Currency transition scenarios verified
- localStorage persistence validated

---

## Risk Analysis

### Risk 1: Breaking Existing Users

**Description:** Existing users with EUR-based data may lose counts if currency changes.

**Mitigation:**
- V3 localStorage format preserves currency
- Migration adds default currency field
- Only reset counts when currency explicitly changes
- Consider preserving data per currency (multi-currency storage)

**Impact:** Medium - Affects existing users with saved data

### Risk 2: Denomination Value Accuracy

**Description:** Hardcoded denomination values may not match exact real-world usage.

**Mitigation:**
- Source values from authoritative references
- Document sources in code comments
- Allow configuration override if needed
- Consider future API integration for live denomination data

**Impact:** Low - Denominations are relatively stable

### Risk 3: Currency Symbol Rendering

**Description:** Currency symbols may not render correctly on all devices/browsers.

**Mitigation:**
- Use standard Unicode symbols
- Test on multiple browsers and devices
- Provide fallback to currency code if symbol not available
- Consider using emoji as secondary indicator

**Impact:** Low - Unicode symbols widely supported

### Risk 4: Performance with Many Denominations

**Description:** Some currencies (INR) have more denominations, potentially affecting performance.

**Mitigation:**
- Use efficient array iteration
- Memoize calculated values
- Consider pagination if denomination count grows significantly

**Impact:** Low - Denomination count remains manageable (<20 items)

---

## Dependencies

### Internal Dependencies
- `src/types/index.ts` - Type definitions (needs extension)
- `src/config/currencyDenominations.ts` - New configuration file
- `src/utils/denominationUtils.ts` - New utility file
- `src/components/CashCounterModal.tsx` - Modal component (needs updates)
- `src/pages/CashCounterPage.tsx` - Standalone page (needs updates)

### External Dependencies
- React 18+ - UI framework
- TypeScript 5+ - Type system
- Tailwind CSS - Styling (no changes required)

---

## Success Metrics

### Code Quality
- Zero TypeScript errors
- Zero ESLint warnings
- 85%+ test coverage for new code
- All acceptance criteria passing

### Functional Completeness
- All 7 currencies display correct denominations
- Currency change works smoothly
- Calculations accurate for each currency
- localStorage migration successful

### User Experience
- Currency change provides clear feedback
- No confusion with denomination mismatch
- Running totals update in real-time
- Visual indicators distinguish bills from coins

---

## Definition of Done

A task is considered complete when:
1. Code is written and committed
2. Unit tests are written and passing
3. Integration tests verify currency changes
4. Code review completed (if applicable)
5. No regressions in existing functionality
6. Acceptance criteria verified

The SPEC is considered complete when:
1. All milestones completed
2. All test suites passing
3. All acceptance criteria passing
4. Coverage meets 85% threshold
5. No TypeScript or lint errors
6. Documentation updated (if applicable)
