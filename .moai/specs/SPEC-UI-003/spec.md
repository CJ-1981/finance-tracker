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

# SPEC-UI-003: Compact Cash Counter UI Refactor

## TAG BLOCK

```yaml
SPEC_ID: SPEC-UI-003
TITLE: Compact Cash Counter UI Refactor
DOMAIN: UI
PRIORITY: Medium
STATUS: Draft
CREATED: 2026-03-05
ISSUE: Refactoring request
```

## Environment

**Project Context:**
- Financial Tracking Web Application built with React 19, TypeScript, Vite
- Supabase backend with project and transaction management
- Existing CashCounterModal with category toggle workflow
- Current implementation at `src/components/CashCounterModal.tsx`

**Browser Environment:**
- Modern browsers with ES6+ support
- Mobile-optimized responsive design required
- Touch-friendly interface for denomination inputs

**Development Environment:**
- React 19.2.4 with TypeScript
- Tailwind CSS 3.4.19 for styling
- i18next 25.8.13 for internationalization
- LocalStorage for cash counting data persistence

## Assumptions

1. **User Workflow:** Users frequently need to count both anonymous cash and named person entries in the same session
2. **Current Pain Points:** The category toggle switch disrupts workflow; the "Add Entry" button adds unnecessary steps
3. **Data Persistence:** Existing localStorage format must be migrated to new data structure
4. **Real-Time Totals:** Users expect to see running totals update immediately as they enter denominations
5. **Mobile Usage:** Primary usage is on mobile devices, requiring compact vertical layout
6. **Single Entry Session:** Most users complete all cash counting in one session without switching between categories
7. **Named Entry Patterns:** Users typically enter 2-5 named entries per cash counting session

## Requirements

### Ubiquitous Requirements (System-Wide)

The system **SHALL** maintain existing modal patterns for cash counter interface

The system **SHALL** support dark mode for all cash counter UI elements

The system **SHALL** provide internationalization support for all cash counter user-facing text

The system **SHALL** preserve existing data model compatibility with `CashEntry` interface

The system **SHALL** maintain localStorage persistence with project-specific storage keys

The system **SHALL** preserve existing match status calculation logic (match/excess/shortage)

### Event-Driven Requirements (WHEN...THEN...)

**WHEN** cash counter modal opens, **THEN** the system **SHALL** display anonymous section in left column and named entries in right column (two-column parallel layout)

**WHEN** user enters any denomination count, **THEN** the system **SHALL** immediately update running totals for that section

**WHEN** user adds a named person entry, **THEN** the system **SHALL** create new person card with denomination inputs

**WHEN** user clicks delete on a person card, **THEN** the system **SHALL** remove that card and subtract its amounts from totals

**WHEN** user changes any denomination input, **THEN** the system **SHALL** recalculate and display updated section total immediately

**WHEN** modal opens with existing localStorage data, **THEN** the system **SHALL** restore previous anonymous counts and named entries from current date

**WHEN** date changes from previous session, **THEN** the system **SHALL** clear all previous data and reset to empty state

**WHEN** user closes modal, **THEN** the system **SHALL** persist current state to localStorage without requiring "Add Entry" button

**WHEN** grand total matches transaction total within tolerance, **THEN** the system **SHALL** display match status with green indicator

### State-Driven Requirements (IF...THEN...)

**IF** anonymous section has any non-zero denomination counts, **THEN** the system **SHALL** include anonymous total in grand total calculation

**IF** named entries list is empty, **THEN** the system **SHALL** display "Add Person" button in right column with empty state message

**IF** named entries list contains entries, **THEN** the system **SHALL** display all person cards with individual totals

**IF** user enters invalid (negative) denomination value, **THEN** the system **SHALL** automatically correct to zero

**IF** localStorage data format is from old version, **THEN** the system **SHALL** migrate to new data structure automatically

**IF** all denomination inputs are zero across all sections, **THEN** the system **SHALL** display zero total with neutral match status

**IF** user has added named entries, **THEN** the system **SHALL** provide "Add Another Person" button for quick addition

**IF** screen width is less than 768px (mobile), **THEN** the system **SHALL** stack columns vertically with anonymous section on top and named entries below

### Unwanted Requirements (SHALL NOT...)

The system **SHALL NOT** require category toggle switch between anonymous and named entry modes

The system **SHALL NOT** require "Add Entry" button to commit denomination counts to totals

The system **SHALL NOT** lose entered data when switching between anonymous and named sections

The system **SHALL NOT** display denomination inputs more than once per section (shared inputs, not duplicated)

The system **SHALL NOT** allow empty person names (must have at least one character)

The system **SHALL NOT** persist data across different dates (clear on date change)

The system **SHALL NOT** show separate "current entry" total - all inputs contribute directly to final total

### Optional Requirements (Nice-to-Have)

**WHERE POSSIBLE**, the system **SHOULD** provide quick-add buttons for common named entry patterns (e.g., "Person 1", "Person 2")

**WHERE POSSIBLE**, the system **SHOULD** remember frequently used person names and suggest them

**WHERE POSSIBLE**, the system **SHOULD** provide visual indication (color/border) to distinguish anonymous vs named sections

**WHERE POSSIBLE**, the system **SHOULD** animate addition/removal of person cards for better UX

**WHERE POSSIBLE**, the system **SHOULD** provide "Clear All" confirmation to prevent accidental data loss

## Specifications

### New UI Layout Design

**Layout Structure (Compact Two-Column Denomination Grid):**

```
+----------------------------------------------------------+
| Header: 🧮 Cash Counter                          [× Close]|
+----------------------------------------------------------+
|                                                          |
|  💵 BILLS                                                |
|  ┌─────────┬─────────────────────────┬─────────────────┐│
|  │         │ Anonymous              │ Named           ││
|  ├─────────┼─────────────────────────┼─────────────────┤│
|  │ 200     │ [-] [______] [+]       │ [-] [______] [+]││
|  │ 100     │ [-] [______] [+]       │ [-] [______] [+]││
|  │ 50      │ [-] [______] [+]       │ [-] [______] [+]││
|  │ 20      │ [-] [______] [+]       │ [-] [______] [+]││
|  │ 10      │ [-] [______] [+]       │ [-] [______] [+]││
|  │ 5       │ [-] [______] [+]       │ [-] [______] [+]││
|  ├─────────┼─────────────────────────┼─────────────────┤│
|  │ Totals  │ €123.45                 │ €86.55          ││
|  └─────────┴─────────────────────────┴─────────────────┘│
|                                                          |
|  ⚪ COINS                                                |
|  ┌─────────┬─────────────────────────┬─────────────────┐│
|  │         │ Anonymous              │ Named           ││
|  ├─────────┼─────────────────────────┼─────────────────┤│
|  │ 2       │ [-] [______] [+]       │ [-] [______] [+]││
|  │ 1       │ [-] [______] [+]       │ [-] [______] [+]││
|  │ 0.50    │ [-] [______] [+]       │ [-] [______] [+]││
|  │ 0.20    │ [-] [______] [+]       │ [-] [______] [+]││
|  │ 0.10    │ [-] [______] [+]       │ [-] [______] [+]││
|  │ 0.05    │ [-] [______] [+]       │ [-] [______] [+]││
|  │ 0.02    │ [-] [______] [+]       │ [-] [______] [+]││
|  │ 0.01    │ [-] [______] [+]       │ [-] [______] [+]││
|  ├─────────┼─────────────────────────┼─────────────────┤│
|  │ Totals  │ €15.67                  │ €10.34          ││
|  └─────────┴─────────────────────────┴─────────────────┘│
|                                                          |
|  +--------------------------------------------------+     |
|  | GRAND TOTAL: €236.01              ✓ Match        |     |
|  | Transactions Total: €236.01                       |     |
|  | Difference: €0.00                                 |     |
|  +--------------------------------------------------+     |
|                                                          |
|  [+ Add Person]                            [Clear All]  |
+----------------------------------------------------------+
```

**Control Button Behavior:**
- **[-] button**: Decrements count by 1 (disabled when count is 0)
- **[+] button**: Increments count by 1
- **[______] input**: Direct number entry (supports typing any value)
- All three controls work together for flexible input

**Key Design Features:**
- **Ultra-compact**: Single list of denominations (not duplicated)
- **Two columns per row**: Anonymous controls | Named controls (sum of all persons)
- **Named column shows**: Calculated sum from all named persons for that denomination
- **Dual input methods**: Buttons for quick adjustments, direct input for precise values
- **No section totals column**: Only individual Anon and Named totals shown
- **Grand total**: Only displayed in main totals section at bottom

**When "Add Person" is clicked:**
Shows detail modal to manage individual named persons:

```
Named Entries Detail:
┌─────────────────────────────────────────────────┐
│ Person 1                          [Delete]     │
│ Name: [Person 1]                              │
│ 200: [-] [__] [+]   100: [-] [__] [+]  ...  │
│ 2:   [-] [__] [+]   1:   [-] [__] [+]  ...  │
│ Total: €45.23                                 │
├─────────────────────────────────────────────────┤
│ Person 2                          [Delete]     │
│ Name: [Person 2]                              │
│ [Denomination controls with +/- buttons]      │
│ Total: €41.32                                 │
└─────────────────────────────────────────────────┘
```

**Mobile Layout (<768px):**
- Each denomination row takes full width
- Anonymous controls ([-][input][+]) on top row
- Named controls ([-][input][+]) below
- Rows stack vertically

### Component Architecture

**Component Name:** `CashCounterModal` (refactored)

**Location:** `src/components/CashCounterModal.tsx`

**State Management:**

```typescript
// New consolidated state structure
interface CashCounterState {
  anonymous: {
    denominations: Record<number, number>
  }
  namedEntries: Array<{
    id: string
    name: string
    denominations: Record<number, number>
  }>
}
```

**Key Changes from Current Implementation:**

1. **Removed States:**
   - `category: 'named' | 'anonymous'` - No longer needed with parallel view
   - `entryName: string` - Moved to named entry cards
   - `totalCashCounted: number` - Calculated from combined state

2. **New States:**
   - `anonymousCounts` - Direct state (no longer switched)
   - `namedEntries` - Array of named entry objects with embedded denomination counts

3. **Data Flow Changes:**
   - All denomination inputs contribute immediately to totals
   - No "Add Entry" intermediate step
   - Real-time total calculation as user types

### Data Structure Changes

**Old localStorage format:**

```typescript
interface StoredCashData {
  projectId: string
  entries: CashEntry[]  // Flattened array
  lastDate: string
}
```

**New localStorage format:**

```typescript
interface StoredCashDataV2 {
  projectId: string
  version: 2  // Version flag for migration
  anonymous: Record<number, number>
  namedEntries: Array<{
    id: string
    name: string
    denominations: Record<number, number>
  }>
  lastDate: string
}
```

**Migration Strategy:**

On load, check for `version` field:
- If missing (old format), migrate entries to new structure
- If version 2, load directly

### Section Details

#### Anonymous Section

**Purpose:** Cash counting without person attribution

**Layout:**
- Section title: "Anonymous Cash" or "General Cash"
- Bills grid: All bill denominations (200, 100, 50, 20, 10, 5)
- Coins grid: All coin denominations (2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01)
- Section total: Displays sum of all anonymous denomination inputs
- Styling: Teal/green color theme to distinguish from named section

#### Named Entries Section

**Purpose:** Cash counting attributed to specific people

**Layout:**
- Section title: "Named Entries" or "Person Entries"
- List of person cards (initially empty, user adds)
- Each person card contains:
  - Name input field
  - Delete button
  - Bills section (collapsible for compact view)
  - Coins section (collapsible for compact view)
  - Person total display
- "Add Person" button below card list
- Styling: Blue color theme to distinguish from anonymous section

#### Grand Total Section

**Purpose:** Display overall totals and match status

**Layout:**
- Grand total: Sum of anonymous + all named entries
- Bills breakdown: Total from all sections
- Coins breakdown: Total from all sections
- Transaction total: From project transactions
- Match status: Visual indicator (match/excess/shortage)
- Color coding: Green (match), Blue (excess), Red (shortage)

### I18n Keys

**Add to `src/locales/en.json`:**

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
    "entries": "Entries",
    "delete": "Delete"
  }
}
```

**Add to `src/locales/ko.json` (Korean translations):**

All English keys above MUST have corresponding Korean translations. Korean translations follow the same nested structure and use Korean text for all user-facing strings.

### Integration Points

**File:** `src/pages/ProjectDetailPage.tsx`

**Integration:** Existing CashCounterModal import and usage remains unchanged

**Props:** No changes to props interface (`isOpen`, `onClose`, `project`, `totalTransactionsAmount`)

**Events:** Same callback pattern for close button

## Security Considerations

1. **Input Validation:** All denomination inputs must be validated as non-negative numbers
2. **XSS Prevention:** Person names must be sanitized before display to prevent script injection
3. **Data Integrity:** localStorage writes must be wrapped in try-catch to handle quota exceeded errors
4. **Migration Safety:** Version flag prevents data corruption from format mismatches

## Error Handling

| Error Scenario | User Message | Action |
|----------------|--------------|--------|
| localStorage quota exceeded | "Storage full. Some data could not be saved." | Show warning, keep data in memory |
| Migration fails | "Could not load previous data. Starting fresh." | Reset to empty state |
| Invalid denomination input | Auto-correct to zero | Silent correction, no message |
| Empty person name | "Please enter a name" | Show error, prevent entry creation |
| Clear all confirmation | "Are you sure?" | Show confirmation dialog |

## Accessibility Requirements

- All denomination inputs must have associated labels
- Section headers must use semantic HTML (h2, h3)
- Match status must be announced to screen readers
- Keyboard navigation must work for all inputs and buttons
- Focus must be managed when adding/removing person cards
- Color alone must not convey status (use icons + text)

## Traceability

**Traceability Tags:**
- `@TAG:SPEC-UI-003` - All implementation files related to this SPEC
- `@TAG:CASH-COUNTER` - Cash counter components
- `@TAG:PARALLEL-ENTRY` - Parallel anonymous and named entry feature
- `@TAG:UI-REFACTOR` - UI refactoring work

**Related Files:**
- `src/components/CashCounterModal.tsx` (refactor)
- `src/pages/ProjectDetailPage.tsx` (integration point, no changes expected)
- `src/locales/en.json` (modify)
- `src/locales/ko.json` (modify)

**Reference Components:**
- `TransactionModal.tsx` (modal pattern reference)
- `QRScannerModal.tsx` (compact modal pattern reference)

---

**Document Version:** 1.0
**Last Updated:** 2026-03-05
**Status:** Draft
