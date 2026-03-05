---
id: SPEC-UI-003
title: Compact Cash Counter UI Refactor
domain: UI
status: Draft
priority: Medium
created: 2026-03-05
tags:
  - TAG-SPEC-UI-003
  - TAG-CASH-COUNTER
  - TAG-UI-REFACTOR
  - TAG-PARALLEL-ENTRY
---

# Task Decomposition: SPEC-UI-003

## Overview

This document decomposes the SPEC-UI-003 implementation into 8 atomic tasks, each completable in a single DDD (ANALYZE-PRESERVE-IMPROVE) or TDD (RED-GREEN-REFACTOR) cycle.

**Total Tasks:** 8
**Estimated Duration:** 8-12 sessions
**Dependencies:** Linear progression (each task builds on previous)

---

## Phase 1: State Consolidation & Data Migration

### TASK-001: State Consolidation & Data Migration

**Description:** Refactor state structure from category-based to parallel anonymous/named model with backward compatibility migration.

**Requirement Mapping:**
- E4: Remove category toggle state
- E6: Two-column parallel layout data structure
- S5: Data migration from old format
- U1: No category toggle switch
- U2: No "Add Entry" button

**Dependencies:** None

**Implementation Scope:**
1. Create new TypeScript interfaces:
   ```typescript
   interface CashCounterState {
     anonymous: Record<number, number>
     namedEntries: NamedEntry[]
   }

   interface NamedEntry {
     id: string
     name: string
     denominations: Record<number, number>
   }

   interface StoredCashDataV2 {
     projectId: string
     version: 2
     anonymous: Record<number, number>
     namedEntries: NamedEntry[]
     lastDate: string
   }
   ```

2. Implement migration utilities:
   - `migrateFromV1(data: StoredCashData): CashCounterState`
   - `migrateFromV2(data: StoredCashDataV2): CashCounterState`
   - `detectDataVersion(data: unknown): 1 | 2`

3. Remove obsolete state:
   - Remove `category: 'anonymous' | 'named'`
   - Remove `entryName: string`
   - Remove `totalCashCounted: number` (becomes derived)

**Acceptance Criteria:**
- [ ] TypeScript compiles with zero errors
- [ ] V1 data migrates correctly (anonymous entries consolidated, named entries preserved)
- [ ] V2 data loads directly without migration
- [ ] Empty state initializes correctly
- [ ] Unit tests for migration utilities pass

**Files Modified:**
- `src/components/CashCounterModal.tsx` - State interfaces

**Test Coverage Required:**
- Migration from V1 with anonymous entries only
- Migration from V1 with named entries only
- Migration from V1 with both types
- Migration from V2 format
- Empty/missing data handling

---

## Phase 2: Core Component Architecture

### TASK-002: Core Component Architecture

**Description:** Build the foundational denomination grid components for bills and coins sections.

**Requirement Mapping:**
- E1: Maintain existing modal patterns
- E2: Dark mode support (prepare structure)
- E3: i18n support (prepare structure)
- E7: Display anonymous and named sections in parallel
- S1: New UI layout design (denomination grid)

**Dependencies:** TASK-001 (state structure must exist)

**Implementation Scope:**
1. Create `DenominationRow` component:
   - Props: denomination label, anonymous controls, named controls
   - Responsive layout (desktop: row, mobile: stacked)

2. Create `BillsSection` component:
   - Renders 6 bill denominations (200, 100, 50, 20, 10, 5)
   - Section header with column labels
   - Bills total row

3. Create `CoinsSection` component:
   - Renders 8 coin denominations (2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01)
   - Section header with column labels
   - Coins total row

4. Create `AnonymousControls` component:
   - Decrement button
   - Number input (direct entry)
   - Increment button

5. Create `NamedControls` component:
   - Read-only display of sum from all named entries
   - Decrement/increment disabled (opens detail modal)

6. Create `SectionTotalsRow` component:
   - Displays anonymous total for section
   - Displays named total for section

**Acceptance Criteria:**
- [ ] Bills section renders all 6 denominations
- [ ] Coins section renders all 8 denominations
- [ ] Anonymous controls accept input via buttons and direct entry
- [ ] Named controls show read-only sum
- [ ] Section totals calculate correctly
- [ ] Desktop layout uses two-column grid
- [ ] Mobile layout stacks vertically

**Files Created:**
- `src/components/cash-counter/DenominationRow.tsx`
- `src/components/cash-counter/BillsSection.tsx`
- `src/components/cash-counter/CoinsSection.tsx`
- `src/components/cash-counter/AnonymousControls.tsx`
- `src/components/cash-counter/NamedControls.tsx`
- `src/components/cash-counter/SectionTotalsRow.tsx`

**Files Modified:**
- `src/components/CashCounterModal.tsx` - Import and use new components

**Test Coverage Required:**
- Component rendering tests
- Input change event handling
- Total calculation verification

---

## Phase 3: Named Entries System

### TASK-003: Named Entries System

**Description:** Build person card management system for named cash entries with add/delete functionality.

**Requirement Mapping:**
- E3: Add person button creates person card
- E4: Delete person removes card and updates totals
- E5: Denomination changes recalculate totals
- S2: Named entries section layout
- U4: No empty person names allowed
- U5: Clear all removes all person cards

**Dependencies:** TASK-001 (state), TASK-002 (base components)

**Implementation Scope:**
1. Create `PersonCard` component:
   - Name input field (editable)
   - Delete button
   - Collapsible bills section
   - Collapsible coins section
   - Person total display

2. Create `NamedEntriesModal` component:
   - Modal wrapper for detail view
   - Lists all person cards
   - "Add Another Person" button
   - Close button

3. Implement add person logic:
   - Generate unique ID
   - Add to `namedEntries` array
   - Set default name ("Person 1", "Person 2", etc.)

4. Implement delete person logic:
   - Remove from `namedEntries` array
   - Recalculate totals

5. Implement name validation:
   - Prevent empty names
   - Show error message on validation failure

**Acceptance Criteria:**
- [ ] "Add Person" button creates new person card
- [ ] Person card shows name input and denomination grid
- [ ] Person card shows individual total
- [ ] Delete button removes card with confirmation
- [ ] Empty name validation prevents addition
- [ ] Default names increment correctly (Person 1, Person 2, etc.)
- [ ] Denomination inputs on person card update person total

**Files Created:**
- `src/components/cash-counter/PersonCard.tsx`
- `src/components/cash-counter/NamedEntriesModal.tsx`

**Files Modified:**
- `src/components/CashCounterModal.tsx` - Wire up add/delete handlers

**Test Coverage Required:**
- Add person creates new entry
- Delete person removes entry and updates totals
- Name validation rejects empty names
- Person card denominations update person total

---

## Phase 4: Real-Time Calculations

### TASK-004: Real-Time Calculations

**Description:** Implement real-time total calculation system eliminating "Add Entry" button.

**Requirement Mapping:**
- E2: Denomination input immediately updates running totals
- E5: Any denomination change recalculates section total
- E9: Modal close persists without "Add Entry" button
- U2: No "Add Entry" button required
- U6: No separate "current entry" total

**Dependencies:** TASK-001 (state), TASK-002 (components), TASK-003 (person cards)

**Implementation Scope:**
1. Create `useCashTotals` hook:
   ```typescript
   function useCashTotals(state: CashCounterState) {
     const anonymousTotal = useMemo(
       () => calculateTotal(state.anonymous),
       [state.anonymous]
     )

     const namedTotals = useMemo(
       () => state.namedEntries.map(entry => ({
         id: entry.id,
         name: entry.name,
         total: calculateTotal(entry.denominations)
       })),
       [state.namedEntries]
     )

     const grandTotal = useMemo(
       () => anonymousTotal + namedTotals.reduce((sum, t) => sum + t.total, 0),
       [anonymousTotal, namedTotals]
     )

     return { anonymousTotal, namedTotals, grandTotal }
   }
   ```

2. Implement `calculateTotal` utility:
   - Sums denomination count * denomination value
   - Handles empty/undefined values

3. Wire up anonymous total calculation:
   - Updates on any anonymous denomination change

4. Wire up named entries total calculation:
   - Updates on any person denomination change
   - Aggregates across all named entries

5. Implement grand total aggregation:
   - Sum of anonymous + all named totals

6. Implement match status calculation:
   - Compare grand total vs transaction total
   - Return: "match" | "excess" | "shortage"
   - Calculate difference amount

**Acceptance Criteria:**
- [ ] Anonymous denomination input updates anonymous total immediately
- [ ] Person denomination input updates person total immediately
- [ ] Person denomination input updates named total immediately
- [ ] Any denomination change updates grand total immediately
- [ ] Match status updates when grand total changes
- [ ] Zero values handled correctly
- [ ] Calculations complete in <16ms (60fps)

**Files Created:**
- `src/hooks/useCashTotals.ts`
- `src/utils/cashCalculations.ts`

**Files Modified:**
- `src/components/CashCounterModal.tsx` - Use hook, display totals

**Test Coverage Required:**
- calculateTotal with various denomination inputs
- calculateTotal with empty/zero values
- useCashTotals hook returns correct values
- Totals update when state changes
- Match status calculation for all three states

---

## Phase 5: Persistence Layer

### TASK-005: Persistence Layer

**Description:** Implement localStorage persistence with debouncing, data restoration, date-based clearing, and clear all functionality.

**Requirement Mapping:**
- E6: Restore previous data on modal open
- E7: Clear data on date change
- E8: Modal close persists without "Add Entry" button
- E10: Match status display based on totals
- E11: Grand total equals transaction total shows match
- S3: Data migration strategy
- U5: No data persistence across different dates

**Dependencies:** TASK-001 (state structure), TASK-004 (calculations)

**Implementation Scope:**
1. Implement debounced save:
   - 300ms debounce delay
   - Save to localStorage on any denomination change
   - Wrap in try-catch for quota exceeded errors

2. Implement data restoration:
   - Load from localStorage on modal open
   - Detect data version (V1 or V2)
   - Run migration if needed
   - Restore state if same date
   - Return empty state if different date

3. Implement date-based clearing:
   - Compare stored `lastDate` with current date
   - Clear data if dates differ
   - Update `lastDate` on save

4. Implement clear all functionality:
   - Show confirmation dialog
   - Reset all anonymous denominations to zero
   - Remove all named entries
   - Clear localStorage
   - Reset to initial state

5. Handle error scenarios:
   - localStorage quota exceeded: Show warning, keep in memory
   - Migration failure: Reset to empty state
   - Invalid input: Auto-correct to zero

**Acceptance Criteria:**
- [ ] Data persists when modal closes
- [ ] Data restores when modal reopens on same date
- [ ] Data clears when modal opens on different date
- [ ] Clear all button shows confirmation
- [ ] Clear all removes all data
- [ ] localStorage quota exceeded shows warning
- [ ] Save is debounced (300ms)
- [ ] No data loss on rapid input changes

**Files Created:**
- `src/utils/cashStorage.ts`

**Files Modified:**
- `src/components/CashCounterModal.tsx` - Wire up persistence

**Test Coverage Required:**
- Save to localStorage
- Load from localStorage
- Date-based clearing
- Migration detection and execution
- Clear all functionality
- Quota exceeded error handling

---

## Phase 6: I18n & Theming

### TASK-006: I18n & Theming

**Description:** Add internationalization support (English + Korean) and apply dark mode styles to all components.

**Requirement Mapping:**
- E2: Dark mode for all UI elements
- E3: i18n support for all user-facing text
- S3: I18n keys for all text

**Dependencies:** TASK-002, TASK-003 (components to style)

**Implementation Scope:**
1. Add English translations to `src/locales/en.json`:
   ```json
   {
     "cashCounter": {
       "title": "Cash Counter",
       "anonymousSection": "Anonymous Cash",
       "namedSection": "Named Entries",
       "addPerson": "+ Add Person",
       "addAnotherPerson": "+ Add Another Person",
       "personName": "Person Name",
       "person": "Person",
       "deletePerson": "Remove",
       "anonymousTotal": "Anonymous Total",
       "namedTotal": "Named Total",
       "grandTotal": "Total Counted",
       "transactionsTotal": "Transactions Total",
       "match": "Match",
       "excess": "Excess",
       "shortage": "Shortage",
       "bills": "Bills",
       "coins": "Coins",
       "clearAll": "Clear All",
       "clearAllConfirm": "Are you sure you want to clear all cash counting data?",
       "close": "Close",
       "saveComplete": "Cash count saved",
       "enterName": "Enter name",
       "defaultName": "Person",
       "entries": "Entries"
     }
   }
   ```

2. Add Korean translations to `src/locales/ko.json`:
   - All English keys translated to Korean
   - Same nested structure

3. Apply i18n to components:
   - Replace all hardcoded text with `t()` calls
   - Use appropriate namespaces

4. Apply dark mode styles:
   - Bills section: Yellow/gold background (light), dark yellow (dark)
   - Coins section: Gray/silver background (light), dark gray (dark)
   - Anonymous section: Teal theme
   - Named section: Blue theme
   - Match status: Green (match), Blue (excess), Red (shortage)
   - All text: Appropriate contrast for dark mode

5. Verify text contrast meets WCAG 2.1 AA

**Acceptance Criteria:**
- [ ] All user-facing text uses i18n keys
- [ ] English translations are complete
- [ ] Korean translations are complete
- [ ] Dark mode applies to all components
- [ ] Text contrast meets accessibility standards in both themes
- [ ] Colors distinguish sections clearly in both themes
- [ ] No hardcoded text strings in components

**Files Modified:**
- `src/locales/en.json`
- `src/locales/ko.json`
- `src/components/cash-counter/*.tsx` - Apply i18n and dark mode
- `src/components/CashCounterModal.tsx` - Apply i18n and dark mode

**Test Coverage Required:**
- Visual verification of both themes
- Translation completeness check
- Contrast ratio verification

---

## Phase 7: Mobile & Accessibility

### TASK-007: Mobile & Accessibility

**Description:** Implement mobile responsive layout and add accessibility features (ARIA labels, keyboard navigation).

**Requirement Mapping:**
- E12: Mobile layout stacks columns vertically
- S4: Accessibility requirements

**Dependencies:** TASK-002, TASK-003, TASK-006 (styled components)

**Implementation Scope:**
1. Mobile responsive layout (<768px):
   - Denomination rows stack vertically
   - Anonymous controls on top row
   - Named controls on bottom row
   - Full-width inputs for touch targets
   - Person cards take full width
   - Named entries modal takes full screen on mobile

2. ARIA labels:
   - All denomination inputs have associated labels
   - Section headers use semantic HTML (h2, h3)
   - Match status has `role="status"` and `aria-live="polite"`
   - Buttons have descriptive aria-labels
   - Error messages associated with inputs

3. Keyboard navigation:
   - Tab order follows visual layout
   - Enter/Space activates buttons
   - Escape closes modals
   - Arrow keys for denomination adjustment
   - Focus management on modal open/close
   - Focus moves to newly added person card

4. Status indicators:
   - Match status uses icons + text (not color alone)
   - Required fields properly indicated
   - Error messages visible and announced

**Acceptance Criteria:**
- [ ] Mobile layout stacks vertically
- [ ] Touch targets are at least 44x44px
- [ ] Tab order follows logical flow
- [ ] All interactive elements are keyboard accessible
- [ ] Focus returns to trigger on modal close
- [ ] Focus moves to new person card on add
- [ ] Screen reader announces match status changes
- [ ] Color contrast ratios meet WCAG 2.1 AA
- [ ] Status not conveyed by color alone

**Files Modified:**
- `src/components/cash-counter/*.tsx` - Add ARIA attributes and responsive classes
- `src/components/CashCounterModal.tsx` - Focus management

**Test Coverage Required:**
- Manual keyboard navigation test
- Screen reader test (NVDA/VoiceOver)
- Mobile device test (375x667 viewport)
- Tablet test (768x1024 viewport)
- Automated accessibility audit (pa11y/axe)

---

## Phase 8: Testing & Quality

### TASK-008: Testing & Quality

**Description:** Write comprehensive test suite and validate quality gates.

**Requirement Mapping:**
- All EARS requirements (verification)
- Definition of Done criteria

**Dependencies:** TASK-001 through TASK-007 (implementation complete)

**Implementation Scope:**
1. Unit tests:
   - `calculateTotal()` function
   - `migrateFromV1()` function
   - `migrateFromV2()` function
   - `detectDataVersion()` function
   - `useCashTotals()` hook

2. Component tests:
   - DenominationRow rendering
   - BillsSection rendering
   - CoinsSection rendering
   - AnonymousControls input handling
   - PersonCard rendering and interaction
   - NamedEntriesModal rendering

3. Integration tests:
   - Full modal render
   - Anonymous entry flow
   - Named entry add/edit/delete flow
   - localStorage persistence
   - Data migration from old format
   - Date change clears data
   - Clear all functionality

4. E2E tests (Playwright):
   - User opens modal and enters anonymous cash
   - User adds person and enters named cash
   - User closes and reopens modal (data persistence)
   - User clears all data
   - Date change clears old data
   - Match status displays correctly

5. Quality validation:
   - Zero TypeScript errors
   - Zero LSP warnings
   - 85%+ code coverage
   - ESLint zero warnings
   - Accessibility audit passes

**Acceptance Criteria:**
- [ ] All unit tests pass
- [ ] All component tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Code coverage >= 85%
- [ ] Zero TypeScript errors
- [ ] Zero LSP warnings
- [ ] Zero ESLint warnings
- [ ] Accessibility audit passes
- [ ] Visual regression tests pass (light and dark themes)

**Files Created:**
- `src/components/cash-counter/__tests__/DenominationRow.test.tsx`
- `src/components/cash-counter/__tests__/BillsSection.test.tsx`
- `src/components/cash-counter/__tests__/CoinsSection.test.tsx`
- `src/components/cash-counter/__tests__/PersonCard.test.tsx`
- `src/components/cash-counter/__tests__/NamedEntriesModal.test.tsx`
- `src/hooks/__tests__/useCashTotals.test.ts`
- `src/utils/__tests__/cashCalculations.test.ts`
- `src/utils/__tests__/cashStorage.test.ts`
- `src/components/cash-counter/__tests__/CashCounterModal.integration.test.tsx`
- `e2e/cash-counter.spec.ts`

**Test Coverage Required:**
- Unit: All utilities and hooks
- Component: All UI components
- Integration: Complete user workflows
- E2E: Critical user paths
- Coverage: 85%+ overall

---

## Coverage Verification

### Total Tasks: 8

### Requirements Coverage: 100%

| Requirement Category | Coverage | Tasks |
|---------------------|----------|-------|
| Ubiquitous (6) | 100% | TASK-001, TASK-006, TASK-007, TASK-008 |
| Event-Driven (10) | 100% | TASK-002, TASK-003, TASK-004, TASK-005 |
| State-Driven (7) | 100% | TASK-001, TASK-003, TASK-004, TASK-005, TASK-007 |
| Unwanted (7) | 100% | TASK-001, TASK-004, TASK-005 |
| Optional (5) | 80% | TASK-003 (person cards), TASK-007 (visual indicators) |
| Specifications | 100% | All tasks |

### Acceptance Criteria Coverage: 100%

| Scenario | Tasks |
|----------|-------|
| Scenario 1: Anonymous Cash Entry | TASK-002, TASK-004 |
| Scenario 2: Named Person Entry | TASK-003, TASK-004 |
| Scenario 3: Parallel Entry Workflow | TASK-002, TASK-003, TASK-004 |
| Scenario 4: Person Card Deletion | TASK-003, TASK-005 |
| Scenario 5: Data Persistence | TASK-005 |
| Scenario 6: Date Change Clears Data | TASK-005 |
| Scenario 7: Data Migration from Old Format | TASK-001 |
| Scenario 8: Match Status Calculation | TASK-004 |
| Scenario 9: Clear All Functionality | TASK-005 |
| Scenario 10: Add Multiple Persons | TASK-003 |
| Scenario 11: Empty Person Name Validation | TASK-003 |
| Scenario 12: Denomination Input Validation | TASK-004 |
| Scenario 13: Bills and Coins Breakdown | TASK-002, TASK-004 |
| Scenario 14: Mobile Responsive Layout | TASK-007 |
| Scenario 15: Dark Mode Support | TASK-006 |

### Gaps Identified: None

All SPEC requirements are covered by the 8 tasks. Optional requirements (quick-add buttons, name suggestions, animations) are noted as potential future enhancements.

---

## Task Dependency Graph

```
TASK-001 (State & Migration)
    |
    v
TASK-002 (Core Components)
    |
    v
TASK-003 (Named Entries)
    |
    v
TASK-004 (Calculations)
    |
    v
TASK-005 (Persistence)
    |
    v
TASK-006 (I18n & Theming)
    |
    v
TASK-007 (Mobile & A11y)
    |
    v
TASK-008 (Testing & Quality)
```

---

## Implementation Notes

### Parallelization Opportunities
- TASK-002 and TASK-003 can be developed in parallel by different developers
- TASK-006 (i18n) can be done alongside component development if translation keys are predefined

### Risk Mitigation
- TASK-001 (migration) should be thoroughly tested before proceeding
- TASK-005 (persistence) includes error handling for edge cases
- TASK-008 (testing) validates all previous work

### Rollback Strategy
- Each task can be independently reverted
- Old CashCounterModal can be restored if critical issues found
- V2 data format includes version flag for identification

---

**Document Version:** 1.0
**Last Updated:** 2026-03-05
**Status:** Ready for Implementation
**coverage_verified:** true
