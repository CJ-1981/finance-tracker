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
  /** Optional filename for downloaded QR code (defaults to 'qr-code.png') */
  filename?: string
}

/**
 * Displays a QR code with copy-to-clipboard functionality.
 * @param props - Component props
 * @returns QR code display component
 */
export function QRCodeDisplay({ url, t, size = 128, darkMode = false, filename = 'qr-code.png' }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [copying, setCopying] = useState(false)
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

    setCopying(true)
    console.log('[QR Copy] Starting copy operation...')

    try {
      // Get the SVG element from the QRCode component
      const svgElement = qrRef.current.querySelector('svg')
      if (!svgElement) {
        throw new Error('SVG element not found')
      }
      console.log('[QR Copy] SVG element found')

      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const blobUrl = URL.createObjectURL(svgBlob)
      console.log('[QR Copy] SVG serialized, blob URL created')

      // Use a Promise-based approach for better control flow
      const blob = await new Promise<Blob | null>((resolve, reject) => {
        const img = new Image()

        img.onload = () => {
          console.log('[QR Copy] Image loaded, creating canvas...')
          const canvas = document.createElement('canvas')
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, size, size)
          console.log('[QR Copy] Canvas drawn, converting to blob...')

          canvas.toBlob((blob) => {
            if (blob) {
              console.log('[QR Copy] Blob created successfully')
              resolve(blob)
            } else {
              reject(new Error('Could not convert canvas to blob'))
            }
          }, 'image/png')
        }

        img.onerror = () => {
          console.error('[QR Copy] Failed to load SVG as image')
          URL.revokeObjectURL(blobUrl)
          reject(new Error('Failed to load SVG as image'))
        }

        img.src = blobUrl
      })

      if (!blob) {
        throw new Error('Failed to create blob from canvas')
      }

      // Try to copy image to clipboard
      console.log('[QR Copy] Attempting to copy image to clipboard...')
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        console.log('[QR Copy] Image copied successfully!')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (clipboardError) {
        console.warn('[QR Copy] Image copy failed, trying fallback:', clipboardError)
        // Fallback: copy invite URL text if image copy fails
        await navigator.clipboard.writeText(url)
        console.log('[QR Copy] Fallback URL copied successfully!')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }

      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('[QR Copy] Failed to copy QR code:', error)
    } finally {
      setCopying(false)
    }
  }

  /**
   * Downloads the QR code as a PNG file.
   * Useful for attaching QR codes to emails that don't support image pasting.
   */
  const handleDownload = async () => {
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
      const blobUrl = URL.createObjectURL(svgBlob)

      // Create an image element
      const img = new Image()
      img.onload = () => {
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

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('Could not convert canvas to blob')
            return
          }

          // Create download link
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          // Cleanup
          URL.revokeObjectURL(link.href)
          URL.revokeObjectURL(blobUrl)

          // Show downloaded state
          setDownloaded(true)
          setTimeout(() => setDownloaded(false), 2000)
        }, 'image/png')
      }

      img.onerror = () => {
        console.error('Failed to load SVG as image')
        URL.revokeObjectURL(blobUrl)
      }

      img.src = blobUrl
    } catch (error) {
      console.error('Failed to download QR code:', error)
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

      {/* Action Buttons */}
      <div className="flex gap-2 w-full max-w-xs">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          disabled={copied || copying || !url}
          className={`btn btn-secondary flex-1 ${
            (copied || copying) ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          aria-label={t('qr.copy')}
          title={t('qr.copy')}
        >
          {copying ? '...' : copied ? t('qr.copied') : t('qr.copy')}
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={downloaded || !url}
          className={`btn btn-secondary flex-1 ${
            downloaded ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          aria-label={t('qr.download')}
          title={t('qr.download')}
        >
          {downloaded ? t('qr.downloaded') : t('qr.download')}
        </button>
      </div>
    </div>
  )
}

export default QRCodeDisplay
