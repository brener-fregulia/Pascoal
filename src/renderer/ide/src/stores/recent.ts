import { writable, get } from 'svelte/store'

export interface RecentFile {
  filePath: string
  fileName: string
  openedAt: number // Unix timestamp ms
}

const STORAGE_KEY = 'pascoal-recent-files'
const MAX_ENTRIES = 10

function load(): RecentFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is RecentFile =>
        typeof e.filePath === 'string' &&
        typeof e.fileName === 'string' &&
        typeof e.openedAt === 'number',
    )
  } catch {
    return []
  }
}

function save(entries: RecentFile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    /* ignore */
  }
}

function createRecentStore() {
  const { subscribe, set, update } = writable<RecentFile[]>(load())

  /** Call once on app init — removes entries whose files no longer exist on disk. */
  async function validate() {
    if (!window.__TAURI__) return
    const current = get({ subscribe })
    const results = await Promise.all(
      current.map(async (entry) => {
        try {
          const exists = (await window.__TAURI__.core.invoke('file_exists', {
            path: entry.filePath,
          })) as boolean
          return exists ? entry : null
        } catch {
          return null
        }
      }),
    )
    const valid = results.filter((e): e is RecentFile => e !== null)
    save(valid)
    set(valid)
  }

  /** Add or move-to-top a file. Call after a successful open. */
  function add(filePath: string) {
    update((entries) => {
      const fileName = filePath.split(/[\\/]/).pop() ?? filePath
      const filtered = entries.filter((e) => e.filePath !== filePath)
      const next = [
        { filePath, fileName, openedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ENTRIES)
      save(next)
      return next
    })
  }

  /** Remove a single entry (e.g. user dismisses it manually). */
  function remove(filePath: string) {
    update((entries) => {
      const next = entries.filter((e) => e.filePath !== filePath)
      save(next)
      return next
    })
  }

  function clear() {
    save([])
    set([])
  }

  return { subscribe, validate, add, remove, clear }
}

export const recentStore = createRecentStore()
