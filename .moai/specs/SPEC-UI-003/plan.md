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

# Implementation Plan: SPEC-UI-003

## Technical Approach

### Phase 1: State Consolidation

**Objective:** Simplify state management by removing category toggle and consolidating data structure

**Current State Complexity:**
- 7 state variables: `category`, `entryName`, `anonymousCounts`, `namedCounts`, `entries`, `totalCashCounted`
- Category toggle creates disjointed workflow
- "Add Entry" button adds intermediate step

**Target State Structure:**
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
```

**Implementation Steps:**
1. Remove `category` state (no longer needed)
2. Remove `entryName` state (moved to named entry cards)
3. Remove `totalCashCounted` state (derived from anonymous + named entries)
4. Consolidate `anonymousCounts` and `namedCounts` into unified state structure
5. Remove "current entry" concept - all inputs are live

### Phase 2: UI Layout Restructuring

**Objective:** Create ultra-compact denomination grid with two input columns per row

**Layout Strategy:**

1. **Denomination Row Structure (Desktop):**
   - Single list of denominations (not duplicated)
   - Each row: `[Denomination Label] | [Anonymous Input] | [Named Sum Input]`
   - Named column shows sum of ALL named persons for that denomination
   - Column widths: Label (80px) | Anon (100px) | Named (100px) | flexible

2. **Bills Section:**
   - 6 denomination rows (200, 100, 50, 20, 10, 5)
   - Yellow/gold background for bills section
   - Section totals: Anon bills | Named bills | Grand bills

3. **Coins Section:**
   - 8 denomination rows (2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01)
   - Gray/silver background for coins section
   - Section totals: Anon coins | Named coins | Grand coins

4. **Named Entries Management:**
   - "Add Person" button opens detail modal or expands section
   - Detail view shows individual person denomination breakdowns
   - Individual person totals editable in detail view
   - Named column on main view shows calculated sum

5. **Grand Total Section (Bottom):**
   - Full width
   - Match status display
   - Clear all button

6. **Mobile Layout (<768px):**
   - Denomination rows stack vertically
   - Anonymous input on row 1, Named input on row 2
   - Full-width inputs for better touch targets

**Component Structure:**
```tsx
<CashCounterModal>
  <ModalHeader />

  {/* Bills Section */}
  <BillsSection>
    <DenominationHeader>
      <ColumnHeader>Denomination</ColumnHeader>
      <ColumnHeader>Anonymous</ColumnHeader>
      <ColumnHeader>Named</ColumnHeader>
    </DenominationHeader>
    {DENOMINATIONS.filter(d => d.type === 'bill').map(denom => (
      <DenominationRow key={denom.value}>
        <DenominationLabel>{denom.label}</DenominationLabel>
        <AnonymousControls>
          <DecrementButton onClick={() => handleDecrement('anonymous', denom.value)} />
          <NumberInput
            value={anonymous[denom.value]}
            onChange={(e) => handleDirectInput('anonymous', denom.value, e.target.value)}
          />
          <IncrementButton onClick={() => handleIncrement('anonymous', denom.value)} />
        </AnonymousControls>
        <NamedControls>
          <DecrementButton onClick={() => handleDecrement('namedSum', denom.value)} />
          <NumberInput
            value={namedSum[denom.value]}
            readOnly
          />
          <IncrementButton onClick={() => handleIncrement('namedSum', denom.value)} />
        </NamedControls>
      </DenominationRow>
    ))}
    <BillsTotalsRow anonTotal={...} namedTotal={...} />
  </BillsSection>

  {/* Coins Section */}
  <CoinsSection>
    <DenominationHeader>
      <ColumnHeader>Denomination</ColumnHeader>
      <ColumnHeader>Anonymous</ColumnHeader>
      <ColumnHeader>Named</ColumnHeader>
    </DenominationHeader>
    {DENOMINATIONS.filter(d => d.type === 'coin').map(denom => (
      <DenominationRow key={denom.value}>
        <DenominationLabel>{denom.label}</DenominationLabel>
        <AnonymousControls>
          <DecrementButton onClick={() => handleDecrement('anonymous', denom.value)} />
          <NumberInput
            value={anonymous[denom.value]}
            onChange={(e) => handleDirectInput('anonymous', denom.value, e.target.value)}
          />
          <IncrementButton onClick={() => handleIncrement('anonymous', denom.value)} />
        </AnonymousControls>
        <NamedControls>
          <DecrementButton onClick={() => handleDecrement('namedSum', denom.value)} />
          <NumberInput
            value={namedSum[denom.value]}
            readOnly
          />
          <IncrementButton onClick={() => handleIncrement('namedSum', denom.value)} />
        </NamedControls>
      </DenominationRow>
    ))}
    <CoinsTotalsRow anonTotal={...} namedTotal={...} />
  </CoinsSection>

  {/* Grand Total */}
  <GrandTotalSection>
    <MatchStatus />
  </GrandTotalSection>

  {/* Actions */}
  <AddPersonButton />
  <ClearAllButton />
</CashCounterModal>

{/* Named Entries Detail Modal */}
<NamedEntriesModal isOpen={showNamedModal}>
  {namedEntries.map(entry => (
    <PersonCard key={entry.id}>
      <PersonNameInput value={entry.name} />
      <DenominationGrid>
        {DENOMINATIONS.map(denom => (
          <DenominationControl key={denom.value}>
            <DenominationLabel>{denom.label}</DenominationLabel>
            <DecrementButton onClick={() => handlePersonDecrement(entry.id, denom.value)} />
            <NumberInput
              value={entry.denominations[denom.value]}
              onChange={(e) => handlePersonDirectInput(entry.id, denom.value, e.target.value)}
            />
            <IncrementButton onClick={() => handlePersonIncrement(entry.id, denom.value)} />
          </DenominationControl>
        ))}
      </DenominationGrid>
      <PersonTotal value={...} />
      <DeleteButton />
    </PersonCard>
  ))}
  <AddAnotherPersonButton />
</NamedEntriesModal>
```

### Phase 3: Data Migration Strategy

**Objective:** Ensure backward compatibility with existing localStorage data

**Migration Detection:**
```typescript
function loadData(): CashCounterState {
  const stored = localStorage.getItem(storageKey)
  if (!stored) return initialState

  const data = JSON.parse(stored) as StoredCashData | StoredCashDataV2

  // Check for version flag (new format)
  if ('version' in data && data.version === 2) {
    return migrateFromV2(data)
  }

  // Old format - migrate
  return migrateFromV1(data)
}
```

**V1 to V2 Migration:**
```typescript
function migrateFromV1(data: StoredCashData): CashCounterState {
  const anonymous: Record<number, number> = {}
  const namedEntries: NamedEntry[] = []

  for (const entry of data.entries) {
    if (entry.category === 'anonymous') {
      // Sum all anonymous entries
      for (const [value, count] of Object.entries(entry.denominations)) {
        const numValue = parseFloat(value)
        anonymous[numValue] = (anonymous[numValue] || 0) + count
      }
    } else {
      // Preserve named entries
      namedEntries.push({
        id: entry.id,
        name: entry.name || 'Person',
        denominations: entry.denominations
      })
    }
  }

  return { anonymous, namedEntries }
}
```

### Phase 4: Real-Time Total Calculation

**Objective:** Eliminate "Add Entry" button by making all inputs live

**Calculation Strategy:**
```typescript
function useCashTotals(state: CashCounterState) {
  // Anonymous total
  const anonymousTotal = useMemo(
    () => calculateTotal(state.anonymous),
    [state.anonymous]
  )

  // Named entries totals
  const namedTotals = useMemo(
    () => state.namedEntries.map(entry => ({
      id: entry.id,
      name: entry.name,
      total: calculateTotal(entry.denominations)
    })),
    [state.namedEntries]
  )

  // Grand total
  const grandTotal = useMemo(
    () => anonymousTotal + namedTotals.reduce((sum, t) => sum + t.total, 0),
    [anonymousTotal, namedTotals]
  )

  return { anonymousTotal, namedTotals, grandTotal }
}
```

**Persistence Strategy:**
- Auto-save to localStorage on any denomination change
- Debounce saves to avoid excessive writes (300ms delay)
- No explicit "save" action needed

## Risk Analysis

### High Risk Items

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Comprehensive migration testing with V1 data samples |
| Performance degradation with many person cards | Medium | Limit max persons (suggested: 10), use React.memo for cards |
| localStorage quota exceeded | Medium | Monitor storage usage, show warning before limit |

### Medium Risk Items

| Risk | Impact | Mitigation |
|------|--------|------------|
| User confusion from layout change | Medium | On-screen help text, intuitive section labels |
| Mobile scrolling with expanded cards | Medium | Collapsible denomination sections in person cards |
| Accessibility regression | Medium | ARIA labels, keyboard navigation testing |

## Migration Path

### Step 1: Preparation
1. Create backup of current localStorage data format
2. Write migration unit tests
3. Prepare rollback strategy (can revert to old component)

### Step 2: Implementation
1. Create new state structure
2. Implement migration logic
3. Build new UI components
4. Wire up real-time calculations

### Step 3: Testing
1. Test migration from old format
2. Test new UI with various scenarios
3. Test localStorage persistence
4. Test mobile responsiveness

### Step 4: Deployment
1. Deploy with feature flag (optional)
2. Monitor for errors
3. Gather user feedback

## Testing Strategy

### Unit Tests
1. `migrateFromV1()` - Test various V1 data scenarios
2. `calculateTotal()` - Test denomination summation
3. `useCashTotals()` - Test hook calculation logic

### Integration Tests
1. Full modal render test
2. Anonymous entry flow
3. Named entry add/edit/delete flow
4. localStorage persistence
5. Data migration from old format

### E2E Tests
1. User opens modal and enters anonymous cash
2. User adds person and enters named cash
3. User closes and reopens modal (data persistence)
4. User clears all data
5. Date change clears old data

### Visual Regression Tests
1. Light theme modal appearance
2. Dark theme modal appearance
3. Mobile layout (various screen sizes)
4. Multiple person cards layout

## Performance Considerations

### Optimization Strategies

1. **Debounce Persistence:**
   ```typescript
   const debouncedSave = useMemo(
     () => debounce((state) => saveToLocalStorage(state), 300),
     []
   )
   ```

2. **Memoized Calculations:**
   - Use `useMemo` for total calculations
   - Only recalculate when relevant state changes

3. **Person Card Optimization:**
   - Use `React.memo` for person cards
   - Only re-render when that person's data changes

4. **Lazy Rendering:**
   - Consider virtual scrolling for many person cards (>5)

## Rollback Strategy

If critical issues are discovered:

1. **Immediate Rollback:**
   - Revert to previous `CashCounterModal.tsx` version
   - Old code can still read V1 data format

2. **Data Recovery:**
   - V2 data includes `version` flag for identification
   - Can write reverse migration (V2 to V1) if needed

3. **Feature Flag (Optional):**
   - Wrap new UI in feature flag
   - Allow quick switch between old and new

## Milestones

### Milestone 1: Core Refactoring (Primary Goal)
- Remove category toggle state
- Consolidate state structure
- Implement parallel anonymous/named sections
- Real-time total calculation
- Basic persistence

### Milestone 2: Enhanced Features (Secondary Goal)
- Person card add/delete functionality
- Data migration from old format
- Collapsible denomination sections
- Clear all functionality

### Milestone 3: Polish and Optimization (Final Goal)
- Animations for card add/remove
- Performance optimizations
- Accessibility improvements
- Comprehensive testing

## Dependencies

### Internal Dependencies
- Existing `Project` type from `../types`
- Existing `getCurrencyEmoji` function
- Existing i18n setup

### External Dependencies
- React 19.2.4
- i18next 25.8.13
- Tailwind CSS 3.4.19

### No New Dependencies Required
- All functionality achievable with existing stack

## Success Criteria

1. **Functional:**
   - All denomination inputs contribute immediately to totals
   - Anonymous and named entries work in parallel
   - Data persists across modal close/reopen
   - Migration from old format works correctly

2. **Performance:**
   - Modal opens in <100ms
   - Total updates in <16ms (60fps)
   - No memory leaks on modal close

3. **User Experience:**
   - Reduced steps to complete cash counting
   - Clear visual separation between sections
   - Intuitive person card management

4. **Quality:**
   - Zero TypeScript errors
   - Zero LSP warnings
   - 85%+ test coverage
   - Accessibility compliance (WCAG 2.1 AA)

---

**Document Version:** 1.0
**Last Updated:** 2026-03-05
**Status:** Draft
