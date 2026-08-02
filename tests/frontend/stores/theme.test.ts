import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import { themeStore } from '../../../src/shared/theme'
import { settingsStore } from '../../../src/settings/settingsStore'

function current() {
  return get(themeStore).current
}

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    settingsStore.updateSetting('theme', null)
    document.documentElement.removeAttribute('data-theme')
  })

  it('starts with dark theme by default', () => {
    themeStore.init()
    expect(current()).toBe('dark')
  })

  it('restores the theme already saved in settings', () => {
    settingsStore.updateSetting('theme', 'charcoal')
    themeStore.init()
    expect(current()).toBe('charcoal')
  })

  it('migrates a legacy localStorage theme into settings on first init', () => {
    localStorage.setItem('pascoal-theme', 'light')
    themeStore.init()
    expect(current()).toBe('light')
    expect(get(settingsStore).theme).toBe('light')
    expect(localStorage.getItem('pascoal-theme')).toBeNull()
  })

  it('ignores an invalid legacy value', () => {
    localStorage.setItem('pascoal-theme', 'invalid-theme')
    themeStore.init()
    expect(current()).toBe('dark')
  })

  it('persists theme to settings on apply', () => {
    themeStore.apply('charcoal')
    expect(get(settingsStore).theme).toBe('charcoal')
  })
})