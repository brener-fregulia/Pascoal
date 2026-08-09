import { writable, get } from 'svelte/store'
import { EditorState } from '@codemirror/state'
import { pascalExtensions } from './editor-extensions'
import { pascalTreeSitterHighlight } from '../language/pascal/pascal-treesitter'
import { t } from '../i18n'
import { ask } from '@tauri-apps/plugin-dialog'
import { isTauriAvailable, invoke } from '../integrations/tauri/client'

let tabCounter = 0

export interface Tab {
  id: string
  filePath: string | null
  fileName: string
  isDirty: boolean
  state: EditorState
}

interface TabState {
  tabs: Tab[]
  activeTabId: string | null
  activeView: 'welcome' | 'editor' | 'diff'
  welcomeClosed: boolean
}

function createTabStore() {
  const { subscribe, update, set } = writable<TabState>({
    tabs: [],
    activeTabId: null,
    activeView: 'welcome',
    welcomeClosed: false,
  })

  function getState() {
    return get({ subscribe })
  }

  function makeEditorState(content: string, tabId: string): EditorState {
    return EditorState.create({
      doc: content,
      extensions: pascalExtensions(() => markDirty(tabId), pascalTreeSitterHighlight),
    })
  }
  async function newTab(content: string): Promise<Tab> {
    const state = getState()
    const existingNames = state.tabs.map((t) => t.fileName)

    let candidate = 'untitled.pas'
    let n = 1

    while (
      existingNames.includes(candidate) ||
      (isTauriAvailable() &&
        window.__documentsDir &&
        (await invoke<boolean>('file_exists', {
          path: `${window.__documentsDir}/${candidate}`,
        })))
    ) {
      n++
      candidate = `untitled-${n}.pas`
    }

    const id = `tab-${++tabCounter}`
    const tab: Tab = {
      id,
      filePath: null,
      fileName: candidate,
      isDirty: false,
      state: makeEditorState(content, id),
    }

    update((s) => ({ ...s, tabs: [...s.tabs, tab] }))
    return tab
  }

  async function openFile(filePath: string, content: string): Promise<Tab> {
    const state = getState()
    const existing = state.tabs.find((t) => t.filePath === filePath)
    if (existing) {
      activate(existing.id)
      return existing
    }

    const id = `tab-${++tabCounter}`
    const fileName = filePath.split(/[\\/]/).pop() ?? filePath
    const tab: Tab = {
      id,
      filePath,
      fileName,
      isDirty: false,
      state: makeEditorState(content, id),
    }

    update((s) => ({ ...s, tabs: [...s.tabs, tab] }))
    return tab
  }

  // Called by Editor.svelte whenever CodeMirror dispatches a transaction
  function updateEditorState(id: string, state: EditorState) {
    update((s) => ({
      ...s,
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, state } : t)),
    }))
  }

  function activate(id: string) {
    update((s) => ({ ...s, activeTabId: id, activeView: 'editor' }))
  }

  function showWelcome() {
    update((s) => ({ ...s, activeView: 'welcome', welcomeClosed: false }))
  }

  // Called from the Welcome tab's own close (X) button in the tab bar -
  // lets the user dismiss the welcome screen even with no other tabs open,
  // instead of it always being forced back into view. Reopened via
  // showWelcome() (Help > Welcome).
  function closeWelcome() {
    update((s) => ({ ...s, welcomeClosed: true }))
  }

  // Used by diffTabStore - a diff tab isn't part of `tabs`, so it just
  // points activeTabId at a diff tab's id instead of a file tab's.
  function activateDiff(id: string) {
    update((s) => ({ ...s, activeTabId: id, activeView: 'diff' }))
  }

  // Called by diffTabStore when the active diff tab is closed and no
  // other diff tab takes its place - falls back to the last file tab,
  // or welcome if there are none.
  function fallbackFromDiff() {
    update((s) => {
      if (s.tabs.length > 0) {
        const last = s.tabs[s.tabs.length - 1]
        return { ...s, activeTabId: last.id, activeView: 'editor' }
      }
      return { ...s, activeTabId: null, activeView: 'welcome' }
    })
  }

  function markDirty(id: string) {
    update((s) => ({
      ...s,
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, isDirty: true } : t)),
    }))
  }

  function markClean(id: string) {
    update((s) => ({
      ...s,
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, isDirty: false } : t)),
    }))
  }

  async function close(id: string): Promise<boolean> {
    const state = getState()
    const tab = state.tabs.find((t) => t.id === id)
    if (!tab) return false

    if (tab.isDirty) {
      const confirmed = isTauriAvailable()
        ? await ask(t('tabs.unsaved_confirm', { name: tab.fileName }), { title: 'Pascoal', kind: 'warning' })
        : window.confirm(t('tabs.unsaved_confirm', { name: tab.fileName }))
      if (!confirmed) return false
    }

    update((s) => {
      const index = s.tabs.findIndex((t) => t.id === id)
      const newTabs = s.tabs.filter((t) => t.id !== id)
      let activeTabId = s.activeTabId
      let activeView = s.activeView

      if (s.activeTabId === id) {
        if (newTabs.length > 0) {
          activeTabId = newTabs[Math.min(index, newTabs.length - 1)].id
          activeView = 'editor'
        } else {
          activeTabId = null
          activeView = 'welcome'
        }
      }

      return { tabs: newTabs, activeTabId, activeView }
    })

    return true
  }

  function updateFilePath(id: string, filePath: string) {
    const fileName = filePath.split(/[\\/]/).pop() ?? filePath
    update((s) => ({
      ...s,
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, filePath, fileName } : t)),
    }))
  }

  // Called after a file or folder is renamed in the explorer. Any open tab
  // whose filePath is exactly `oldPrefix` (the renamed file itself) or that
  // starts with `oldPrefix` followed by a path separator (a file inside a
  // renamed folder) gets its filePath rewritten with `newPrefix`, so saving
  // an already-open tab keeps writing to the file's new location instead of
  // a path that no longer exists.
  function remapPaths(oldPrefix: string, newPrefix: string) {
    update((s) => ({
      ...s,
      tabs: s.tabs.map((t) => {
        if (t.filePath == null) return t

        let newFilePath: string | null = null
        if (t.filePath === oldPrefix) {
          newFilePath = newPrefix
        } else if (
          t.filePath.startsWith(oldPrefix + '/') ||
          t.filePath.startsWith(oldPrefix + '\\')
        ) {
          newFilePath = newPrefix + t.filePath.slice(oldPrefix.length)
        }

        if (newFilePath === null) return t
        const fileName = newFilePath.split(/[\\/]/).pop() ?? newFilePath
        return { ...t, filePath: newFilePath, fileName }
      }),
    }))
  }

  function getActive(): Tab | null {
    const state = getState()
    return state.tabs.find((t) => t.id === state.activeTabId) ?? null
  }

  function reset() {
    tabCounter = 0
    set({ tabs: [], activeTabId: null, activeView: 'welcome', welcomeClosed: false })
  }

  return {
    subscribe,
    newTab,
    openFile,
    updateEditorState,
    activate,
    activateDiff,
    fallbackFromDiff,
    showWelcome,
    closeWelcome,
    markDirty,
    markClean,
    close,
    updateFilePath,
    remapPaths,
    getActive,
    reset,
  }
}

export const tabStore = createTabStore()
