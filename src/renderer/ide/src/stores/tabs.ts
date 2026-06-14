import { writable, get } from 'svelte/store'

let tabCounter = 0

export interface Tab {
  id: string
  filePath: string | null
  fileName: string
  isDirty: boolean
  session: any // Ace EditSession
}

interface TabState {
  tabs: Tab[]
  activeTabId: string | null
  activeView: 'welcome' | 'editor'
}

function createTabStore() {
  const { subscribe, update, set } = writable<TabState>({
    tabs: [],
    activeTabId: null,
    activeView: 'welcome',
  })

  function getState() {
    return get({ subscribe })
  }

  async function newTab(content: string): Promise<Tab> {
    const state = getState()
    const existingNames = state.tabs.map(t => t.fileName)

    let candidate = 'untitled.pas'
    let n = 1

    while (
      existingNames.includes(candidate) ||
      (window.__TAURI__ && window.__documentsDir &&
        await (window.__TAURI__.core.invoke('file_exists', {
          path: `${window.__documentsDir}/${candidate}`
        }) as Promise<boolean>))
    ) {
      n++
      candidate = `untitled-${n}.pas`
    }

    const id = `tab-${++tabCounter}`
    const session = (window as any).ace.createEditSession(content, 'ace/mode/pascal')
    session.setTabSize(2)
    session.setUseSoftTabs(true)

    let initialized = false
    session.on('change', () => {
      if (!initialized) { initialized = true; return }
      markDirty(id)
    })

    const tab: Tab = { id, filePath: null, fileName: candidate, isDirty: false, session }

    update(s => ({ ...s, tabs: [...s.tabs, tab] }))
    return tab
  }

  async function openFile(filePath: string, content: string): Promise<Tab> {
    const state = getState()
    const existing = state.tabs.find(t => t.filePath === filePath)
    if (existing) {
      activate(existing.id)
      return existing
    }

    const id = `tab-${Date.now()}`
    const fileName = filePath.split(/[\\/]/).pop() ?? filePath
    const session = (window as any).ace.createEditSession(content, 'ace/mode/pascal')
    session.setTabSize(2)
    session.setUseSoftTabs(true)

    let initialized = false
    session.on('change', () => {
      if (!initialized) { initialized = true; return }
      markDirty(id)
    })

    const tab: Tab = { id, filePath, fileName, isDirty: false, session }
    update(s => ({ ...s, tabs: [...s.tabs, tab] }))
    return tab
  }

  function activate(id: string) {
    update(s => ({ ...s, activeTabId: id, activeView: 'editor' }))
  }

  function showWelcome() {
    update(s => ({ ...s, activeView: 'welcome' }))
  }

  function markDirty(id: string) {
    update(s => ({
      ...s,
      tabs: s.tabs.map(t => t.id === id ? { ...t, isDirty: true } : t)
    }))
  }

  function markClean(id: string) {
    update(s => ({
      ...s,
      tabs: s.tabs.map(t => t.id === id ? { ...t, isDirty: false } : t)
    }))
  }

  async function close(id: string): Promise<boolean> {
    const state = getState()
    const tab = state.tabs.find(t => t.id === id)
    if (!tab) return false

    if (tab.isDirty) {
      const confirmed = window.confirm(`"${tab.fileName}" has unsaved changes. Close anyway?`)
      if (!confirmed) return false
    }

    update(s => {
      const index = s.tabs.findIndex(t => t.id === id)
      const newTabs = s.tabs.filter(t => t.id !== id)
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
    update(s => ({
      ...s,
      tabs: s.tabs.map(t => t.id === id ? { ...t, filePath, fileName } : t)
    }))
  }

  function getActive(): Tab | null {
    const state = getState()
    return state.tabs.find(t => t.id === state.activeTabId) ?? null
  }

  function reset() {
    tabCounter = 0
    set({ tabs: [], activeTabId: null, activeView: 'welcome' })
  }

  return {
    subscribe,
    newTab,
    openFile,
    activate,
    showWelcome,
    markDirty,
    markClean,
    close,
    updateFilePath,
    getActive,
    reset,
  }
}

export const tabStore = createTabStore()
