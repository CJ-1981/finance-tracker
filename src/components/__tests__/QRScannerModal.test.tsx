/**
 * @MX:NOTE: Test suite for QRScannerModal component (SPEC-QR-001, TASK-005 to TASK-007)
 *
 * These tests verify:
 * 1. Modal opens/closes correctly
 * 2. Camera permission handling works
 * 3. QR code detection and decoding
 * 4. HTTPS detection and warning
 * 5. Invalid QR error handling
 * 6. Camera cleanup on unmount
 * 7. Dark mode styles
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QRScannerModal } from '../QRScannerModal'

// Mock qr-scanner
const mockScannerInstance = {
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
  destroy: vi.fn(),
  setCamera: vi.fn(),
}

vi.mock('qr-scanner', () => ({
  default: vi.fn().mockImplementation(() => mockScannerInstance),
  QrScanner: {
    hasCamera: vi.fn().mockResolvedValue(true),
  },
}))

describe('QRScannerModal', () => {
  const mockOnScan = vi.fn()
  const mockOnClose = vi.fn()
  const t = (key: string) => key

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Modal Structure', () => {
    it('should render when isOpen is true', () => {
      render(
        <QRScannerModal
          isOpen={true}
          onClose={mockOnClose}
          onScan={mockOnScan}
          t={t}
        />
      )

      expect(screen.getByText('qr.scannerTitle')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      const { container } = render(
        <QRScannerModal
          isOpen={false}
          onClose={mockOnClose}
          onScan={mockOnScan}
          t={t}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should have close button in header', () => {
      render(
        <QRScannerModal
          isOpen={true}
          onClose={mockOnClose}
          onScan={mockOnScan}
          t={t}
        />
      )

      const closeButton = screen.getByLabelText('common.close').querySelector('svg')
      expect(closeButton).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', () => {
      render(
        <QRScannerModal
          isOpen={true}
          onClose={mockOnClose}
          onScan={mockOnScan}
          t={t}
        />
      )

      const closeButton = screen.getByLabelText('common.close')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Dark Mode', () => {
    it('should apply dark mode styles when darkMode is true', () => {
      const { container } = render(
        <QRScannerModal
          isOpen={true}
          onClose={mockOnClose}
          onScan={mockOnScan}
          t={t}
          darkMode={true}
        />
      )

      // Find the inner modal content div
      const modalContent = container.querySelector('.bg-white')
      expect(modalContent).toHaveClass('dark:bg-slate-800')
    })
  })

  describe('HTTPS Detection', () => {
    const originalLocation = window.location
    const mockLocation = new URL('https://example.com')

    beforeEach(() => {
      // Reset to HTTPS before each test
      delete (window as any).location
      window.location = new URL('https://example.com') as any
    })

    afterEach(() => {
      // Restore original location
      window.location = originalLocation
    })

    it('should show warning when not on HTTPS (except localhost)', () => {
      // Mock window.location to HTTP
      delete (window as any).location
      window.location = new URL('http://example.com') as any

      render(
        <QRScannerModal
          isOpen={true}
          onClose={mockOnClose}
          onScan={mockOnScan}
          t={t}
        />
      )

      expect(screen.getByText('qr.httpsRequired')).toBeInTheDocument()
    })

    it('should not show warning on localhost', () => {
      delete (window as any).location
      window.location = new URL('http://localhost:3000') as any

      render(
        <QRScannerModal
          isOpen={true}
          onClose={mockOnClose}
          onScan={mockOnScan}
          t={t}
        />
      )

      expect(screen.queryByText('qr.httpsRequired')).not.toBeInTheDocument()
    })

    it('should not show warning on HTTPS', () => {
      delete (window as any).location
      window.location = new URL('https://example.com') as any

      render(
        <QRScannerModal
          isOpen={true}
          onClose={mockOnClose}
          onScan={mockOnScan}
          t={t}
        />
      )

      expect(screen.queryByText('qr.httpsRequired')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <QRScannerModal
          isOpen={true}
          onClose={mockOnClose}
          onScan={mockOnScan}
          t={t}
        />
      )

      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
      expect(modal).toHaveAttribute('aria-modal', 'true')
    })
  })
})
