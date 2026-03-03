---
spec_id: SPEC-CURRENCY-001
version: "1.0.0"
last_updated: 2026-03-03
status: draft
---

# Acceptance Criteria: SPEC-CURRENCY-001

## Overview

This document defines the acceptance criteria for the currency filtering and visual distinction feature using Gherkin (Given/When/Then) format.

---

## Scenario 1: Primary Success Case (Matching Currency Included)

**Feature:** Transaction calculation includes matching currency

**Given** a project with currency_code set to "USD"
**And** a transaction exists with amount=100.00 and currency_code="USD"
**When** the user views the transaction list
**Then** the transaction displays with standard styling (no yellow background)
**And** the transaction is included in all sum/total calculations
**And** no warning icon or tooltip is displayed

**Verification Steps:**
1. Navigate to project with USD currency
2. Verify transaction with USD currency has standard styling
3. Check that total calculation includes the USD transaction amount
4. Confirm no visual warning indicators are present

---

## Scenario 2: Currency Mismatch (Excluded with Visual Indicator)

**Feature:** Visual distinction for mismatched currency

**Given** a project with currency_code set to "USD"
**And** a transaction exists with amount=100.00 and currency_code="EUR"
**When** the user views the transaction list
**Then** the transaction displays with yellow background (bg-yellow-50)
**And** the transaction has a yellow border (border-yellow-200)
**And** an exclamation mark icon appears on hover
**And** hovering displays tooltip: "This transaction is excluded from calculations because its currency (EUR) does not match the project currency (USD)."
**And** the transaction is NOT included in any sum/total calculations

**Verification Steps:**
1. Navigate to project with USD currency
2. Verify EUR transaction has yellow background and border
3. Hover over the transaction and verify tooltip appears
4. Confirm tooltip message mentions EUR and USD currencies
5. Check that total calculation does NOT include the EUR transaction amount

---

## Scenario 3: Null Currency Code (Special Warning)

**Feature:** Special handling for missing currency information

**Given** a project with currency_code set to "USD"
**And** a transaction exists with amount=100.00 and currency_code=null
**When** the user views the transaction list
**Then** the transaction displays with red background (bg-red-50)
**And** the transaction has red border (border-red-200)
**And** the transaction is NOT included in any calculations
**And** the tooltip explains missing currency information

**Verification Steps:**
1. Navigate to project with USD currency
2. Verify transaction with null currency has red background and border
3. Hover over the transaction and verify tooltip appears
4. Confirm tooltip message mentions missing currency information
5. Check that total calculation does NOT include the null currency transaction

---

## Scenario 4: Calculation Verification

**Feature:** Accurate calculations with currency filtering

**Given** a project with currency_code="USD"
**And** three transactions exist:
  - Transaction A: amount=100, currency_code="USD"
  - Transaction B: amount=50, currency_code="EUR"
  - Transaction C: amount=75, currency_code="USD"
**When** the total sum is calculated
**Then** the result equals 175.00 (100 + 75)
**And** Transaction B is excluded from the calculation

**Verification Steps:**
1. Create project with USD currency
2. Add three transactions as specified above
3. Verify total amount displayed is 175.00
4. Verify Transaction A and C are included
5. Verify Transaction B is excluded

---

## Scenario 5: Case Insensitive Currency Matching

**Feature:** Case-insensitive currency code comparison

**Given** a project with currency_code set to "USD"
**And** a transaction exists with amount=50.00 and currency_code="usd" (lowercase)
**When** the user views the transaction list
**Then** the transaction displays with standard styling (no warning indicators)
**And** the transaction is included in all sum/total calculations

**Verification Steps:**
1. Create project with USD currency
2. Add transaction with lowercase "usd" currency
3. Verify transaction has standard styling (no yellow background)
4. Confirm transaction is included in calculations

---

## Scenario 6: Multiple Currency Exclusion

**Feature:** Multiple mismatched currencies all excluded

**Given** a project with currency_code="USD"
**And** four transactions exist:
  - Transaction A: amount=100, currency_code="USD"
  - Transaction B: amount=50, currency_code="EUR"
  - Transaction C: amount=75, currency_code="GBP"
  - Transaction D: amount=25, currency_code="JPY"
**When** the total sum is calculated
**Then** the result equals 100.00 (only Transaction A)
**And** Transactions B, C, and D are all excluded from calculation
**And** all three excluded transactions have yellow warning styling

**Verification Steps:**
1. Create project with USD currency
2. Add four transactions as specified above
3. Verify total amount displayed is 100.00
4. Verify three non-USD transactions have yellow styling
5. Verify each excluded transaction shows appropriate tooltip

---

## Scenario 7: Project Currency Change

**Feature:** Dynamic re-evaluation on project currency change

**Given** a project with currency_code="USD"
**And** a transaction exists with amount=100.00 and currency_code="EUR"
**When** the user changes the project currency_code to "EUR"
**Then** the transaction displays with standard styling (no warning indicators)
**And** the transaction is included in all sum/total calculations

**Verification Steps:**
1. Create project with USD currency
2. Add EUR transaction (should have yellow warning)
3. Change project currency to EUR
4. Verify transaction now has standard styling
5. Confirm transaction is included in calculations

---

## Edge Case Scenarios

### Edge Case 1: Empty Transaction List

**Given** a project with currency_code="USD"
**And** no transactions exist
**When** calculations are performed
**Then** the result equals 0.00
**And** no errors occur

### Edge Case 2: All Transactions Excluded

**Given** a project with currency_code="USD"
**And** all transactions have non-USD currencies
**When** calculations are performed
**Then** the result equals 0.00
**And** all transactions have yellow warning styling

### Edge Case 3: Project Without Currency Set

**Given** a project with currency_code=null or undefined
**And** multiple transactions exist with various currencies
**When** calculations are performed
**Then** all transactions are included (backwards compatibility)
**Or** all transactions are excluded with warning (depending on implementation decision)

**Note:** This behavior should be explicitly defined during implementation.

---

## Performance Criteria

### Performance Test 1: Large Dataset

**Given** a project with 1,000 transactions
**And** 20% have mismatched currencies
**When** the transaction list renders
**Then** rendering completes within 2 seconds
**And** filtering calculations complete within 100ms

### Performance Test 2: Frequent Re-renders

**Given** a project with 100 transactions
**When** the user rapidly changes filters
**Then** no visual lag occurs
**And** tooltips appear smoothly on hover

---

## Accessibility Criteria

### Accessibility Test 1: Tooltip Keyboard Access

**Given** a user navigates with keyboard only
**When** focus reaches an excluded transaction
**Then** the tooltip information is available via screen reader
**And** the tooltip can be triggered via keyboard (Enter or Space)

### Accessibility Test 2: Color Contrast

**Given** a user with color vision deficiency
**When** viewing excluded transactions
**Then** the warning is discernible without relying solely on color
**And** the icon provides additional visual indication

---

## Definition of Done

A scenario is considered passing when:
1. All Given/When/Then steps execute successfully
2. No errors in browser console
3. Expected visual state is verified
4. Calculation accuracy is confirmed
5. Tooltip content is appropriate

The feature is considered complete when:
1. All primary scenarios (1-7) pass
2. All edge case scenarios pass
3. Performance criteria are met
4. Accessibility criteria are met
5. Code coverage meets 85% threshold
