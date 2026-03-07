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

# Acceptance Criteria: SPEC-DENOM-001

## Overview

This document defines acceptance criteria for currency-specific denominations in the cash counter feature using Gherkin (Given/When/Then) format.

---

## Scenario 1: Initial Load with EUR Currency

**Feature:** Default currency loads EUR denominations

**Given** the user opens the Cash Counter Page
**And** the default currency is EUR
**When** the page loads
**Then** the system displays EUR-specific denominations
**And** the denominations include: 200, 100, 50, 20, 10, 5 (bills)
**And** the denominations include: 2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01 (coins)
**And** the currency symbol '' is displayed

**Verification Steps:**
1. Open Cash Counter Page
2. Verify default currency is EUR
3. Check all 14 denominations are displayed
4. Verify bills and coins are correctly categorized
5. Confirm currency symbol is shown in totals

---

## Scenario 2: Select USD Currency

**Feature:** USD currency displays USD-specific denominations

**Given** the user is on the Cash Counter Page
**When** the user selects USD from currency selector
**Then** the system displays USD-specific denominations
**And** the denominations include: 100, 50, 20, 10, 5, 2, 1 (bills)
**And** the denominations include: 0.25, 0.10, 0.05, 0.01 (coins)
**And** the currency symbol '$' is displayed

**Verification Steps:**
1. Open Cash Counter Page
2. Click currency selector
3. Select USD
4. Verify 10 denominations are displayed (not EUR's 14)
5. Check that 200 and 2 bills are not shown
6. Verify 0.25 quarter is shown as a coin
7. Confirm '$' symbol appears in totals

---

## Scenario 3: Select JPY Currency

**Feature:** JPY currency displays Yen-specific denominations

**Given** the user is on the Cash Counter Page
**When** the user selects JPY from currency selector
**Then** the system displays JPY-specific denominations
**And** the denominations include: 10000, 5000, 2000, 1000 (bills)
**And** the denominations include: 500, 100, 50, 10, 5, 1 (coins)
**And** there are NO decimal denomination values
**And** the currency symbol '' is displayed

**Verification Steps:**
1. Open Cash Counter Page
2. Select JPY from currency selector
3. Verify 9 total denominations are displayed
4. Confirm no decimal values (0.xx) appear
5. Check that 10000 yen bill is the largest denomination
6. Verify '' symbol appears in totals

---

## Scenario 4: Currency Change Clears Counts

**Feature:** Changing currency clears denomination counts

**Given** the user has entered counts for EUR currency
**And** the user has entered count 5 for the 200 bill
**When** the user changes currency to USD
**Then** all denomination counts are reset to 0
**And** the displayed denominations change to USD format
**And** no data from EUR carries over to USD

**Verification Steps:**
1. Select EUR currency
2. Enter count of 5 for 200 bill
3. Verify total shows 1000.00
4. Change currency to USD
5. Verify all input fields show 0
6. Verify total shows 0.00
7. Confirm denominations are USD format

---

## Scenario 5: Currency Change with Confirmation

**Feature:** User receives confirmation before losing data

**Given** the user has entered counts for current currency
**And** the user changes to a different currency
**When** the system detects existing counts
**Then** the system displays a confirmation dialog
**And** the dialog explains that existing counts will be cleared
**And** the user can choose to proceed or cancel

**Verification Steps:**
1. Enter counts for current currency
2. Select different currency
3. Verify confirmation dialog appears
4. Check dialog message explains data loss
5. Click Cancel to verify currency doesn't change
6. Select different currency again
7. Click Confirm to verify currency changes

---

## Scenario 6: Calculations with Different Denominations

**Feature:** Totals calculate correctly with currency-specific values

**Given** the user has selected USD currency
**And** the user has entered: 2 x $100 bills, 3 x $0.25 coins
**When** the system calculates totals
**Then** the displayed total is $200.75
**And** the bills total is $200.00
**And** the coins total is $0.75

**Verification Steps:**
1. Select USD currency
2. Enter count 2 for 100 bill
3. Enter count 3 for 0.25 coin
4. Verify total shows 200.75
5. Verify bills breakdown shows 200.00
6. Verify coins breakdown shows 0.75

---

## Scenario 7: KRW Currency with Large Values

**Feature:** KRW currency displays Korean Won denominations

**Given** the user selects KRW currency
**When** the system loads KRW denominations
**Then** the system displays: 50000, 10000, 5000, 1000 (bills)
**And** the system displays: 500, 100, 50, 10 (coins)
**And** the currency has no decimal denominations
**And** the currency symbol is not displayed (uses '')

**Verification Steps:**
1. Select KRW currency
2. Verify 8 total denominations displayed
3. Confirm 50000 is highest bill
4. Verify no 0.xx values exist
5. Check totals display correctly

---

## Scenario 8: INR Currency with 2000 Bill

**Feature:** INR currency displays Indian Rupee denominations

**Given** the user selects INR currency
**When** the system loads INR denominations
**Then** the system displays: 2000, 500, 200, 100, 50, 20, 10, 5 (bills)
**And** the system displays: 2, 1, 0.50, 0.25, 0.10, 0.05 (coins)
**And** the currency symbol '₹' is displayed

**Verification Steps:**
1. Select INR currency
2. Verify 14 total denominations displayed
3. Confirm 2000 is the highest bill
4. Verify 0.25 coin is included (quarter rupee)
5. Check '₹' symbol in totals

---

## Scenario 9: CashCounterModal with Project Currency

**Feature:** CashCounterModal uses project's currency setting

**Given** a project has currency_code set to "GBP"
**When** the user opens the CashCounterModal
**Then** the system displays GBP-specific denominations
**And** the denominations include: 50, 20, 10, 5 (bills)
**And** the denominations include: 2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01 (coins)
**And** the currency symbol '£' is displayed

**Verification Steps:**
1. Open a project with GBP currency
2. Click to open CashCounterModal
3. Verify GBP denominations are shown
4. Check that 200 and 100 bills are not displayed
5. Confirm '£' symbol in totals

---

## Scenario 10: Persistence Across Sessions

**Feature:** Currency and denominations persist across page reloads

**Given** the user has selected JPY currency
**And** the user has entered counts for JPY denominations
**When** the user refreshes the page
**Then** the currency remains JPY
**And** the denomination inputs restore to JPY values
**And** the calculated totals match the previous session

**Verification Steps:**
1. Select JPY currency
2. Enter various denomination counts
3. Note the calculated total
4. Refresh browser page
5. Verify currency selector shows JPY
6. Verify denomination inputs have saved values
7. Verify total matches previous value

---

## Scenario 11: LocalStorage Migration from V2 to V3

**Feature:** Existing V2 format data migrates to V3 with currency field

**Given** the user has localStorage data in V2 format (without currency field)
**When** the user opens the CashCounterPage
**Then** the system detects V2 format
**Then** the system migrates data to V3 format
**And** the currency field is set to 'EUR' (default)
**And** the existing denomination counts are preserved

**Verification Steps:**
1. Open browser DevTools Application tab
2. Set localStorage with V2 format data (no currency field)
3. Refresh CashCounterPage
4. Verify data loads correctly
5. Verify currency defaults to EUR
6. Verify counts are preserved

---

## Scenario 12: Unknown Currency Fallback

**Feature:** Unknown currency codes fall back to EUR

**Given** the system encounters an unknown currency code
**When** the system attempts to load denominations
**Then** the system uses EUR denominations as fallback
**And** the currency code itself is still displayed
**And** calculations proceed normally

**Verification Steps:**
1. Set currency to 'XYZ' (unknown code) via DevTools
2. Refresh CashCounterPage
3. Verify EUR denominations are displayed
4. Verify currency selector shows 'XYZ'
5. Verify calculations work normally

---

## Edge Case Scenarios

### Edge Case 1: Zero Decimal Currencies (JPY, KRW)

**Given** the user has selected JPY or KRW currency
**When** performing calculations
**Then** totals are displayed without decimal places
**And** denomination values are integers

### Edge Case 2: Currency with Quarter Coin (USD)

**Given** the user has selected USD currency
**When** the system displays denominations
**Then** 0.25 quarter coin is included in denominations
**And** calculations use 0.25 as the value

### Edge Case 3: Missing Coin Values (GBP)

**Given** the user has selected GBP currency
**When** comparing to EUR
**Then** GBP has no 200 and 100 bills
**And** GBP has same coin denominations as EUR

### Edge Case 4: Large Minimum Value (KRW)

**Given** the user has selected KRW currency
**When** the system displays denominations
**Then** the smallest coin is 10 won
**And** the smallest bill is 1000 won

---

## Performance Criteria

### Performance Test 1: Currency Change Performance

**Given** the user has entered denomination counts
**When** the user changes currency
**Then** denomination update completes within 100ms
**And** UI update has no visible lag

### Performance Test 2: Large Value Calculations

**Given** the user has selected JPY currency
**And** all denomination inputs contain values (max counts)
**When** totals are recalculated
**Then** calculation completes within 10ms
**And** UI updates smoothly

---

## Accessibility Criteria

### Accessibility Test 1: Currency Selector Keyboard Navigation

**Given** a user navigates with keyboard only
**When** focusing on currency selector
**Then** user can open dropdown with Enter or Space
**Then** user can navigate options with arrow keys
**Then** user can select with Enter

### Accessibility Test 2: Denomination Labels Readable

**Given** a user uses screen reader
**When** currency changes
**Then** screen reader announces new denomination labels
**And** currency symbol is announced
**And** type (bill/coin) is distinguishable

---

## Localization Criteria

### Localization Test 1: English Labels

**Given** the user has English language selected
**When** viewing denomination labels
**Then** labels are displayed in English format
**And** currency names match English conventions

### Localization Test 2: Korean Labels

**Given** the user has Korean language selected
**When** viewing denomination labels
**Then** labels are displayed appropriately for Korean context
**And** currency symbols render correctly

---

## Definition of Done

A scenario is considered passing when:
1. All Given/When/Then steps execute successfully
2. No errors in browser console
3. Expected visual state is verified
4. Calculation accuracy is confirmed
5. Currency symbols display correctly

The feature is considered complete when:
1. All primary scenarios (1-12) pass
2. All edge case scenarios pass
3. Performance criteria are met
4. Accessibility criteria are met
5. Localization criteria are met
6. Code coverage meets 85% threshold
