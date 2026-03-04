/**
 * @MX:ANCHOR: QR Code display component with copy functionality
 * @MX:REASON: Public API used by ProjectsPage invite modal (fan_in: 2)
 * @MX:SPEC: SPEC-QR-001, TASK-002
 *
 * Displays a QR code for a given URL with copy-to-clipboard functionality.
 * Copies QR code as PNG image (not URL text) for pasting into email clients.
 * Supports dark mode and custom sizing.
 */

import { useState, useRef } from 'react'
import QRCode from 'react-qr-code'

interface QRCodeDisplayProps {
  /** The URL to encode in the QR code */
  url: string
  /** Translation function */
  t: (key: string) => string
  /** Size of the QR code in pixels (default: 128) */
  size?: number
  /** Whether to apply dark mode styles */
  darkMode?: boolean
}

/**
 * Displays a QR code with copy-to-clipboard functionality.
 * @param props - Component props
 * @returns QR code display component
 */
export function QRCodeDisplay({ url, t, size = 128, darkMode = false }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  /**
   * Copies the QR code as a PNG image to the clipboard.
   * Converts the SVG QR code to a canvas, then to a blob for clipboard.
   */
  const handleCopy = async () => {
    if (!qrRef.current) {
      console.error('QR code element not found')
      return
    }

    try {
      // Get the SVG element from the QRCode component
      const svgElement = qrRef.current.querySelector('svg')
      if (!svgElement) {
        throw new Error('SVG element not found')
      }

      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      // Create an image element
      const img = new Image()
      img.onload = async () => {
        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Could not get canvas context')
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, size, size)

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            throw new Error('Could not convert canvas to blob')
          }

          try {
            // Copy image to clipboard
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ])
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch (error) {
            console.error('Failed to copy image to clipboard:', error)
            // Fallback: copy URL text if image copy fails
            try {
              await navigator.clipboard.writeText(url)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            } catch (fallbackError) {
              console.error('Failed to copy URL as fallback:', fallbackError)
            }
          } finally {
            URL.revokeObjectURL(url)
          }
        }, 'image/png')
      }

      img.onerror = () => {
        console.error('Failed to load SVG as image')
        URL.revokeObjectURL(url)
      }

      img.src = url
    } catch (error) {
      console.error('Failed to copy QR code:', error)
    }
  }

  // Truncate very long URLs for display
  const displayUrl = url.length > 60 ? `${url.substring(0, 57)}...` : url

  return (
    <div className={`flex flex-col items-center gap-4 p-4 ${darkMode ? 'dark' : ''}`}>
      {/* QR Code */}
      {url && (
        <div ref={qrRef} className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <QRCode
            value={url}
            size={size}
            aria-label={`${t('qr.qrCodeFor')}: ${displayUrl}`}
            role="img"
          />
        </div>
      )}

      {/* URL Display */}
      {url && (
        <div className={`text-center text-sm break-all font-medium p-2 rounded ${
          darkMode
            ? 'bg-slate-900 text-primary-400'
            : 'bg-slate-50 text-primary-600'
        }`}>
          {displayUrl}
        </div>
      )}

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        disabled={copied || !url}
        className={`btn btn-secondary w-full max-w-xs ${
          copied ? 'opacity-75 cursor-not-allowed' : ''
        }`}
        aria-label={t('qr.copy')}
        title={t('qr.copy')}
      >
        {copied ? t('qr.copied') : t('qr.copy')}
      </button>
    </div>
  )
}

export default QRCodeDisplay
