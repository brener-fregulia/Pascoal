import { writable } from 'svelte/store'

type Theme = 'dark' | 'light' | 'charcoal'

const THEMES: Theme[] = ['dark', 'light', 'charcoal']
const STORAGE_KEY = 'pascoal-theme'

function createThemeStore() {
  const { subscribe, update, set } = writable<{ current: Theme }>({ current: 'dark' })

  function detectSystem(): Theme {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }

  function getSaved(): Theme | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return THEMES.includes(saved as Theme) ? (saved as Theme) : null
    } catch {
      return null
    }
  }

  function apply(theme: Theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch { /* ignore */ }
    set({ current: theme })
  }

  function init() {
    const theme = getSaved() ?? detectSystem()
    apply(theme)

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!getSaved()) apply(e.matches ? 'light' : 'dark')
    })
  }

  function cycle() {
    update(state => {
      const next = THEMES[(THEMES.indexOf(state.current) + 1) % THEMES.length]
      try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
      return { current: next }
    })
  }

  return { subscribe, init, apply, cycle }
}

export const themeStore = createThemeStore()
