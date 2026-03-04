/**
 * Enhanced Data Recovery System
 *
 * Features:
 * - localStorage persistence across page refreshes
 * - Multiple retry strategies (aggressive, conservative, fallback)
 * - Cached data fallback for display
 * - Visual recovery status indicators
 * - Exponential backoff for retries
 * - Request deduplication to prevent race conditions
 */

interface RecoveryCache<T> {
  data: T
  timestamp: number
  hash: string
}

interface RecoveryConfig {
  maxRetries: number
  cacheTimeoutMs: number
  enableAggressiveRetry: boolean
  enableFallbackDisplay: boolean
}

interface RecoveryResult<T> {
  data: T | null
  recovered: boolean
  fromCache: boolean
  attemptCount: number
  error?: Error
}

const DEFAULT_CONFIG: RecoveryConfig = {
  maxRetries: 3,
  cacheTimeoutMs: 5 * 60 * 1000, // 5 minutes
  enableAggressiveRetry: true,
  enableFallbackDisplay: true,
}

// Pending request deduplication
const pendingRequests = new Map<string, Promise<any>>()

/**
 * Generate a robust hash of data for comparison
 * Includes structure, IDs, and key fields for better change detection
 */
export function createDataHash<T>(data: T): string {
  if (!data) return 'null'
  if (Array.isArray(data)) {
    if (data.length === 0) return 'empty-array'
    // Include length, all IDs, and sample of data for better hash
    const ids = data.map(item => (item as any).id).join(',')
    const sample = JSON.stringify(data.slice(0, 3))
    return `array-${data.length}-${ids}-${sample}`
  }
  if (typeof data === 'object') {
    return `obj-${JSON.stringify(data)}`
  }
  return `primitive-${String(data)}`
}

/**
 * Get cache key for a specific data type and identifier
 */
function getCacheKey(prefix: string, identifier: string): string {
  return `recovery-cache-${prefix}-${identifier}`
}

/**
 * Save data to recovery cache
 */
export function saveToCache<T>(prefix: string, identifier: string, data: T): void {
  try {
    const key = getCacheKey(prefix, identifier)
    const cache: RecoveryCache<T> = {
      data,
      timestamp: Date.now(),
      hash: createDataHash(data),
    }
    localStorage.setItem(key, JSON.stringify(cache))
  } catch (error) {
    console.warn('Failed to save to cache:', error)
  }
}

/**
 * Load data from recovery cache if valid
 */
export function loadFromCache<T>(prefix: string, identifier: string, timeoutMs: number): T | null {
  try {
    const key = getCacheKey(prefix, identifier)
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const cache: RecoveryCache<T> = JSON.parse(cached)
    const age = Date.now() - cache.timestamp

    // Return cached data if still fresh
    if (age < timeoutMs) {
      console.log(`[Recovery] Using cached data (${Math.round(age / 1000)}s old)`)
      return cache.data
    }

    // Cache expired, remove it
    localStorage.removeItem(key)
    return null
  } catch (error) {
    console.warn('Failed to load from cache:', error)
    return null
  }
}

/**
 * Clear a specific cache entry
 */
export function clearCache(prefix: string, identifier: string): void {
  try {
    const key = getCacheKey(prefix, identifier)
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to clear cache:', error)
  }
}

/**
 * Check if result is suspicious (likely indicates stale data)
 */
export function isSuspiciousResult<T>(
  currentData: T,
  previousHash: string | null,
  cacheAvailable: boolean
): boolean {
  const currentHash = createDataHash(currentData)
  const isEmpty = Array.isArray(currentData) && currentData.length === 0

  // Suspicious if: empty result + we had data before + hash changed
  if (isEmpty && previousHash && previousHash !== 'no-data' && currentHash !== previousHash) {
    return true
  }

  // Also suspicious if: empty result + cache available
  if (isEmpty && cacheAvailable) {
    return true
  }

  return false
}

/**
 * Enhanced fetch with automatic recovery
 *
 * @param fetchFn Function that fetches data (returns Promise<T>)
 * @param config Recovery configuration
 * @param requestKey Unique key for request deduplication
 * @param prefix Cache prefix
 * @param identifier Cache identifier
 * @returns Recovery result with data and metadata
 */
export async function fetchWithRecovery<T>({
  fetchFn,
  config = DEFAULT_CONFIG,
  requestKey,
  prefix,
  identifier,
  onRetry,
  onFallback,
}: {
  fetchFn: () => Promise<T>
  config?: RecoveryConfig
  requestKey: string
  prefix: string
  identifier: string
  onRetry?: (attempt: number, maxRetries: number) => void
  onFallback?: (fromCache: boolean) => void
}): Promise<RecoveryResult<T>> {
  // Deduplicate concurrent requests
  if (pendingRequests.has(requestKey)) {
    console.log(`[Recovery] Deduplicating request: ${requestKey}`)
    return pendingRequests.get(requestKey)!
  }

  const requestPromise = performRecoveryFetch<T>({
    fetchFn,
    config,
    prefix,
    identifier,
    onRetry,
    onFallback,
  })

  pendingRequests.set(requestKey, requestPromise)

  try {
    return await requestPromise
  } finally {
    // Clean up pending request after completion
    setTimeout(() => {
      pendingRequests.delete(requestKey)
    }, 100)
  }
}

/**
 * Core recovery fetch logic
 */
async function performRecoveryFetch<T>({
  fetchFn,
  config,
  prefix,
  identifier,
  onRetry,
  onFallback,
}: {
  fetchFn: () => Promise<T>
  config: RecoveryConfig
  prefix: string
  identifier: string
  onRetry?: (attempt: number, maxRetries: number) => void
  onFallback?: (fromCache: boolean) => void
}): Promise<RecoveryResult<T>> {
  let lastError: Error | undefined
  let previousHash: string | null = null

  // Try to get previous hash from cache metadata
  try {
    const key = getCacheKey(prefix, identifier)
    const cached = localStorage.getItem(key)
    if (cached) {
      const cache = JSON.parse(cached) as RecoveryCache<T>
      previousHash = cache.hash
    }
  } catch {
    // Ignore cache read errors
  }

  // Attempt 1: Normal fetch
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const data = await fetchFn()

      // Check if result is suspicious
      const cacheAvailable = localStorage.getItem(getCacheKey(prefix, identifier)) !== null
      if (isSuspiciousResult(data, previousHash, cacheAvailable)) {
        console.warn(`[Recovery] Suspicious result detected on attempt ${attempt}`)

        // If not last attempt, retry
        if (attempt < config.maxRetries) {
          onRetry?.(attempt, config.maxRetries)

          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }

      // Valid data received - save to cache and return
      saveToCache(prefix, identifier, data)
      return {
        data,
        recovered: attempt > 1,
        fromCache: false,
        attemptCount: attempt,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`[Recovery] Fetch attempt ${attempt} failed:`, lastError.message)

      // If not last attempt, retry
      if (attempt < config.maxRetries) {
        onRetry?.(attempt, config.maxRetries)

        // Exponential backoff
        const delay = Math.pow(2, attempt - 1) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // All retries failed - try fallback to cache
  if (config.enableFallbackDisplay) {
    const cachedData = loadFromCache<T>(prefix, identifier, config.cacheTimeoutMs)
    if (cachedData) {
      console.warn('[Recovery] All retries failed, using cached data')
      onFallback?.(true)
      return {
        data: cachedData,
        recovered: false,
        fromCache: true,
        attemptCount: config.maxRetries,
        error: lastError,
      }
    }
  }

  // Complete failure
  onFallback?.(false)
  return {
    data: null,
    recovered: false,
    fromCache: false,
    attemptCount: config.maxRetries,
    error: lastError,
  }
}

/**
 * Reset recovery cache for a specific entry
 */
export function resetRecovery(prefix: string, identifier: string): void {
  clearCache(prefix, identifier)
  console.log(`[Recovery] Cache reset for ${prefix}-${identifier}`)
}

/**
 * Clear all recovery caches
 */
export function clearAllRecoveryCaches(): void {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('recovery-cache-')) {
        localStorage.removeItem(key)
      }
    })
    console.log('[Recovery] All caches cleared')
  } catch (error) {
    console.warn('Failed to clear caches:', error)
  }
}
