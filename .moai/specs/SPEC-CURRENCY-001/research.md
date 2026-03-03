# Codebase Research: Currency Filtering Feature

**Issue:** #17 - Currency filtering for transaction calculations
**Research Date:** 2026-03-03

---

## Executive Summary

Current implementation includes all transactions in calculations regardless of currency. No visual indicators exist for currency mismatches. This research documents the codebase structure and provides recommendations for implementing currency filtering with visual indicators.

---

## 1. Current Calculation Logic

### ProjectDetailPage.tsx

**Location:** `src/pages/ProjectDetailPage.tsx`

**Line 796:** Total spent calculation
```typescript
const totalSpent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
```

**Line 1328:** CashCounterModal total amount
```typescript
totalTransactionsAmount={filteredTransactions.reduce((sum, t) => sum + t.amount, 0)}
```

**Line 611:** Filtered transactions source
- `getFilteredTransactions()` only applies date-based filtering
- No currency filtering implemented

**Key Finding:** All transaction calculations aggregate amounts without currency validation.

---

## 2. Transaction List Display

### TransactionsPage.tsx

**Location:** `src/pages/TransactionsPage.tsx`

**Lines 1662-1725:** Transaction table structure
- Displays transaction data in table format
- Shows currency_code column (line 1687): `{transaction.currency_code || 'USD'}`

**Lines 1689-1693:** Amount styling
```typescript
className={
  transaction.amount < 0
    ? 'text-rose-600 font-semibold'
    : 'text-emerald-600 font-semibold'
}
```

**Key Finding:** Transaction list displays currency but has no visual highlighting for mismatches.

---

## 3. Type Definitions

### src/types/index.ts

**Project Type:**
```typescript
settings?: {
  currency: string  // Project default currency (e.g., 'USD')
  date_format: string
  notifications_enabled: boolean
  // ...
}
```

**Transaction Type:**
```typescript
interface Transaction {
  id: string
  project_id: string
  amount: number
  currency_code: string  // Transaction-specific currency
  // ...
}
```

**Key Finding:** Both currency fields exist in the schema but no filtering logic connects them.

---

## 4. Existing UI Patterns

### Visual Indicators

**Yellow/Warning Theme:**
- `bg-yellow-50`, `border-yellow-200` - Used in CashCounterModal
- Yellow pulsing dots - Debug panel indicators
- `text-yellow-600`, `text-yellow-700` - Warning text styles

**Status Colors:**
- Rose (red) for negative amounts
- Emerald (green) for positive amounts
- Gray for neutral/missing data

### Tooltip Implementations

**Chart.js Tooltips:**
- Configured in Chart component setup
- Not reusable for transaction list

**HTML Title Attributes:**
- Basic tooltips available via `title` attribute
- No advanced tooltip components in transaction list

**Key Finding:** Yellow theme exists for warnings but no component-level tooltip system.

---

## 5. Key Integration Points

### Components to Modify

1. **ProjectDetailPage.tsx**
   - Modify `totalSpent` calculation
   - Update CashCounterModal amount prop
   - Filter chart data if needed

2. **TransactionsPage.tsx**
   - Add visual highlighting for mismatched currencies
   - Implement tooltip component
   - Update transaction row styling

3. **Utility Function (New)**
   - Create `isTransactionIncludedInCalculation()` helper
   - Returns boolean based on currency match
   - Reusable across components

---

## 6. Reference Implementations

### Existing Filtering Pattern

**getFilteredTransactions() function:**
- Centralized filtering logic
- Returns filtered array based on multiple criteria
- Good template for adding currency filtering

### Conditional Styling Pattern

**Amount display:**
```typescript
className={condition ? 'style-1' : 'style-2'}
```
- Can extend this pattern for currency highlighting
- Add third state for currency mismatch

---

## 7. Implementation Recommendations

### Backend Logic

1. **Create Utility Function:**
   ```typescript
   shouldIncludeTransaction(transaction: Transaction, projectCurrency: string): boolean {
     return transaction.currency_code === projectCurrency;
   }
   ```

2. **Update Calculations:**
   - Filter transactions before reduce operations
   - Use utility function for consistency
   - Update all calculation points

### Frontend Visual Indicators

1. **Transaction Row Styling:**
   - Add `bg-yellow-50` for excluded transactions
   - Use `border-yellow-200` for row borders
   - Add opacity reduction for muted effect

2. **Tooltip Implementation:**
   - Use `title` attribute for simple tooltip
   - Text: "⚠️ Excluded from calculations - currency mismatch"
   - Position on currency code cell

3. **Icon Indicator:**
   - Add exclamation icon next to currency code
   - Use yellow/warning color scheme
   - Consistent with existing warning patterns

---

## 8. Edge Cases and Considerations

### Edge Cases Identified

1. **Missing Currency Code:**
   - Transaction with `currency_code = null` or `undefined`
   - Default to project currency or exclude?

2. **Case Sensitivity:**
   - Currency codes: 'USD' vs 'usd' vs 'Usd'
   - Standardize to uppercase for comparison

3. **Multiple Currencies:**
   - Project may have transactions in 3+ currencies
   - Only project currency should be included

4. **Historical Data:**
   - Existing transactions without currency_code
   - Migration strategy needed

### Recommendations

1. **Case-Insensitive Comparison:**
   ```typescript
   transaction.currency_code?.toUpperCase() === projectCurrency?.toUpperCase()
   ```

2. **Null Handling:**
   - Treat `null`/`undefined` as project currency (backwards compatibility)
   - Or exclude explicitly (safer for data integrity)

3. **Data Migration:**
   - Add migration to populate missing currency_code
   - Default to project.settings.currency

---

## 9. Testing Considerations

### Test Scenarios

1. **Matching Currency:** Transaction included in calculations
2. **Different Currency:** Transaction excluded with visual indicator
3. **Null Currency:** Transaction handled per policy decision
4. **Case Mismatch:** 'usd' vs 'USD' treated as same
5. **Multiple Projects:** Each project uses its own currency

### Components to Test

- ProjectDetailPage calculation accuracy
- Transaction list visual indicators
- Tooltip display and content
- CashCounterModal amount accuracy

---

## 10. Technical Constraints

### Dependencies

- React for UI components
- TypeScript for type safety
- Tailwind CSS for styling (existing design system)
- No additional libraries required

### Performance Considerations

- Filter operation: O(n) on transactions array
- Acceptable for typical transaction counts (<1000)
- No database changes needed

---

## Conclusion

The codebase is well-structured for implementing currency filtering. Key modifications needed:

1. **Backend:** Add currency filtering to calculation logic
2. **Frontend:** Add visual highlighting and tooltips
3. **Utilities:** Create reusable currency matching function
4. **Testing:** Cover edge cases and component integration

No breaking changes required. Feature can be implemented incrementally with backwards compatibility.
