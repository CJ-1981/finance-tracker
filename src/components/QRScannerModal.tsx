/**
 * @MX:ANCHOR: QR Scanner modal component with camera integration
 * @MX:REASON: Public API used by ConfigPage for scanning invite QR codes (fan_in: 1)
 * @MX:SPEC: SPEC-QR-001, TASK-005 to TASK-007
 * @MX:WARN: Camera resource management - must properly cleanup on unmount to prevent memory leaks
 *
 * Modal component for scanning QR codes using device camera.
 * Handles camera permissions, HTTPS detection, and QR code decoding.
 */

import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import type { default as QrScannerType } from 'qr-scanner'

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
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [isHttpsRequired, setIsHttpsRequired] = useState(false)

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

    const checkCamera = async () => {
      try {
        const hasCam = await QrScanner.hasCamera()
        setHasCamera(hasCam)
      } catch (error) {
        console.error('Error checking camera availability:', error)
        setHasCamera(false)
      }
    }

    checkCamera()
  }, [isOpen])

  // Initialize QR scanner
  useEffect(() => {
    if (!isOpen || !videoRef.current || hasCamera === false || isHttpsRequired) {
      return
    }

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
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
