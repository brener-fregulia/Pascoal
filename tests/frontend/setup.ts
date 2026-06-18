import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.__TAURI__ — não existe no jsdom
Object.defineProperty(window, '__TAURI__', {
  value: undefined,
  writable: true,
})

Object.defineProperty(window, '__documentsDir', {
  value: '/home/user/Documents/Pascoal',
  writable: true,
})

Object.defineProperty(window, '__platform', {
  value: 'linux',
  writable: true,
})

// Mock Ace Editor
const mockSession = {
  getValue: vi.fn(() => ''),
  setValue: vi.fn(),
  setTabSize: vi.fn(),
  setUseSoftTabs: vi.fn(),
  on: vi.fn(),
}

Object.defineProperty(window, 'ace', {
  value: {
    edit: vi.fn(() => ({
      setTheme: vi.fn(),
      setOptions: vi.fn(),
      setSession: vi.fn(),
      getSession: vi.fn(() => mockSession),
      resize: vi.fn(),
      focus: vi.fn(),
      renderer: { setScrollMargin: vi.fn() },
    })),
    createEditSession: vi.fn(() => mockSession),
  },
  writable: true,
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
