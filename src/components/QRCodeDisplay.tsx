/**
 * @MX:ANCHOR: QR Code display component with copy functionality
 * @MX:REASON: Public API used by ProjectsPage invite modal (fan_in: 2)
 * @MX:SPEC: SPEC-QR-001, TASK-002
 *
 * Displays a QR code for a given URL with copy-to-clipboard functionality.
 * Supports dark mode and custom sizing.
 */

import { useState } from 'react'
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      alert(t('qr.copied'))
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        alert(t('qr.copied'))
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError)
      }
      document.body.removeChild(textArea)
    }
  }

  // Truncate very long URLs for display
  const displayUrl = url.length > 60 ? `${url.substring(0, 57)}...` : url

  return (
    <div className={`flex flex-col items-center gap-4 p-4 ${darkMode ? 'dark' : ''}`}>
      {/* QR Code */}
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <QRCode
          value={url || '#'}
          size={size}
          aria-label={`${t('qr.qrCodeFor')}: ${displayUrl}`}
          role="img"
        />
      </div>

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
