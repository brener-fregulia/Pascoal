import { writable, get } from 'svelte/store'
import { isTauriAvailable, invoke } from '../integrations/tauri/client'

export interface RecentWorkspace {
  path: string
  name: string
  openedAt: number // Unix timestamp ms
}

const STORAGE_KEY = 'pascoal-recent-workspaces'
const MAX_ENTRIES = 10

function load(): RecentWorkspace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is RecentWorkspace =>
        typeof e.path === 'string' &&
        typeof e.name === 'string' &&
        typeof e.openedAt === 'number',
    )
  } catch {
    return []
  }
}

function save(entries: RecentWorkspace[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    /* ignore */
  }
}

function createRecentWorkspacesStore() {
  const { subscribe, set, update } = writable<RecentWorkspace[]>(load())

  /** Call once on app init — removes entries whose folders no longer exist on disk. */
  async function validate() {
    if (!isTauriAvailable()) return
    const current = get({ subscribe })
    const results = await Promise.all(
      current.map(async (entry) => {
        try {
          const exists = await invoke<boolean>('file_exists', {
            path: entry.path,
          })
          return exists ? entry : null
        } catch {
          return null
        }
      }),
    )
    const valid = results.filter((e): e is RecentWorkspace => e !== null)
    save(valid)
    set(valid)
  }

  /** Add or move-to-top a workspace. Call after a successful open. */
  function add(path: string, name: string) {
    update((entries) => {
      const filtered = entries.filter((e) => e.path !== path)
      const next = [
        { path, name, openedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ENTRIES)
      save(next)
      return next
    })
  }

  /** Remove a single entry (e.g. user dismisses it manually, or it failed to reopen). */
  function remove(path: string) {
    update((entries) => {
      const next = entries.filter((e) => e.path !== path)
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

export const recentWorkspacesStore = createRecentWorkspacesStore()
