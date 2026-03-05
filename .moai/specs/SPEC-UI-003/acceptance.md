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

# Acceptance Criteria: SPEC-UI-003

## Definition of Done

A feature is considered done when:

- [ ] All EARS requirements from `spec.md` are implemented
- [ ] All Given/When/Then scenarios pass verification
- [ ] Code passes TRUST 5 quality gates
- [ ] Test coverage meets or exceeds 85%
- [ ] Zero TypeScript errors and zero LSP warnings
- [ ] Data migration from old format works correctly
- [ ] Dark mode support is complete
- [ ] i18n support is complete (English + Korean)
- [ ] Mobile responsive design is verified
- [ ] Accessibility requirements are met

## Given/When/Then Test Scenarios

### Scenario 1: Anonymous Cash Entry

**GIVEN** the cash counter modal is open
**WHEN** user enters denomination counts in the anonymous section
**THEN** anonymous total updates immediately without requiring "Add Entry" button
**AND** grand total is recalculated to include anonymous amount

### Scenario 2: Named Person Entry

**GIVEN** the cash counter modal is open
**WHEN** user clicks "Add Person" button
**THEN** a new person card appears with name input and denomination inputs
**AND** user can enter counts specific to that person
**AND** person total updates immediately

### Scenario 3: Parallel Entry Workflow

**GIVEN** the cash counter modal is open
**AND** user has entered anonymous cash amounts
**WHEN** user adds a person and enters their cash amounts
**THEN** both anonymous and person totals are visible simultaneously
**AND** no category toggle is required
**AND** grand total reflects sum of both sections

### Scenario 4: Person Card Deletion

**GIVEN** the cash counter modal has multiple person cards
**WHEN** user clicks delete on a person card
**THEN** that person card is removed
**AND** grand total is recalculated excluding deleted person's amounts
**AND** other person cards remain unaffected

### Scenario 5: Data Persistence

**GIVEN** user has entered anonymous and named cash amounts
**WHEN** user closes and reopens the modal on the same date
**THEN** all previously entered amounts are restored
**AND** totals match previous session

### Scenario 6: Date Change Clears Data

**GIVEN** user has cash counting data from a previous date
**WHEN** user opens the modal on a new date
**THEN** previous day's data is cleared
**AND** modal starts with empty state

### Scenario 7: Data Migration from Old Format

**GIVEN** localStorage contains cash counter data in old V1 format
**WHEN** user opens the cash counter modal
**THEN** data is automatically migrated to V2 format
**AND** all amounts from old entries are preserved
**AND** anonymous entries are consolidated
**AND** named entries are preserved as person cards

### Scenario 8: Match Status Calculation

**GIVEN** user has entered cash counting amounts
**WHEN** grand total equals transaction total within tolerance
**THEN** match status displays "Match" with green color
**WHEN** grand total exceeds transaction total
**THEN** match status displays "Excess" with blue color and difference amount
**WHEN** grand total is less than transaction total
**THEN** match status displays "Shortage" with red color and difference amount

### Scenario 9: Clear All Functionality

**GIVEN** user has entered cash counting amounts
**WHEN** user clicks "Clear All" button
**THEN** confirmation dialog is shown
**AND** upon confirmation, all amounts are reset to zero
**AND** all person cards are removed
**AND** localStorage is cleared

### Scenario 10: Add Multiple Persons

**GIVEN** the cash counter modal is open
**WHEN** user adds multiple person cards (e.g., 3 persons)
**THEN** all person cards are visible in the named entries section
**AND** each person card can be edited independently
**AND** "Add Another Person" button remains available
**AND** vertical scrolling works if cards exceed viewport

### Scenario 11: Empty Person Name Validation

**GIVEN** a person card is displayed
**WHEN** user leaves name field empty and tries to add another person
**THEN** validation error is shown
**AND** new person is not created until name is provided

### Scenario 12: Denomination Input Validation

**GIVEN** any denomination input field
**WHEN** user enters negative number
**THEN** value is automatically corrected to zero
**AND** no error message is shown (silent correction)

### Scenario 13: Bills and Coins Breakdown

**GIVEN** user has entered cash amounts in both bills and coins
**WHEN** viewing the grand total section
**THEN** separate totals are shown for bills and coins
**AND** breakdown includes anonymous + all named entries

### Scenario 14: Mobile Responsive Layout

**GIVEN** user is on a mobile device (screen width < 640px)
**WHEN** cash counter modal is opened
**THEN** all sections are vertically stacked
**AND** denomination grids are touch-friendly
**AND** scrolling works smoothly within modal

### Scenario 15: Dark Mode Support

**GIVEN** user has dark mode enabled
**WHEN** cash counter modal is opened
**THEN** all UI elements use dark theme colors
**AND** text contrast meets accessibility standards
**AND** section colors (teal for anonymous, blue for named) remain distinguishable

## Quality Gates

### TRUST 5 Validation

**Tested:**
- Unit tests for all calculation functions
- Integration tests for data migration
- E2E tests for complete user workflows
- 85%+ code coverage

**Readable:**
- Clear component and variable naming
- TypeScript strict mode compliance
- Comments for complex logic
- ESLint zero warnings

**Unified:**
- Consistent with existing modal patterns
- Follows project coding standards
- Tailwind CSS class consistency
- Proper component structure

**Secured:**
- Input sanitization for person names
- XSS prevention
- localStorage error handling
- No data exposure in errors

**Trackable:**
- Conventional commit messages
- SPEC reference in commits
- Clear PR description
- Migration notes in documentation

### Accessibility Testing

- [ ] All denomination inputs have associated labels
- [ ] Screen reader announces match status changes
- [ ] Keyboard navigation works for all interactive elements
- [ ] Focus management on modal open/close
- [ ] Focus moves to newly added person card
- [ ] Color contrast ratios meet WCAG 2.1 AA
- [ ] Error messages are associated with inputs
- [ ] Required fields are properly indicated

### Performance Testing

- [ ] Modal opens in <100ms
- [ ] Total calculation completes in <16ms
- [ ] No memory leaks on unmount
- [ ] localStorage write is debounced
- [ ] Smooth animations (60fps)
- [ ] No layout thrashing

## Verification Methods

### Automated Tests

**Unit Tests:**
```typescript
describe('CashCounterModal', () => {
  describe('calculateTotal', () => {
    it('should sum denomination counts correctly')
    it('should handle empty denomination object')
    it('should handle zero values')
  })

  describe('migrateFromV1', () => {
    it('should migrate anonymous entries')
    it('should preserve named entries')
    it('should handle empty data')
  })

  describe('useCashTotals', () => {
    it('should calculate anonymous total')
    it('should calculate named totals')
    it('should calculate grand total')
    it('should update on denomination change')
  })
})
```

**Integration Tests:**
```typescript
describe('CashCounterModal Integration', () => {
  it('should persist data on close')
  it('should restore data on reopen')
  it('should clear data on date change')
  it('should handle add/delete person')
  it('should calculate match status correctly')
})
```

### Manual Testing Checklist

- [ ] Open modal and verify both sections are visible
- [ ] Enter anonymous cash and verify total updates
- [ ] Add person and verify card appears
- [ ] Enter person cash and verify person total updates
- [ ] Verify grand total includes both sections
- [ ] Close and reopen modal, verify data persisted
- [ ] Delete person card and verify total updated
- [ ] Click clear all and verify confirmation
- [ ] Test on mobile device
- [ ] Test in dark mode

### Browser Testing

Test on following browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Test on following devices:
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

## Success Metrics

1. **Functional Completeness:** 100% of EARS requirements implemented
2. **Test Coverage:** 85%+ code coverage
3. **Quality Gates:** Zero TypeScript errors, zero LSP warnings
4. **Performance:** Modal opens <100ms, totals update <16ms
5. **Accessibility:** WCAG 2.1 AA compliance
6. **Migration Success:** 100% of old data formats migrate correctly

---

**Document Version:** 1.0
**Last Updated:** 2026-03-05
**Status:** Draft
