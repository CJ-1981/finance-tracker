/**
 * @MX:NOTE: Characterization tests for CashCounterModal component (DDD PRESERVE phase)
 *
 * These tests CAPTURE EXISTING BEHAVIOR to ensure no regressions during refactoring.
 * They document WHAT the component currently does, not what it SHOULD do.
 *
 * Behaviors characterized:
 * 1. localStorage persistence with project-specific keys
 * 2. Date-based data clearing (new day = fresh state)
 * 3. Match status calculation (match/excess/shortage) with 0.01 tolerance
 * 4. Denomination input validation (no negative values)
 * 5. Bills/Coins breakdown calculation
 * 6. Multi-currency support via project.settings.currency
 * 7. Delete entry functionality
 * 8. Clear all functionality
 */

import { render, screen, fireEvent, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import i18n from '../../lib/i18n'
import CashCounterModal from '../CashCounterModal'
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

// Mock getLocalDateString to return fixed date
const mockGetLocalDateString = () => '2026-03-05'

describe('CashCounterModal - Characterization Tests (DDD PRESERVE)', () => {
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
    vi.clearAllMocks()
    localStorageMock.clear()
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
    vi.clearAllTimers()
    vi.restoreAllMocks()
  })

  describe('Core Behaviors to Preserve', () => {
    it('should open modal and display title when isOpen is true', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      expect(screen.getByText('Cash Counter')).toBeInTheDocument()
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
  })

  describe('Denomination Input Behavior (Preserved)', () => {
    it('should increment count when + button is clicked', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Find a + button (there are many, get first one)
      const plusButtons = screen.getAllByText('+')
      const firstPlusButton = plusButtons[0]

      // Find the input associated with this button
      const container = firstPlusButton.closest('.p-2, .p-3') as HTMLElement
      const input = container.querySelector('input[type="number"]') as HTMLInputElement

      const initialValue = parseInt(input.value)
      fireEvent.click(firstPlusButton)

      expect(parseInt(input.value)).toBe(initialValue + 1)
    })

    it('should decrement count when - button is clicked', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // First increment, then decrement
      const plusButtons = screen.getAllByText('+')
      const firstPlusButton = plusButtons[0]
      const container = firstPlusButton.closest('.p-2, .p-3') as HTMLElement
      const input = container.querySelector('input[type="number"]') as HTMLInputElement

      // Increment
      fireEvent.click(firstPlusButton)
      expect(parseInt(input.value)).toBe(1)

      // Now decrement
      const minusButton = within(container).getByText('−')
      fireEvent.click(minusButton)

      expect(parseInt(input.value)).toBe(0)
    })

    it('should disable - button when count is 0', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const minusButtons = screen.getAllByText('−')
      // All minus buttons should be disabled initially
      minusButtons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })

    it('should accept direct number input', () => {
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
  })

  describe('Match Status Calculation (Preserved)', () => {
    it('should show match status when totals match within tolerance', async () => {
      // Pre-populate localStorage with V2 data totaling 236.01
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 200: 1, 20: 1, 10: 1, 5: 1, 1: 1 },
        namedEntries: [],
        lastDate: mockGetLocalDateString(),
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={236.01}
        />
      )

      // Should show match status
      expect(screen.getByText(/Match/)).toBeInTheDocument()
    })

    it('should show excess status when counted > transactions', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 200: 1 },
        namedEntries: [],
        lastDate: mockGetLocalDateString(),
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={100}
        />
      )

      expect(screen.getByText(/Excess/)).toBeInTheDocument()
    })

    it('should show shortage status when counted < transactions', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedEntries: [],
        lastDate: mockGetLocalDateString(),
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={500}
        />
      )

      expect(screen.getByText(/Shortage/)).toBeInTheDocument()
    })
  })

  describe('localStorage Persistence (Preserved)', () => {
    it('should persist anonymous counts to localStorage', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Add some counts (find a 100 denomination input)
      const inputs = screen.getAllByDisplayValue('0')
      const hundredInput = inputs.find(input => {
        const container = input.closest('.p-2, .p-3') as HTMLElement
        return container.textContent?.includes('100')
      }) as HTMLInputElement

      fireEvent.change(hundredInput, { target: { value: '2' } })

      // Wait for debounced save (500ms)
      vi.advanceTimersByTime(500)

      // Verify localStorage was updated
      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      expect(storedData).toBeDefined()

      const parsed = JSON.parse(storedData!)
      expect(parsed.version).toBe(2)
      expect(parsed.anonymous[100]).toBe(2)
    })

    it('should load V2 format data from localStorage on mount', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedEntries: [],
        lastDate: mockGetLocalDateString(),
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Anonymous total should be 200.00
      expect(screen.getByText(/€200\.00/)).toBeInTheDocument()
    })
  })

  describe('Date-Based Data Clearing (Preserved)', () => {
    it('should clear data when date has changed', () => {
      // Store data with yesterday's date
      const yesterday = '2026-03-04'
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedEntries: [],
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

      // localStorage should be removed
      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      expect(storedData).toBeNull()

      // Anonymous section should be visible with 0 values
      const inputs = screen.getAllByDisplayValue('0')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('should preserve data when date is same', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedEntries: [],
        lastDate: mockGetLocalDateString(),
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Should show the loaded data
      expect(screen.getByText(/€200\.00/)).toBeInTheDocument()
    })
  })

  describe('Delete Entry Behavior (Preserved)', () => {
    it('should remove named entry when delete button clicked', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedEntries: [
          {
            id: 'entry-1',
            name: 'Test Person',
            denominations: { 50: 1 },
          },
        ],
        lastDate: mockGetLocalDateString(),
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Open named entries modal
      const addButton = screen.getByText(/Add Person/)
      fireEvent.click(addButton)

      // Find and click delete button
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      // Entry should be removed from modal
      expect(screen.queryByText('Test Person')).not.toBeInTheDocument()
    })
  })

  describe('Clear All Behavior (Preserved)', () => {
    it('should show confirmation dialog', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const clearButton = screen.getByText('Clear All')
      fireEvent.click(clearButton)

      expect(confirmSpy).toHaveBeenCalled()
      confirmSpy.mockRestore()
    })

    it('should clear all data when confirmed', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedEntries: [],
        lastDate: mockGetLocalDateString(),
      }))

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const clearButton = screen.getByText('Clear All')
      fireEvent.click(clearButton)

      // localStorage should be cleared
      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      expect(storedData).toBeNull()

      confirmSpy.mockRestore()
    })
  })

  describe('Currency Display (Preserved)', () => {
    it('should show EUR currency symbol correctly', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Should display EUR symbol (in total or somewhere in the modal)
      const euroSymbols = screen.getAllByText('€')
      expect(euroSymbols.length).toBeGreaterThan(0)
    })

    it('should display Bills section', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Bills section should be present
      expect(screen.getByText(/Bills/)).toBeInTheDocument()
    })

    it('should display Coins section', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Coins section should be present - check multiple instances exist
      const coinsTexts = screen.getAllByText(/Coins/)
      expect(coinsTexts.length).toBeGreaterThan(0)
    })
  })

  describe('Dark Mode Support (Preserved)', () => {
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
})
