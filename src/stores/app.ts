import { writable } from 'svelte/store'

interface AppInfo {
  name: string
  version: string
  fpcInstalled: boolean
  fpcVersion: string | null
  platform: string
  documentsDir: string
}

interface AppState {
  info: AppInfo | null
  loading: boolean
}

function createAppStore() {
  const { subscribe, set } = writable<AppState>({ info: null, loading: true })

  async function init() {
    if (!window.__TAURI__) {
      set({
        info: {
          name: 'Pascoal',
          version: '—',
          fpcInstalled: false,
          fpcVersion: null,
          platform: 'linux',
          documentsDir: '',
        },
        loading: false,
      })
      return
    }

    try {
      type RawAppInfo = {
        name: string
        version: string
        fpc_installed: boolean
        fpc_version: string | null
        platform: string
        documents_dir: string
      }
      const raw = (await window.__TAURI__.core.invoke(
        'get_app_info',
      )) as RawAppInfo

      const info: AppInfo = {
        name: raw.name,
        version: raw.version,
        fpcInstalled: raw.fpc_installed,
        fpcVersion: raw.fpc_version,
        platform: raw.platform,
        documentsDir: raw.documents_dir,
      }

      window.__documentsDir = info.documentsDir
      window.__platform = info.platform

      set({ info, loading: false })
    } catch (e) {
      console.error('get_app_info failed:', e)
      set({ info: null, loading: false })
    }
  }

  return { subscribe, init }
}

export const appStore = createAppStore()
