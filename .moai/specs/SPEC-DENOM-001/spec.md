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

# SPEC-DENOM-001: Currency-Specific Denominations for Cash Counter Feature

## HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-07 | chimin | Initial SPEC creation |

---

## Environment

**Project Context:** Personal Finance Tracker - Cash Counter Feature
**Current State:** Cash counter uses hardcoded EUR denominations (200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01) regardless of selected currency
**Desired State:** Cash counter dynamically loads currency-specific denominations based on user's currency selection

---

## Assumptions

1. **Currency Selection:** Users select currency from predefined list (EUR, USD, GBP, JPY, KRW, CNY, INR)
2. **Static Configuration:** Denomination lists are defined in code, not user-configurable
3. **Real-World Accuracy:** Each currency's denominations match actual physical currency in circulation
4. **Existing Data:** Some users may have localStorage data using old EUR-based format requiring migration
5. **Display Only:** Currency symbols and labels are for display purposes; calculations use numeric values

---

## Functional Requirements

### Ubiquitous Requirements

**UC-001:** The system **shall** always load appropriate denominations for the currently selected currency.
**UC-002:** The system **shall** always use currency-specific labels for denomination display.
**UC-003:** The system **shall** always calculate totals based on the currency's specific denomination values.
**UC-004:** The system **shall** always persist denomination data with currency context in localStorage.

### Event-Driven Requirements

**ED-001:** **WHEN** a user selects a different currency, **THEN** the system **shall** update the displayed denominations to match the new currency.
**ED-002:** **WHEN** a user selects a different currency, **THEN** the system **shall** clear or convert existing denomination counts to zero for the new currency's denominations.
**ED-003:** **WHEN** the CashCounterModal or CashCounterPage initializes, **THEN** the system **shall** load denominations based on the current currency setting.
**ED-004:** **WHEN** currency changes, **THEN** the system **shall** update the currency symbol displayed in totals and labels.

### State-Driven Requirements

**SD-001:** **IF** the currency is EUR, **THEN** the system **shall** display denominations: 200, 100, 50, 20, 10, 5 (bills) and 2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01 (coins).
**SD-002:** **IF** the currency is USD, **THEN** the system **shall** display denominations: 100, 50, 20, 10, 5, 2, 1 (bills) and 0.25, 0.10, 0.05, 0.01 (coins).
**SD-003:** **IF** the currency is GBP, **THEN** the system **shall** display denominations: 50, 20, 10, 5 (bills) and 2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01 (coins).
**SD-004:** **IF** the currency is JPY, **THEN** the system **shall** display denominations: 10000, 5000, 2000, 1000 (bills) and 500, 100, 50, 10, 5, 1 (coins).
**SD-005:** **IF** the currency is KRW, **THEN** the system **shall** display denominations: 50000, 10000, 5000, 1000 (bills) and 500, 100, 50, 10 (coins).
**SD-006:** **IF** the currency is CNY, **THEN** the system **shall** display denominations: 100, 50, 20, 10, 5, 1 (bills) and 1, 0.50, 0.10 (coins).
**SD-007:** **IF** the currency is INR, **THEN** the system **shall** display denominations: 2000, 500, 200, 100, 50, 20, 10, 5 (bills) and 2, 1, 0.50, 0.25, 0.10, 0.05 (coins).
**SD-008:** **IF** a currency not in the predefined list is selected, **THEN** the system **shall** default to EUR denominations as fallback.

### Optional Requirements

**OP-001:** **WHERE** technically feasible, the system **should** support custom denomination configuration for advanced users.
**OP-002:** **WHERE** multiple currencies are frequently used, the system **should** provide a quick currency switch with denomination preview.

### Unwanted Requirements

**UW-001:** The system **shall not** display EUR denominations when USD is selected.
**UW-002:** The system **shall not** allow calculation with denominations that don't belong to the current currency.
**UW-003:** The system **shall not** mix denomination counts across different currencies in a single session.

---

## Data Requirements

### Input Specifications

| Data Element | Type | Source | Validation |
|--------------|------|--------|------------|
| `currency_code` | string (ISO 4217) | Currency selector | Required, must be in supported list |
| `denomination.value` | number | Currency configuration | Required, must be valid for currency |
| `denomination.label` | string | Currency configuration | Required, display value |
| `denomination.type` | `` `bill` | `coin` `` | Currency configuration | Required |

### Output Specifications

| Output | Type | Description |
|--------|------|-------------|
| `denominations` | array | Currency-specific denomination list |
| `currency_symbol` | string | Display symbol ($, , ?, etc.) |
| `calculated_total` | number | Sum of (count × value) for each denomination |

### Currency Denomination Definitions

```typescript
interface Denomination {
  value: number        // Numeric value for calculations
  label: string         // Display label (e.g., "200", "0.50")
  type: 'bill' | 'coin'  // Bill or coin classification
  currency: string     // Associated currency code
}
```

---

## UI/UX Requirements

### Visual Design Specifications

**Denomination Display:**
- Bills displayed first (highest to lowest value)
- Coins displayed after bills (highest to lowest value)
- Currency symbol shown next to denomination labels
- Type indicators (bill/coin icons) appropriate for currency

**Currency Change UX:**
- Clear visual indication when currency changes
- Confirmation dialog if existing counts would be lost
- Smooth transition animation when denominations update

**Denomination Input:**
- Only valid denominations for current currency shown
- Input fields disabled when currency is being changed
- Running totals update in real-time

### Currency-Specific Labels

| Currency | Symbol | Emoji Bill | Emoji Coin |
|----------|---------|------------|------------|
| EUR |  |  |  |
| USD | $ |  |  |
| GBP |  |  |  |
| JPY |  |  |  |
| KRW |  |  |  |
| CNY |  |  |  |
| INR |  |  |  |

---

## Technical Constraints

### Dependencies

- React 18+ for UI components
- TypeScript for type safety
- Tailwind CSS for styling (existing design system)
- No additional external libraries required

### Performance Considerations

- Denomination lookup: O(1) via direct object/map access
- Currency change: Should complete within 100ms
- Calculation: O(n) where n = number of denominations (typically < 15)
- No database changes required (client-side only)

---

## Success Criteria

All of the following must be verified for implementation completion:

### Functional Completeness
- Each supported currency displays its correct denominations
- Currency change updates denominations correctly
- Totals calculate correctly for each currency's denominations
- LocalStorage saves and loads with currency context

### Data Integrity
- No mixing of denominations across currencies
- Migration from old EUR-only format completes without data loss
- Fallback behavior for unknown currencies works correctly

### User Experience
- Currency change provides clear feedback
- Denomination counts reset appropriately on currency change
- Visual indicators distinguish bills from coins
- Running totals update in real-time

### Quality Standards
- Zero TypeScript errors
- Zero ESLint warnings
- 85%+ test coverage for new code
- All acceptance criteria passing

---

## Risk Assessment

### Risk 1: Data Loss on Currency Change

**Description:** Changing currency may cause existing denomination counts to be lost if not properly handled.

**Mitigation:**
- Confirm dialog before currency change with existing data
- Preserve data in localStorage with currency-specific keys
- Provide option to keep data and create new entry for new currency

**Impact:** Medium - User data loss if not handled correctly

### Risk 2: Incorrect Denomination Values

**Description:** Hardcoded denomination values may not match actual currency usage or may change over time.

**Mitigation:**
- Source denomination values from authoritative sources
- Document source references in code comments
- Provide validation or override mechanism for edge cases

**Impact:** Low - Denomination values are relatively stable

### Risk 3: localStorage Migration Complexity

**Description:** Existing users have data stored in old EUR-based format that may not map cleanly to new currency-specific format.

**Mitigation:**
- Version localStorage format explicitly
- Detect old format and migrate to new structure
- Provide fallback if migration fails (reset to empty state)

**Impact:** Medium - Affects existing users with saved data

### Risk 4: Currency-Specific Edge Cases

**Description:** Some currencies have edge cases (e.g., JPY with no decimal denominations, KRW with large minimum values).

**Mitigation:**
- Define each currency's denominations individually based on real-world usage
- Handle zero decimal currencies appropriately in calculations
- Test each currency's edge cases

**Impact:** Medium - Requires thorough testing per currency

---

## Dependencies

### Internal Dependencies
- `src/types/index.ts` - Type definitions
- `src/components/CashCounterModal.tsx` - Modal cash counter component
- `src/pages/CashCounterPage.tsx` - Standalone cash counter page
- `src/utils/currencyFilter.ts` - Existing currency utilities

### External Dependencies
- React 18+ - UI framework
- TypeScript 5+ - Type system
- react-i18next - Internationalization support

---

## Traceability

### Related Components
- `src/components/CashCounterModal.tsx` - Project-embedded cash counter
- `src/pages/CashCounterPage.tsx` - Standalone cash counter page

### Related Features
- SPEC-CURRENCY-001 - Currency filtering for transactions
- SPEC-UI-003 - Cash counter modal UI improvements

### Related Localization
- `src/locales/en.json` - English translations
- `src/locales/ko.json` - Korean translations

---

## Migration Strategy

### Legacy Data Migration

**Old Format (V1/V2):**
```typescript
{
  projectId: string,
  anonymous: Record<number, number>,  // EUR denomination keys
  namedCounts: Record<number, number>,
  lastDate: string
}
```

**New Format (V3):**
```typescript
{
  projectId: string,
  version: 3,
  currency: string,  // NEW: Currency code
  anonymous: Record<number, number>,  // Currency-specific denomination keys
  namedCounts: Record<number, number>,
  lastDate: string
}
```

**Migration Steps:**
1. Detect version < 3 on localStorage load
2. Preserve existing counts
3. Add currency field (default to 'EUR' for compatibility)
4. Save in new V3 format
5. Display migration notification to user (optional)

---

## Definition of Done

This SPEC is considered complete when:
1. All functional requirements (UC-001 through UC-004) are implemented
2. All state-driven requirements (SD-001 through SD-008) are verified
3. Currency change UX handles existing data appropriately
4. localStorage migration from V2 to V3 works correctly
5. All acceptance criteria in acceptance.md pass
6. Test coverage meets 85% threshold
7. Code review completed (if applicable)
8. Zero TypeScript errors and ESLint warnings
