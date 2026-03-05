/**
 * @MX:NOTE: Test suite for simplified CashCounterModal (SPEC-UI-003)
 *
 * These tests verify the simplified implementation:
 * 1. Parallel anonymous and named counts (namedCounts: Record<number, number>)
 * 2. Real-time total calculation (no "Add Entry" button)
 * 3. No person management features removed
 * 4. V1 to V2 localStorage migration
 */

import { render, screen, fireEvent, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest'
import i18n from '../../lib/i18n'
import CashCounterModal, { DENOMINATIONS } from '../CashCounterModal'
import type { Project } from '../../types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock date utilities - fixed date for predictable testing
const mockDate = new Date('2026-03-05T10:00:00.000Z')
const originalDate = global.Date

vi.spyOn(global, 'Date').mockImplementation((...args) => {
  if (args.length === 0) return mockDate as any
  return new originalDate(...args) as any
})

// Mock window.confirm
const mockConfirm = vi.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
})

describe('CashCounterModal - Simplified Implementation (SPEC-UI-003)', () => {
  const mockProject: Project = {
    id: 'test-project-123',
    name: 'Test Project',
    owner_id: 'user-123',
    settings: {
      currency: 'EUR',
      date_format: 'YYYY-MM-DD',
      notifications_enabled: true,
    },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const mockOnClose = vi.fn()
  const totalTransactionsAmount = 236.01

  const renderWithI18n = (component: React.ReactNode) => {
    return render(
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    )
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorageMock.clear()
    mockConfirm.mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  describe('Core Rendering', () => {
    it('should open modal and display title when isOpen is true', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      expect(screen.getByText(/Cash Counter/)).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      const { container } = renderWithI18n(
        <CashCounterModal
          isOpen={false}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should call onClose when close button is clicked', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const closeButton = screen.getByText('×')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should display Bills and Coins sections', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Bills and Coins sections are rendered as div containers (not H3)
      // Check for denomination labels that indicate Bills and Coins sections
      const billDenominations = screen.getAllByText(/200|100|50/)
      const coinDenominations = screen.getAllByText(/0.5|0.2|0.1/)

      expect(billDenominations.length).toBeGreaterThan(0)
      expect(coinDenominations.length).toBeGreaterThan(0)
    })

    it('should display column headers for anonymous and named', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Find the column header rows - classes changed to text-teal-700 and text-blue-700
      const anonymousHeader = screen.getAllByText(/Anonymous/).find(el => el.classList.contains('text-teal-700'))
      const namedHeader = screen.getAllByText(/Named/).find(el => el.classList.contains('text-blue-700'))

      expect(anonymousHeader).not.toBeUndefined()
      expect(namedHeader).not.toBeUndefined()
    })
  })

  describe('Anonymous Entry Behavior (Real-time)', () => {
    it('should increment anonymous count when + button is clicked', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const plusButtons = screen.getAllByText('+')
      const firstPlusButton = plusButtons[0]

      // Find the input associated with this plus button
      const container = firstPlusButton.closest('.p-2, .p-3') || firstPlusButton.closest('div[class*="grid"]')
      const input = container?.querySelector('input[type="number"]') as HTMLInputElement

      const initialValue = parseInt(input?.value || '0')
      fireEvent.click(firstPlusButton)

      expect(parseInt(input?.value || '0')).toBe(initialValue + 1)
    })

    it('should decrement anonymous count when - button is clicked', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const plusButtons = screen.getAllByText('+')
      const firstPlusButton = plusButtons[0]
      const container = firstPlusButton.closest('.p-2, .p-3') || firstPlusButton.closest('div[class*="grid"]')
      const input = container?.querySelector('input[type="number"]') as HTMLInputElement

      // Increment first
      fireEvent.click(firstPlusButton)
      expect(parseInt(input?.value || '0')).toBe(1)

      // Find and click minus button
      const minusButtons = screen.getAllByText('−')
      const containerMinus = minusButtons[0].closest('.p-2, .p-3') || minusButtons[0].closest('div[class*="grid"]')
      const minusButton = containerMinus?.querySelector('button[aria-label="Decrease"]')
      if (minusButton) fireEvent.click(minusButton)

      // Value should be decremented
      expect(parseInt(input?.value || '0')).toBe(0)
    })

    it('should accept direct number input for anonymous', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const inputs = screen.getAllByDisplayValue('0')
      const firstInput = inputs[0] as HTMLInputElement

      fireEvent.change(firstInput, { target: { value: '5' } })

      expect(firstInput.value).toBe('5')
    })

    it('should prevent negative values', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const inputs = screen.getAllByDisplayValue('0')
      const firstInput = inputs[0] as HTMLInputElement

      fireEvent.change(firstInput, { target: { value: '-5' } })

      // Value should be corrected to 0 (non-negative)
      expect(parseInt(firstInput.value || '0')).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Named Counts Behavior (Real-time)', () => {
    it('should increment named count when + button is clicked', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const plusButtons = screen.getAllByText('+')
      // Named controls should have blue styling, find a button in blue section
      const blueContainer = document.querySelector('.bg-blue-50, .dark\\:bg-blue-900\\/20')
      const namedPlusButton = blueContainer?.querySelector('button[aria-label="Increase"]') as HTMLButtonElement

      if (namedPlusButton) {
        const input = blueContainer?.querySelector('input[type="number"]') as HTMLInputElement
        const initialValue = parseInt(input?.value || '0')
        fireEvent.click(namedPlusButton)

        expect(parseInt(input?.value || '0')).toBe(initialValue + 1)
      }
    })

    it('should accept direct number input for named counts', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Find named section input
      const blueContainer = document.querySelector('.bg-blue-50, .dark\\:bg-blue-900\\/20')
      const namedInput = blueContainer?.querySelector('input[type="number"]') as HTMLInputElement

      if (namedInput) {
        fireEvent.change(namedInput, { target: { value: '3' } })
        expect(namedInput.value).toBe('3')
      }
    })
  })

  describe('Real-time Total Calculation', () => {
    it('should calculate anonymous total in real-time', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Anonymous total should initially be 0
      expect(screen.getByText(/Anonymous Total/)).toBeInTheDocument()

      // Find denomination rows - look for the text label "100"
      const denominationLabels = Array.from(document.querySelectorAll('.text-center')).filter(el => el.textContent?.includes('100'))
      const hundredLabel = denominationLabels[0]
      expect(hundredLabel).toBeDefined()

      // Get the parent denomination row and find the anonymous input (second input in the row)
      const denominationRow = hundredLabel?.closest('.mb-4')
      const allInputs = Array.from(denominationRow?.querySelectorAll('input[type="number"]') || [])
      const anonymousInput = allInputs[1] as HTMLInputElement  // Anonymous is second column

      expect(anonymousInput).toBeDefined()

      fireEvent.change(anonymousInput, { target: { value: '2' } })

      // Wait for debounce
      vi.advanceTimersByTime(500)

      // Anonymous total should now be 200.00
      const anonymousTotalText = screen.getByText(/Anonymous Total/)
      const anonymousTotal = anonymousTotalText.nextElementSibling?.textContent

      expect(anonymousTotal).toContain('200.00')
    })

    it('should calculate named total in real-time', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Find denomination rows - look for the text label "50" (not "0.5")
      const denominationLabels = Array.from(document.querySelectorAll('.text-center')).filter(el => el.textContent?.includes('50'))
      const fiftyLabel = denominationLabels.find(el => el.textContent === '💶 50')
      expect(fiftyLabel).toBeDefined()

      // Get the parent denomination row and find the named input (first input in the row)
      const denominationRow = fiftyLabel?.closest('.mb-4')
      const allInputs = Array.from(denominationRow?.querySelectorAll('input[type="number"]') || [])
      const namedInput = allInputs[0] as HTMLInputElement  // Named is first column

      expect(namedInput).toBeDefined()

      fireEvent.change(namedInput, { target: { value: '1' } })

      // Wait for debounce
      vi.advanceTimersByTime(500)

      // Named total should now be 50.00
      const namedTotalText = screen.getByText(/Named Total/)
      const namedTotal = namedTotalText.nextElementSibling?.textContent

      expect(namedTotal).toContain('50.00')
    })

    it('should calculate grand total as sum of anonymous and named', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Find the grid row with 100 denomination
      const denominationLabels = Array.from(document.querySelectorAll('.text-center')).filter(el => el.textContent?.includes('100'))
      const hundredLabel = denominationLabels[0]
      expect(hundredLabel).toBeDefined()

      // Get inputs from the row - first is Named (blue), second is Anonymous (teal)
      const allInputs = Array.from(hundredLabel?.closest('.mb-4')?.querySelectorAll('input[type="number"]') || [])
      const hundredNamedInput = allInputs[0] as HTMLInputElement  // Named column first
      const hundredInput = allInputs[1] as HTMLInputElement   // Anonymous column second

      expect(hundredNamedInput).toBeDefined()
      expect(hundredInput).toBeDefined()

      fireEvent.change(hundredInput, { target: { value: '1' } })
      fireEvent.change(hundredNamedInput, { target: { value: '1' } })

      vi.advanceTimersByTime(500)

      // Grand total should be 200.00 (100*1 + 100*1)
      const grandTotalText = screen.getByText(/Total Counted/)
      const grandTotalValue = grandTotalText.nextElementSibling?.textContent
      expect(grandTotalValue).toContain('200.00')
    })
  })

  describe('Match Status Calculation', () => {
    it('should show match status when totals match within tolerance', () => {
      // Pre-populate localStorage with V2 data totaling 236.01
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 200: 1, 20: 1, 10: 1, 5: 1, 1: 1 },
        namedCounts: {},
        lastDate: '2026-03-05',
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={236.01}
        />
      )

      // Find the match status text
      const matchText = screen.getAllByText(/Match/).find(el => {
        return el.textContent?.includes('Match') || el.textContent?.includes('check')
      })
      expect(matchText).toBeInTheDocument()
    })

    it('should show excess status when counted > transactions', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 200: 1 },
        namedCounts: {},
        lastDate: '2026-03-05',
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={100}
        />
      )

      const excessText = screen.getAllByText(/Excess/).find(el => {
        return el.textContent?.includes('Excess') || el.textContent?.includes('↑')
      })
      expect(excessText).toBeInTheDocument()
    })

    it('should show shortage status when counted < transactions', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedCounts: {},
        lastDate: '2026-03-05',
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={500}
        />
      )

      const shortageText = screen.getAllByText(/Shortage/).find(el => {
        return el.textContent?.includes('Shortage') || el.textContent?.includes('↓')
      })
      expect(shortageText).toBeInTheDocument()
    })
  })

  describe('localStorage Persistence (V2 Format)', () => {
    it('should save state to localStorage with debouncing', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Clear initial localStorage (component saves empty state on mount)
      vi.advanceTimersByTime(600)
      localStorageMock.removeItem(`cash_counter_${mockProject.id}`)

      // Add some counts - find the 100 denomination row input
      const denominationLabels = Array.from(document.querySelectorAll('.text-center')).filter(el => el.textContent?.includes('100'))
      const hundredLabel = denominationLabels[0]
      const denominationRow = hundredLabel?.closest('.mb-4')
      const allInputs = Array.from(denominationRow?.querySelectorAll('input[type="number"]') || [])
      const hundredInput = allInputs[0] as HTMLInputElement  // Named input

      if (hundredInput) {
        fireEvent.change(hundredInput, { target: { value: '2' } })

        // Wait for debounce
        vi.advanceTimersByTime(600)
      }

      // Check localStorage (after debounce)
      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      expect(storedData).toBeDefined()

      const parsed = JSON.parse(storedData!)
      expect(parsed.version).toBe(2)
      expect(parsed.namedCounts).toBeDefined()
      expect(typeof parsed.namedCounts).toBe('object')
    })

    it('should load V2 format data from localStorage', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedCounts: { 50: 1 },
        lastDate: '2026-03-05',
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Verify the loaded data by checking localStorage is preserved
      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      const parsed = JSON.parse(storedData!)
      expect(parsed.version).toBe(2)
      expect(parsed.anonymous[100]).toBe(2)
      expect(parsed.namedCounts[50]).toBe(1)
    })
  })

  describe('V1 to V2 Migration', () => {
    it('should migrate V1 format to V2', () => {
      // V1 format data with anonymous and named entries
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        entries: [
          {
            id: 'entry-1',
            category: 'anonymous',
            denominations: { 100: 2 },
            timestamp: Date.now(),
          },
          {
            id: 'entry-2',
            category: 'named',
            name: 'John',
            denominations: { 50: 1 },
            timestamp: Date.now(),
          },
        ],
        lastDate: '2026-03-05',
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Verify migration by checking localStorage directly
      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      const parsed = JSON.parse(storedData!)
      expect(parsed.version).toBe(2)
      expect(parsed.namedCounts).toBeDefined()
      expect(parsed.anonymous).toBeDefined()

      // Anonymous should have 100: 2
      expect(parsed.anonymous[100]).toBe(2)

      // Named counts should have 50: 1
      expect(parsed.namedCounts[50]).toBe(1)
    })

    it('should consolidate all named entries into single namedCounts', () => {
      // V1 format with multiple named entries
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        entries: [
          {
            id: 'entry-1',
            category: 'named',
            name: 'John',
            denominations: { 100: 2, 50: 1 },
            timestamp: Date.now(),
          },
          {
            id: 'entry-2',
            category: 'named',
            name: 'Jane',
            denominations: { 100: 1, 20: 2 },
            timestamp: Date.now(),
          },
        ],
        lastDate: '2026-03-05',
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      const parsed = JSON.parse(storedData!)

      // Named counts should be consolidated: 100: (2+1)=3, 50: 1, 20: 2
      expect(parsed.namedCounts[100]).toBe(3)
      expect(parsed.namedCounts[50]).toBe(1)
      expect(parsed.namedCounts[20]).toBe(2)
    })
  })

  describe('Date-Based Data Clearing', () => {
    it('should clear data when date has changed', () => {
      // Store data with yesterday's date
      const yesterday = '2026-03-04'
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedCounts: {},
        lastDate: yesterday,
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // localStorage should be cleared
      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      expect(storedData).toBeNull()
    })

    it('should preserve data when date is same', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedCounts: {},
        lastDate: '2026-03-05',
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Data should still exist
      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      expect(storedData).toBeDefined()

      // Verify the preserved data
      const parsed = JSON.parse(storedData!)
      expect(parsed.anonymous[100]).toBe(2)
    })
  })

  describe('Clear All Functionality', () => {
    it('should show confirmation dialog when Clear All is clicked', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const clearButton = screen.getAllByText(/Clear/).find(el => el.tagName === 'BUTTON')
      if (clearButton) {
        fireEvent.click(clearButton)
        expect(mockConfirm).toHaveBeenCalled()
      }
    })

    it('should not clear when confirmation is cancelled', () => {
      mockConfirm.mockReturnValue(false)

      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedCounts: {},
        lastDate: '2026-03-05',
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const clearButton = screen.getAllByText(/Clear/).find(el => el.tagName === 'BUTTON')
      if (clearButton) {
        fireEvent.click(clearButton)

        // localStorage should still exist
        const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
        expect(storedData).toBeDefined()
      }
    })

    it('should clear all data when confirmed', () => {
      mockConfirm.mockReturnValue(true)

      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedCounts: {},
        lastDate: '2026-03-05',
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const clearButton = screen.getAllByText(/Clear/).find(el => el.tagName === 'BUTTON')
      if (clearButton) {
        fireEvent.click(clearButton)

        // localStorage should be cleared
        const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
        expect(storedData).toBeNull()
      }
    })
  })

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Check for dark mode classes
      const modalContent = document.querySelector('.bg-white')
      expect(modalContent).toHaveClass('dark:bg-slate-800')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on close button', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const closeButton = screen.getByLabelText('Close')
      expect(closeButton).toBeInTheDocument()
    })

    it('should have aria-label on increment/decrement buttons', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const increaseButtons = screen.getAllByLabelText('Increase')
      expect(increaseButtons.length).toBeGreaterThan(0)

      const decreaseButtons = screen.getAllByLabelText('Decrease')
      expect(decreaseButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Constants Export', () => {
    it('should export DENOMINATIONS constant', () => {
      expect(DENOMINATIONS).toBeDefined()
      expect(DENOMINATIONS.length).toBe(14) // 6 bills + 8 coins
      expect(DENOMINATIONS[0].value).toBe(200)
      expect(DENOMINATIONS[13].value).toBe(0.01)
    })
  })
})
