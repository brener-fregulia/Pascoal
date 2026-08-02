import { writable } from 'svelte/store'
import { isTauriAvailable, invoke } from '../integrations/tauri/client'

export interface Settings {
  autoSaveBeforeRun: boolean
}

const DEFAULTS: Settings = {
  autoSaveBeforeRun: true,
}

function createSettingsStore() {
  const { subscribe, update, set } = writable<Settings>(DEFAULTS)

  async function load() {
    if (!isTauriAvailable()) return
    try {
      const raw = await invoke<string>('load_settings')
      const parsed = JSON.parse(raw)
      set({ ...DEFAULTS, ...parsed })
    } catch {
      // No settings file yet — use defaults
    }
  }

  async function save(settings: Settings) {
    if (!isTauriAvailable()) return
    try {
      await invoke('save_settings', {
        content: JSON.stringify(settings, null, 2),
      })
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    update((s) => {
      const next = { ...s, [key]: value }
      save(next)
      return next
    })
  }

  return { subscribe, load, updateSetting }
}

export const settingsStore = createSettingsStore()
