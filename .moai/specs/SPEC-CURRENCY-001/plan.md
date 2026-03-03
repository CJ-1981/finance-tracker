---
spec_id: SPEC-CURRENCY-001
version: "1.0.0"
last_updated: 2026-03-03
status: draft
---

# Implementation Plan: SPEC-CURRENCY-001

## Milestone 1: Backend Logic (Priority High)

### Task 1.1: Create currency-aware utility function

**File:** `src/utils/currencyFilter.ts` (new)

**Description:** Implement a reusable utility function for filtering transactions by currency.

**Implementation Details:**
```typescript
interface CurrencyFilteredResult {
  included: Transaction[];
  excluded: Transaction[];
}

export function filterByCurrency(
  transactions: Transaction[],
  projectCurrency: string
): CurrencyFilteredResult {
  const included: Transaction[] = [];
  const excluded: Transaction[] = [];

  for (const transaction of transactions) {
    const txCurrency = transaction.currency_code?.toUpperCase();
    const projectCurr = projectCurrency?.toUpperCase();

    if (!txCurrency) {
      // Null/undefined currency - exclude with warning
      excluded.push(transaction);
    } else if (txCurrency === projectCurr) {
      // Matching currency - include
      included.push(transaction);
    } else {
      // Mismatched currency - exclude
      excluded.push(transaction);
    }
  }

  return { included, excluded };
}
```

**Acceptance:**
- Function handles null/undefined currency codes
- Case-insensitive comparison (usd === USD)
- Returns both included and excluded arrays
- TypeScript types defined

### Task 1.2: Update calculation functions

**Files:**
- `src/pages/ProjectDetailPage.tsx`
- `src/pages/TransactionsPage.tsx` (if applicable)

**Description:** Modify all `reduce((sum, t) => sum + t.amount, 0)` patterns to pre-filter transactions.

**Changes Required:**
1. Import `filterByCurrency` utility
2. Replace direct transaction arrays with filtered results
3. Update calculation points:
   - Line 796: `totalSpent` calculation
   - Line 1328: CashCounterModal total amount
   - Any other calculation aggregation points

**Example:**
```typescript
// Before
const totalSpent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

// After
const { included: transactionsForCalculation } = filterByCurrency(
  filteredTransactions,
  project.settings.currency
);
const totalSpent = transactionsForCalculation.reduce((sum, t) => sum + t.amount, 0);
```

**Acceptance:**
- All calculation points updated
- Only matching currencies included in sums
- Tests verify calculation accuracy

### Task 1.3: Add TypeScript types

**File:** `src/types/index.ts`

**Description:** Add type definitions for currency filtering.

**Implementation:**
```typescript
export interface CurrencyFilteredResult {
  included: Transaction[];
  excluded: Transaction[];
}

export type CurrencyMatchStatus = 'matched' | 'mismatched' | 'missing';
```

**Acceptance:**
- Types exported and usable across components
- No TypeScript errors

---

## Milestone 2: Frontend Components (Priority High)

### Task 2.1: Create TransactionStatusIndicator component

**File:** `src/components/TransactionStatusIndicator.tsx` (new)

**Description:** Visual indicator component for transaction currency status.

**Implementation:**
```typescript
interface Props {
  currencyCode: string | null | undefined;
  projectCurrency: string;
  amount?: number;
}

export default function TransactionStatusIndicator({
  currencyCode,
  projectCurrency,
  amount
}: Props) {
  const status = getCurrencyStatus(currencyCode, projectCurrency);

  if (status === 'matched') {
    return null; // No indicator for matching currency
  }

  const isMismatched = status === 'mismatched';
  const bgColor = isMismatched ? 'bg-yellow-50' : 'bg-red-50';
  const borderColor = isMismatched ? 'border-yellow-200' : 'border-red-200';
  const tooltipText = isMismatched
    ? `This transaction is excluded from calculations because its currency (${currencyCode}) does not match the project currency (${projectCurrency}).`
    : 'Currency information missing. Transaction excluded from calculations.';

  return (
    <div
      className={`${bgColor} ${borderColor} border rounded`}
      title={tooltipText}
    >
      ⚠️
    </div>
  );
}
```

**Acceptance:**
- Component renders correct styling for each status
- Tooltip displays appropriate message
- No indicator for matched transactions

### Task 2.2: Update TransactionList/TransactionItem component

**File:** `src/pages/TransactionsPage.tsx`

**Description:** Integrate TransactionStatusIndicator and apply conditional styling.

**Changes Required:**
1. Import `TransactionStatusIndicator` component
2. Determine currency status for each transaction
3. Apply conditional styling to transaction rows
4. Handle null currency case with red styling

**Example:**
```typescript
const getTransactionRowClassName = (transaction: Transaction) => {
  const status = getCurrencyStatus(transaction.currency_code, project.currency);
  if (status === 'matched') return '';
  if (status === 'mismatched') return 'bg-yellow-50 border-yellow-200 border';
  return 'bg-red-50 border-red-200 border'; // missing
};

// In table row render
<tr className={getTransactionRowClassName(transaction)}>
  {/* existing cells */}
  <td>
    <TransactionStatusIndicator
      currencyCode={transaction.currency_code}
      projectCurrency={project.currency}
    />
    {transaction.currency_code || 'N/A'}
  </td>
</tr>
```

**Acceptance:**
- Yellow styling applied to mismatched currencies
- Red styling applied to null currencies
- Standard styling for matching currencies
- Tooltips display on hover

### Task 2.3: Create or enhance Tooltip component

**File:** `src/components/Tooltip.tsx` (if new) or enhance existing

**Description:** Reusable tooltip with hover delay and accessibility support.

**Implementation (if new):**
```typescript
interface Props {
  content: string;
  children: React.ReactNode;
  delay?: number;
}

export default function Tooltip({ content, children, delay = 300 }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block"
    >
      {children}
      {isVisible && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                     px-3 py-2 bg-gray-900 text-white text-sm rounded
                     shadow-lg whitespace-nowrap z-50"
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}
```

**Acceptance:**
- Tooltip appears after configured delay
- Mobile tap-and-hold support
- ARIA attributes for accessibility
- No layout shift when tooltip appears

---

## Milestone 3: Testing (Priority Medium)

### Task 3.1: Unit tests for utility functions

**File:** `src/utils/__tests__/currencyFilter.test.ts`

**Test Cases:**
- Matching currency included in result
- Mismatched currency excluded from result
- Null currency code handled correctly
- Case-insensitive comparison (USD === usd)
- Empty array returns empty result
- All transactions excluded returns empty included array

**Acceptance:**
- All tests passing
- 100% coverage of utility function

### Task 3.2: Component tests

**File:** `src/components/__tests__/TransactionStatusIndicator.test.tsx`

**Test Cases:**
- Renders null for matched currency
- Renders warning icon for mismatched currency
- Renders error icon for null currency
- Tooltip displays correct message for each status

**Acceptance:**
- All component states tested
- Tooltip content verified

### Task 3.3: Integration tests

**File:** `tests/e2e/currency.spec.ts` (extend existing)

**Test Cases:**
- Full calculation flow with mixed currencies
- UI updates when project currency changes
- Visual indicators appear correctly
- Tooltips display on hover

**Acceptance:**
- End-to-end user flow verified
- All acceptance criteria scenarios pass

---

## Milestone 4: Edge Cases (Priority Medium)

### Task 4.1: Handle case sensitivity

**Implementation:** Normalize currency codes to uppercase before comparison in `filterByCurrency`.

**Test Cases:**
- 'usd' matches 'USD'
- 'Eur' matches 'EUR'
- 'jpy' matches 'JPY'

### Task 4.2: Handle undefined project currency

**Implementation:** When project has no currency set:
- Option A: Include all transactions (default behavior)
- Option B: Exclude all transactions with warning
- **Recommendation:** Option A for backwards compatibility

**Test Cases:**
- Project without currency includes all transactions
- User notified when project currency is missing

### Task 4.3: Performance optimization

**Implementation:**
- Memoize filtered results using `React.useMemo`
- Prevent recalculation on re-renders

**Example:**
```typescript
const filteredByCurrency = useMemo(() => {
  return filterByCurrency(transactions, project.currency);
}, [transactions, project.currency]);
```

**Acceptance:**
- No unnecessary re-calculations
- Performance impact measured < 5% overhead

---

## Risk Analysis

### Risk 1: Backwards Compatibility

**Description:** Existing code may rely on current "all transactions included" behavior.

**Mitigation:**
- Conduct code audit of all calculation call sites
- Add feature flag for gradual rollout if needed
- Update all consumers of calculation functions

**Impact:** Medium - Requires thorough testing

### Risk 2: Performance Impact

**Description:** Additional filtering step on every calculation could impact performance with large transaction lists.

**Mitigation:**
- Memoize filtered results
- Use efficient array filtering (single pass)
- Consider pagination for very large lists

**Impact:** Low - Filtering is O(n) and minimal overhead

### Risk 3: Edge Cases - Null/Undefined Values

**Description:** Legacy transactions may have null currency_code values.

**Mitigation:**
- Explicit null handling with visual distinction (red styling)
- Database migration to populate missing currency codes if possible
- Clear messaging in tooltips

**Impact:** Medium - Requires user communication

### Risk 4: User Confusion

**Description:** Users may not understand why some transactions are excluded.

**Mitigation:**
- Clear, prominent tooltips with specific explanation
- Consider adding a summary banner showing count of excluded transactions
- Update help documentation

**Impact:** Medium - UX consideration

### Risk 5: Case Sensitivity

**Description:** Currency codes stored as "usd" vs "USD" could cause mismatches.

**Mitigation:**
- Normalize to uppercase before comparison
- Add validation on transaction creation to enforce uppercase

**Impact:** Low - Simple normalization

---

## Dependencies

### Internal Dependencies
- `src/types/index.ts` - Type definitions
- `src/pages/ProjectDetailPage.tsx` - Main calculation consumer
- `src/pages/TransactionsPage.tsx` - Transaction list display

### External Dependencies
- React 18+
- TypeScript 5+
- Tailwind CSS (existing)

---

## Expert Consultation Recommendations

### expert-frontend (Recommended)

**Reason:** This SPEC involves significant UI/UX changes:
- New TransactionStatusIndicator component
- Conditional styling based on currency match
- Tooltip component with accessibility requirements
- Mobile interaction patterns (tap-and-hold)

**Value:** Ensures consistent design system integration, accessibility compliance (WCAG), and performant rendering patterns.

### expert-backend (Optional)

**Reason:** The calculation logic changes are relatively straightforward, but a backend expert could provide:
- Performance optimization patterns for filtering
- Type safety recommendations
- Testing strategies for utility functions

**Value:** Optional if team is confident in the filtering logic implementation.

---

## Success Metrics

### Code Quality
- Zero TypeScript errors
- Zero ESLint warnings
- 85%+ test coverage for new code
- All acceptance criteria passing

### Performance
- < 5% overhead on calculation operations
- No visual lag when applying filters
- Smooth hover interactions ( tooltips)

### User Experience
- Clear visual distinction for excluded transactions
- Helpful tooltips with specific information
- No user confusion about excluded amounts

---

## Definition of Done

A task is considered complete when:
1. Code is written and committed
2. Unit tests are written and passing
3. Code review completed (if applicable)
4. Documentation updated (if applicable)
5. No regressions in existing functionality
6. Acceptance criteria verified
