import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import { themeStore } from '../../../src/renderer/ide/src/stores/theme'

type Theme = 'dark' | 'light' | 'charcoal'

interface ThemeState {
  current: Theme
}

function state(): ThemeState {
  return get(themeStore) as ThemeState
}

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('starts with dark theme by default', () => {
    themeStore.init()
    expect(state().current).toBe('dark')
  })

  it('restores saved theme from localStorage', () => {
    localStorage.setItem('pascoal-theme', 'charcoal')
    themeStore.init()
    expect(state().current).toBe('charcoal')
  })

  it('ignores invalid saved theme', () => {
    localStorage.setItem('pascoal-theme', 'invalid-theme')
    themeStore.init()
    expect(state().current).toBe('dark')
  })

  it('cycles dark -> light -> charcoal -> dark', () => {
    themeStore.apply('dark')
    themeStore.cycle()
    expect(state().current).toBe('light')

    themeStore.cycle()
    expect(state().current).toBe('charcoal')

    themeStore.cycle()
    expect(state().current).toBe('dark')
  })

  it('persists theme to localStorage on apply', () => {
    themeStore.apply('charcoal')
    expect(localStorage.getItem('pascoal-theme')).toBe('charcoal')
  })

  it('persists theme to localStorage on cycle', () => {
    themeStore.apply('dark')
    themeStore.cycle()
    expect(localStorage.getItem('pascoal-theme')).toBe('light')
  })
})
