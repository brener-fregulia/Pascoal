import { get, writable } from 'svelte/store'
import { settingsStore } from '../settings/settingsStore'

export type Theme = 'dark' | 'light' | 'charcoal'

const THEMES: Theme[] = ['dark', 'light', 'charcoal']
const LEGACY_STORAGE_KEY = 'pascoal-theme'

function detectSystem(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

/** One-time bridge from the old localStorage-only theme (pre settings
 *  panel) into the settings store. Clears the legacy key either way,
 *  returning null when there was nothing valid to migrate. */
function migrateLegacy(): Theme | null {
  try {
    const saved = localStorage.getItem(LEGACY_STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    return THEMES.includes(saved as Theme) ? (saved as Theme) : null
  } catch {
    return null
  }
}

function createThemeStore() {
  const { subscribe, set } = writable<{ current: Theme }>({
    current: 'dark',
  })

  function apply(theme: Theme) {
    settingsStore.updateSetting('theme', theme)
    set({ current: theme })
  }

  function init() {
    const stored = get(settingsStore).theme
    const theme = stored ?? migrateLegacy() ?? detectSystem()
    apply(theme)

    window
      .matchMedia('(prefers-color-scheme: light)')
      .addEventListener('change', (e) => {
        if (get(settingsStore).theme === null) {
          apply(e.matches ? 'light' : 'dark')
        }
      })
  }

  return { subscribe, init, apply }
}

export const themeStore = createThemeStore()