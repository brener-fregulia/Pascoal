import { get, writable } from 'svelte/store'
import { settingsStore } from '../settings/settingsStore'

export interface ThemeDefinition {
  id: string
  /** Drives light/dark-dependent styling (logo filter, CodeMirror's dark
   *  flag, light-only highlight tweaks) without listing every theme id. */
  appearance: 'dark' | 'light'
  /** Untranslated display name. Themes without one are shown through the
   *  `settings.theme_<id>` i18n key; set it for palette candidates that are
   *  still being evaluated so they need no translations yet. */
  label?: string
}

/** Every selectable theme. Adding one takes an entry here plus a palette
 *  file in src/styles/themes/ imported from global.css. */
const THEME_LIST = [
  { id: 'dark', appearance: 'dark' },
  { id: 'light', appearance: 'light' },
  { id: 'charcoal', appearance: 'dark' },
  { id: 'slate', appearance: 'dark' },
] as const satisfies readonly ThemeDefinition[]

export type Theme = (typeof THEME_LIST)[number]['id']

export const THEMES: readonly (ThemeDefinition & { id: Theme })[] = THEME_LIST

const LEGACY_STORAGE_KEY = 'pascoal-theme'

export function isTheme(value: unknown): value is Theme {
  return THEMES.some((theme) => theme.id === value)
}

export function themeDefinition(id: Theme): ThemeDefinition {
  return THEMES.find((theme) => theme.id === id)!
}

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
    return isTheme(saved) ? saved : null
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
    // A saved theme can disappear when a palette candidate is removed from
    // THEMES, so it is validated instead of trusted.
    const stored = get(settingsStore).theme
    const theme =
      (isTheme(stored) ? stored : null) ?? migrateLegacy() ?? detectSystem()
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
