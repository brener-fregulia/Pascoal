import { writable, get } from 'svelte/store'
import { isTauriAvailable, invoke } from '../integrations/tauri/client'

export interface RecentFile {
  filePath: string
  fileName: string
  openedAt: number // Unix timestamp ms
  // Workspace folder that was open when this file was opened, if any.
  // Optional so entries persisted before this field existed keep loading.
  workspacePath?: string | null
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
        typeof e.openedAt === 'number' &&
        (e.workspacePath === undefined ||
          e.workspacePath === null ||
          typeof e.workspacePath === 'string'),
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
    if (!isTauriAvailable()) return
    const current = get({ subscribe })
    const results = await Promise.all(
      current.map(async (entry) => {
        try {
          const exists = await invoke<boolean>('file_exists', {
            path: entry.filePath,
          })
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
  function add(filePath: string, workspacePath?: string | null) {
    update((entries) => {
      const fileName = filePath.split(/[\\/]/).pop() ?? filePath
      const filtered = entries.filter((e) => e.filePath !== filePath)
      const next = [
        {
          filePath,
          fileName,
          openedAt: Date.now(),
          workspacePath: workspacePath ?? null,
        },
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
