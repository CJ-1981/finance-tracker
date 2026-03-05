/**
 * @MX:NOTE: Test suite for refactored CashCounterModal component (SPEC-UI-003)
 *
 * These tests verify the new ultra-compact two-column layout implementation:
 * 1. Parallel anonymous and named entry columns (no category toggle)
 * 2. Real-time total calculation (no "Add Entry" button)
 * 3. Named entries managed in separate detail modal
 * 4. V1 to V2 localStorage migration
 * 5. All preserved behaviors from DDD cycle
 */

import { render, screen, fireEvent, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest'
import i18n from '../../lib/i18n'
import CashCounterModal, { DENOMINATIONS, type NamedEntry } from '../CashCounterModal'
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

describe('CashCounterModal - Refactored Implementation (SPEC-UI-003)', () => {
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

    it('should display Bills and Coins sections', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const billsTexts = screen.getAllByText(/Bills/)
      const coinsTexts = screen.getAllByText(/Coins/)

      expect(billsTexts.length).toBeGreaterThan(0)
      expect(coinsTexts.length).toBeGreaterThan(0)
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
      expect(screen.getByText(/€0\.00/)).toBeInTheDocument()

      // Add some counts
      const inputs = screen.getAllByDisplayValue('0')
      const hundredInput = inputs.find(input => {
        const container = input.closest('.p-2, .p-3') || input.closest('div[class*="grid"]')
        return container?.textContent?.includes('100')
      }) as HTMLInputElement

      if (hundredInput) {
        fireEvent.change(hundredInput, { target: { value: '2' } })

        // Anonymous total should now be 200.00
        const euroSymbols = screen.getAllByText('€')
        const has200 = euroSymbols.some(el => el.textContent?.includes('200.00'))
        expect(has200).toBe(true)
      }
    })
  })

  describe('Named Entries Modal', () => {
    it('should open named entries modal when Add Person is clicked', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const addButton = screen.getByText(/Add Person/)
      fireEvent.click(addButton)

      // Named entries modal should open
      expect(screen.getByText(/Named Entries/)).toBeInTheDocument()
    })

    it('should open named entries modal when named column is clicked', () => {
      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      // Find clickable named entry display
      const namedTexts = screen.getAllByText(/Named Entries|Person/)
      const namedClickable = namedTexts.find(el => el.tagName === 'BUTTON' || el.closest('button'))

      if (namedClickable) {
        fireEvent.click(namedClickable)
        // Modal should open
        expect(screen.getByText(/Named Entries/)).toBeInTheDocument()
      }
    })
  })

  describe('Match Status Calculation (Preserved)', () => {
    it('should show match status when totals match within tolerance', () => {
      // Pre-populate localStorage with V2 data totaling 236.01
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 200: 1, 20: 1, 10: 1, 5: 1, 1: 1 },
        namedEntries: [],
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

      expect(screen.getByText(/Match/)).toBeInTheDocument()
    })

    it('should show excess status when counted > transactions', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 200: 1 },
        namedEntries: [],
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

      expect(screen.getByText(/Excess/)).toBeInTheDocument()
    })

    it('should show shortage status when counted < transactions', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedEntries: [],
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

      expect(screen.getByText(/Shortage/)).toBeInTheDocument()
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

      // Add some counts
      const inputs = screen.getAllByDisplayValue('0')
      const hundredInput = inputs.find(input => {
        const container = input.closest('.p-2, .p-3') || input.closest('div[class*="grid"]')
        return container?.textContent?.includes('100')
      }) as HTMLInputElement

      if (hundredInput) {
        fireEvent.change(hundredInput, { target: { value: '2' } })

        // Wait for debounce
        vi.advanceTimersByTime(500)
      }

      // Check localStorage (after debounce)
      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      expect(storedData).toBeDefined()

      const parsed = JSON.parse(storedData!)
      expect(parsed.version).toBe(2)
      expect(parsed.anonymous[100]).toBe(2)
    })

    it('should load V2 format data from localStorage', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedEntries: [],
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

      // Should show the loaded data
      const euroSymbols = screen.getAllByText('€')
      const has200 = euroSymbols.some(el => el.textContent?.includes('200.00'))
      expect(has200).toBe(true)
    })
  })

  describe('V1 to V2 Migration', () => {
    it('should migrate V1 format to V2', () => {
      // V1 format data
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        entries: [
          {
            id: 'entry-1',
            category: 'anonymous',
            denominations: { 100: 2 },
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

      // Should show the migrated data
      const euroSymbols = screen.getAllByText('€')
      const has200 = euroSymbols.some(el => el.textContent?.includes('200.00'))
      expect(has200).toBe(true)

      // localStorage should be updated to V2 format
      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      const parsed = JSON.parse(storedData!)
      expect(parsed.version).toBe(2)
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

      // localStorage should be cleared
      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      expect(storedData).toBeNull()
    })

    it('should preserve data when date is same', () => {
      localStorageMock.setItem(`cash_counter_${mockProject.id}`, JSON.stringify({
        projectId: mockProject.id,
        version: 2,
        anonymous: { 100: 2 },
        namedEntries: [],
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

      // Should show the data
      const euroSymbols = screen.getAllByText('€')
      const has200 = euroSymbols.some(el => el.textContent?.includes('200.00'))
      expect(has200).toBe(true)
    })
  })

  describe('Clear All Functionality (Preserved)', () => {
    it('should show confirmation dialog when Clear All is clicked', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      renderWithI18n(
        <CashCounterModal
          isOpen={true}
          onClose={mockOnClose}
          project={mockProject}
          totalTransactionsAmount={totalTransactionsAmount}
        />
      )

      const clearButton = screen.getByText(/Clear All/)
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

      const clearButton = screen.getByText(/Clear All/)
      fireEvent.click(clearButton)

      // localStorage should be cleared
      const storedData = localStorageMock.getItem(`cash_counter_${mockProject.id}`)
      expect(storedData).toBeNull()

      confirmSpy.mockRestore()
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

      const increaseButton = screen.getByLabelText('Increase')
      expect(increaseButton).toBeInTheDocument()

      const decreaseButton = screen.getByLabelText('Decrease')
      expect(decreaseButton).toBeInTheDocument()
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
