import { writable } from 'svelte/store'

export interface Settings {
  autoSaveBeforeRun: boolean
  terminal: {
    position: 'bottom' | 'right'
    docked: boolean
    height: number
    width: number
  }
  editor: {
    fontSize: number
  }
}

const DEFAULTS: Settings = {
  autoSaveBeforeRun: true,
  terminal: {
    position: 'bottom',
    docked: true,
    height: 240,
    width: 400,
  },
  editor: {
    fontSize: 13,
  },
}

function createSettingsStore() {
  const { subscribe, update, set } = writable<Settings>(DEFAULTS)

  async function load() {
    if (!window.__TAURI__) return
    try {
      const raw = await window.__TAURI__.core.invoke<string>('load_settings')
      const parsed = JSON.parse(raw)
      set({ ...DEFAULTS, ...parsed })
    } catch {
      // No settings file yet — use defaults
    }
  }

  async function save(settings: Settings) {
    if (!window.__TAURI__) return
    try {
      await window.__TAURI__.core.invoke('save_settings', {
        content: JSON.stringify(settings, null, 2),
      })
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    update(s => {
      const next = { ...s, [key]: value }
      save(next)
      return next
    })
  }

  return { subscribe, load, updateSetting }
}

export const settingsStore = createSettingsStore()
