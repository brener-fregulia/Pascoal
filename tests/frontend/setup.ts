import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.__TAURI__ — not available in jsdom
// configurable: true is required so individual tests can override via vi.stubGlobal
Object.defineProperty(window, '__TAURI__', {
  value: undefined,
  writable: true,
  configurable: true,
})

Object.defineProperty(window, '__documentsDir', {
  value: '/home/user/Documents/Pascoal',
  writable: true,
  configurable: true,
})

Object.defineProperty(window, '__platform', {
  value: 'linux',
  writable: true,
  configurable: true,
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn((query: string) => ({
    matches: query.includes('light') ? false : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
})