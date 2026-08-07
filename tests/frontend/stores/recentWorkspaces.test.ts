import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'
import {
  recentWorkspacesStore,
  type RecentWorkspace,
} from '../../../src/project/recentWorkspaces'

function state(): RecentWorkspace[] {
  return get(recentWorkspacesStore) as RecentWorkspace[]
}

describe('recentWorkspacesStore', () => {
  beforeEach(() => {
    localStorage.clear()
    recentWorkspacesStore.clear()
  })

  describe('initial state', () => {
    it('starts empty when localStorage is clean', () => {
      expect(state()).toHaveLength(0)
    })
  })

  describe('add', () => {
    it('adds a workspace to the list', () => {
      recentWorkspacesStore.add('/home/user/MyProject', 'MyProject')
      expect(state()).toHaveLength(1)
      expect(state()[0].path).toBe('/home/user/MyProject')
      expect(state()[0].name).toBe('MyProject')
    })

    it('moves existing entry to top instead of duplicating', () => {
      recentWorkspacesStore.add('/home/user/a', 'a')
      recentWorkspacesStore.add('/home/user/b', 'b')
      recentWorkspacesStore.add('/home/user/a', 'a')
      expect(state()).toHaveLength(2)
      expect(state()[0].path).toBe('/home/user/a')
      expect(state()[1].path).toBe('/home/user/b')
    })

    it('new entries appear at the top', () => {
      recentWorkspacesStore.add('/home/user/a', 'a')
      recentWorkspacesStore.add('/home/user/b', 'b')
      expect(state()[0].path).toBe('/home/user/b')
    })

    it('caps list at 10 entries', () => {
      for (let i = 1; i <= 12; i++) {
        recentWorkspacesStore.add(`/home/user/project${i}`, `project${i}`)
      }
      expect(state()).toHaveLength(10)
      expect(state()[0].path).toBe('/home/user/project12')
      expect(
        state().find((e) => e.path === '/home/user/project1'),
      ).toBeUndefined()
      expect(
        state().find((e) => e.path === '/home/user/project2'),
      ).toBeUndefined()
    })

    it('persists to localStorage', () => {
      recentWorkspacesStore.add('/home/user/MyProject', 'MyProject')
      const raw = localStorage.getItem('pascoal-recent-workspaces')
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw!)
      expect(parsed[0].path).toBe('/home/user/MyProject')
    })

    it('sets openedAt to a recent timestamp', () => {
      const before = Date.now()
      recentWorkspacesStore.add('/home/user/MyProject', 'MyProject')
      const after = Date.now()
      expect(state()[0].openedAt).toBeGreaterThanOrEqual(before)
      expect(state()[0].openedAt).toBeLessThanOrEqual(after)
    })
  })

  describe('remove', () => {
    it('removes a specific entry', () => {
      recentWorkspacesStore.add('/home/user/a', 'a')
      recentWorkspacesStore.add('/home/user/b', 'b')
      recentWorkspacesStore.remove('/home/user/a')
      expect(state()).toHaveLength(1)
      expect(state()[0].path).toBe('/home/user/b')
    })

    it('is a no-op for an unknown path', () => {
      recentWorkspacesStore.add('/home/user/a', 'a')
      recentWorkspacesStore.remove('/home/user/nonexistent')
      expect(state()).toHaveLength(1)
    })

    it('persists after removal', () => {
      recentWorkspacesStore.add('/home/user/a', 'a')
      recentWorkspacesStore.add('/home/user/b', 'b')
      recentWorkspacesStore.remove('/home/user/a')
      const raw = localStorage.getItem('pascoal-recent-workspaces')
      const parsed = JSON.parse(raw!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].path).toBe('/home/user/b')
    })
  })

  describe('clear', () => {
    it('removes all entries', () => {
      recentWorkspacesStore.add('/home/user/a', 'a')
      recentWorkspacesStore.add('/home/user/b', 'b')
      recentWorkspacesStore.clear()
      expect(state()).toHaveLength(0)
    })

    it('clears localStorage', () => {
      recentWorkspacesStore.add('/home/user/a', 'a')
      recentWorkspacesStore.clear()
      const raw = localStorage.getItem('pascoal-recent-workspaces')
      const parsed = JSON.parse(raw!)
      expect(parsed).toHaveLength(0)
    })
  })

  describe('validate', () => {
    it('is a no-op when __TAURI__ is not available', async () => {
      recentWorkspacesStore.add('/home/user/a', 'a')
      await recentWorkspacesStore.validate()
      expect(state()).toHaveLength(1)
    })

    it('removes entries whose folders do not exist', async () => {
      recentWorkspacesStore.add('/home/user/exists', 'exists')
      recentWorkspacesStore.add('/home/user/missing', 'missing')
        ; (window as any).__TAURI__ = {
          core: {
            invoke: vi.fn((_cmd: string, args: { path: string }) =>
              Promise.resolve(args.path.includes('exists')),
            ),
          },
        } as any

      await recentWorkspacesStore.validate()

      expect(state()).toHaveLength(1)
      expect(state()[0].path).toBe('/home/user/exists')
        ; (window as any).__TAURI__ = undefined as any
    })

    it('keeps entries when file_exists returns true', async () => {
      recentWorkspacesStore.add('/home/user/a', 'a')
      recentWorkspacesStore.add('/home/user/b', 'b')
        ; (window as any).__TAURI__ = {
          core: {
            invoke: vi.fn(() => Promise.resolve(true)),
          },
        } as any

      await recentWorkspacesStore.validate()

      expect(state()).toHaveLength(2)
        ; (window as any).__TAURI__ = undefined as any
    })

    it('removes entries when file_exists invoke throws', async () => {
      recentWorkspacesStore.add('/home/user/a', 'a')
        ; (window as any).__TAURI__ = {
          core: {
            invoke: vi.fn(() => Promise.reject(new Error('not found'))),
          },
        } as any

      await recentWorkspacesStore.validate()

      expect(state()).toHaveLength(0)
        ; (window as any).__TAURI__ = undefined as any
    })
  })
})
