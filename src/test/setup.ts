import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.URL.createObjectURL for jsdom environment
if (!window.URL.createObjectURL) {
  const blobUrls = new Map<Blob, string>()
  let counter = 0

  Object.defineProperty(window.URL, 'createObjectURL', {
    writable: true,
    value: vi.fn((blob: Blob) => {
      const id = `blob:${counter++}`
      blobUrls.set(blob, id)
      return id
    }),
  })

  Object.defineProperty(window.URL, 'revokeObjectURL', {
    writable: true,
    value: vi.fn((url: string) => {
      for (const [blob, id] of blobUrls.entries()) {
        if (id === url) {
          blobUrls.delete(blob)
          break
        }
      }
    }),
  })
}
