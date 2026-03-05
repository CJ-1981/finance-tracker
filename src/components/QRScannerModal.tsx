/**
 * @MX:ANCHOR: QR Scanner modal component with camera integration
 * @MX:REASON: Public API used by ConfigPage for scanning invite QR codes (fan_in: 1)
 * @MX:SPEC: SPEC-QR-001, TASK-005 to TASK-007
 * @MX:WARN: Camera resource management - must properly cleanup on unmount to prevent memory leaks
 *
 * Modal component for scanning QR codes using device camera or file upload.
 * Handles camera permissions, HTTPS detection, and QR code decoding.
 */

import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import type { default as QrScannerType } from 'qr-scanner'
import jsQR from 'jsqr'

interface QRScannerModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal is closed */
  onClose: () => void
  /** Callback when a QR code is successfully scanned */
  onScan: (result: string) => void
  /** Translation function */
  t: (key: string) => string
  /** Whether to apply dark mode styles */
  darkMode?: boolean
}

/**
 * Checks if the current page is served over HTTPS or localhost.
 * HTTPS is required for camera access in modern browsers.
 */
function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false
  // Use native API when available, with fallback for older browsers
  if ('isSecureContext' in window && (window as Window & { isSecureContext?: boolean }).isSecureContext !== undefined) {
    return (window as Window & { isSecureContext: boolean }).isSecureContext
  }
  return window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
}

/**
 * Modal component for scanning QR codes using device camera.
 * @param props - Component props
 * @returns QR scanner modal component
 */
export function QRScannerModal({
  isOpen,
  onClose,
  onScan,
  t,
  darkMode = false
}: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScannerType | null>(null)
  const hasScannedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [isHttpsRequired, setIsHttpsRequired] = useState(false)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Reset transient scanner state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPermissionDenied(false)
      setScanError(null)
      setIsHttpsRequired(false)
      setHasCamera(null)
      hasScannedRef.current = false
      setFilePreview(null)
      setUploadError(null)
    }
  }, [isOpen])

  // Check for HTTPS requirement on mount
  useEffect(() => {
    if (isOpen && !isSecureContext()) {
      setIsHttpsRequired(true)
    } else {
      setIsHttpsRequired(false)
    }
  }, [isOpen])

  // Check for camera availability
  useEffect(() => {
    if (!isOpen) return

    let mounted = true

    const checkCamera = async () => {
      try {
        const hasCam = await QrScanner.hasCamera()
        if (mounted) {
          setHasCamera(hasCam)
        }
      } catch (error) {
        console.error('Error checking camera availability:', error)
        if (mounted) {
          setHasCamera(false)
        }
      }
    }

    checkCamera()

    return () => {
      mounted = false
    }
  }, [isOpen])

  // Initialize QR scanner (only when hasCamera is confirmed true)
  useEffect(() => {
    if (!isOpen || !videoRef.current || hasCamera !== true || isHttpsRequired) {
      return
    }

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        // Prevent duplicate scan delivery
        if (hasScannedRef.current) {
          return
        }
        hasScannedRef.current = true

        // Stop scanner immediately
        if (scannerRef.current) {
          scannerRef.current.stop()
          scannerRef.current.destroy()
          scannerRef.current = null
        }

        // QR code detected successfully
        onScan(result.data)
        onClose()
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    )

    scannerRef.current = scanner

    // Start scanning
    scanner.start().catch((error) => {
      console.error('Failed to start QR scanner:', error)
      if (error.name === 'NotAllowedError') {
        setPermissionDenied(true)
      } else {
        setScanError(t('qr.scanFailed'))
      }
    })

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
        scannerRef.current.destroy()
        scannerRef.current = null
      }
    }
  }, [isOpen, hasCamera, isHttpsRequired, onScan, onClose, t])

  // Handle file upload and QR code decoding
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset error state
    setUploadError(null)
    setScanError(null)

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setUploadError(t('qr.invalidImage'))
      return
    }

    // Create image preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string
      setFilePreview(imageDataUrl)

      // Create an image element to decode QR code
      const img = new Image()
      img.onload = () => {
        // Create a canvas to extract image data
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setUploadError(t('qr.invalidImage'))
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Get image data for jsQR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Attempt to decode QR code
        const code = jsQR(
          imageData.data,
          imageData.width,
          imageData.height,
          {
            inversionAttempts: 'dontInvert'
          }
        )

        if (code) {
          // QR code found - trigger scan callback
          hasScannedRef.current = true
          onScan(code.data)
          onClose()
        } else {
          // No QR code found in image
          setUploadError(t('qr.noQrFound'))
        }
      }
      img.onerror = () => {
        setUploadError(t('qr.invalidImage'))
      }
      img.src = imageDataUrl
    }
    reader.onerror = () => {
      setUploadError(t('qr.invalidImage'))
    }
    reader.readAsDataURL(file)
  }

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={t('qr.scannerTitle')}
    >
      <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'dark' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t('qr.scannerTitle')}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label={t('common.close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {t('qr.scannerDescription')}
        </p>

        {/* HTTPS Warning */}
        {isHttpsRequired && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-300">
                  {t('qr.httpsRequired')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Camera Warning */}
        {hasCamera === false && (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mb-4">
            <p className="text-slate-600 dark:text-slate-400 text-center">
              {t('qr.noCamera')}
            </p>
          </div>
        )}

        {/* Permission Denied */}
        {permissionDenied && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">
                  {t('qr.permissionDenied')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scan Error */}
        {scanError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">
                  {scanError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Camera View */}
        {hasCamera === true && !permissionDenied && !isHttpsRequired && (
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              className="w-full"
              muted
              playsInline
            />
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">
                  {uploadError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File Preview */}
        {filePreview && (
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <img
              src={filePreview}
              alt="QR code preview"
              className="w-full"
            />
          </div>
        )}

        {/* File Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full btn btn-primary mb-3"
          disabled={hasScannedRef.current}
        >
          {t('qr.uploadImage')}
        </button>

        {/* Divider */}
        {(hasCamera === true && !permissionDenied && !isHttpsRequired) && (
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-slate-400 dark:text-slate-600 text-sm">
              {t('qr.or')}
            </span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full btn btn-secondary"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  )
}

export default QRScannerModal
