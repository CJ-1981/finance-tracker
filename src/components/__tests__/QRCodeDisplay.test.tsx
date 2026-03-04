/**
 * @MX:NOTE: Test suite for QRCodeDisplay component (SPEC-QR-001, TASK-002)
 *
 * These tests verify:
 * 1. QR code renders with correct value
 * 2. Copy to clipboard functionality works
 * 3. Dark mode styles are applied
 * 4. Component handles empty/null values gracefully
 * 5. Size prop affects QR code dimensions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QRCodeDisplay } from '../QRCodeDisplay'

describe('QRCodeDisplay', () => {
  const mockUrl = 'https://example.com/invite?token=abc123'
  const t = (key: string) => key // Simplified i18n mock

  let mockClipboard: { writeText: ReturnType<typeof vi.fn> }
  let mockAlert: ReturnType<typeof vi.fn>
  let originalClipboard: typeof navigator.clipboard | undefined
  let originalAlert: typeof window.alert | undefined

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mocks
    mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
    mockAlert = vi.fn()

    // Save originals
    originalClipboard = navigator.clipboard
    originalAlert = window.alert

    // Apply mocks
    Object.assign(navigator, { clipboard: mockClipboard })
    Object.assign(window, { alert: mockAlert })
  })

  afterEach(() => {
    // Restore originals
    if (originalClipboard) {
      Object.assign(navigator, { clipboard: originalClipboard })
    } else {
      delete (navigator as any).clipboard
    }

    if (originalAlert) {
      Object.assign(window, { alert: originalAlert })
    } else {
      delete (window as any).alert
    }
  })

  describe('Rendering', () => {
    it('should render QR code when URL is provided', () => {
      render(<QRCodeDisplay url={mockUrl} t={t} />)

      // QR code SVG should be rendered
      const qrSvg = document.querySelector('svg')
      expect(qrSvg).toBeInTheDocument()
    })

    it('should display the URL below the QR code', () => {
      render(<QRCodeDisplay url={mockUrl} t={t} />)

      expect(screen.getByText(mockUrl)).toBeInTheDocument()
    })

    it('should use custom size when provided', () => {
      render(<QRCodeDisplay url={mockUrl} t={t} size={256} />)

      const qrSvg = document.querySelector('svg')
      expect(qrSvg).toHaveAttribute('height', '256')
      expect(qrSvg).toHaveAttribute('width', '256')
    })

    it('should use default size of 128 when not specified', () => {
      render(<QRCodeDisplay url={mockUrl} t={t} />)

      const qrSvg = document.querySelector('svg')
      expect(qrSvg).toHaveAttribute('height', '128')
      expect(qrSvg).toHaveAttribute('width', '128')
    })

    it('should apply dark mode styles when darkMode is true', () => {
      const { container } = render(<QRCodeDisplay url={mockUrl} t={t} darkMode={true} />)

      // Container should have dark mode class
      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv.className).toContain('dark')
    })
  })

  describe('Copy to Clipboard', () => {
    it('should render copy button', () => {
      render(<QRCodeDisplay url={mockUrl} t={t} />)

      const copyButton = screen.getByRole('button', { name: /qr.copy/i })
      expect(copyButton).toBeInTheDocument()
    })

    it('should copy URL to clipboard when button is clicked', async () => {
      render(<QRCodeDisplay url={mockUrl} t={t} />)

      const copyButton = screen.getByRole('button', { name: /qr.copy/i })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(mockUrl)
      })
    })

    it('should show copied alert after successful copy', async () => {
      render(<QRCodeDisplay url={mockUrl} t={t} />)

      const copyButton = screen.getByRole('button', { name: /qr.copy/i })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(copyButton).toHaveTextContent('qr.copied')
      })
    })

    it('should handle clipboard errors gracefully', async () => {
      // Mock clipboard failure
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'))

      // Mock document.execCommand (not available in jsdom)
      const originalDescriptor = Object.getOwnPropertyDescriptor(document, 'execCommand')
      Object.defineProperty(document, 'execCommand', {
        value: vi.fn().mockReturnValue(false),
        writable: true,
        configurable: true,
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      try {
        render(<QRCodeDisplay url={mockUrl} t={t} />)

        const copyButton = screen.getByRole('button', { name: /qr.copy/i })
        fireEvent.click(copyButton)

        await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalled()
        })
      } finally {
        consoleSpy.mockRestore()
        // Restore original descriptor
        if (originalDescriptor) {
          Object.defineProperty(document, 'execCommand', originalDescriptor)
        } else {
          delete (document as any).execCommand
        }
      }
    })
  })

  describe('Accessibility', () => {
    it('should have accessible label for QR code', () => {
      render(<QRCodeDisplay url={mockUrl} t={t} />)

      const qrSvg = document.querySelector('svg')
      expect(qrSvg).toHaveAttribute('role', 'img')
      expect(qrSvg).toHaveAttribute('aria-label')
    })

    it('should have accessible label for copy button', () => {
      render(<QRCodeDisplay url={mockUrl} t={t} />)

      const copyButton = screen.getByRole('button', { name: /qr.copy/i })
      expect(copyButton).toHaveAttribute('aria-label')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty URL gracefully', () => {
      const { container } = render(<QRCodeDisplay url="" t={t} />)

      // Should still render container
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000) + '?token=' + 'b'.repeat(100)

      render(<QRCodeDisplay url={longUrl} t={t} />)

      // Should truncate display URL with ellipsis
      const displayedUrl = screen.getByText((content) => {
        return content.includes('https://example.com/') && content.includes('...')
      })
      expect(displayedUrl).toBeInTheDocument()

      // Check that truncated text is within expected max length (60 chars)
      expect(displayedUrl.textContent?.length).toBeLessThanOrEqual(60)
    })
  })
})
