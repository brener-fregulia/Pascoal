import { writable, get } from 'svelte/store'
import { tabStore } from './tabs'

export interface DiffTab {
    id: string
    filePath: string
    fileName: string
    staged: boolean
    original: string
    modified: string
}

let diffTabCounter = 0

function createDiffTabStore() {
    const { subscribe, update } = writable<DiffTab[]>([])

    function open(tab: Omit<DiffTab, 'id'>): DiffTab {
        const tabs = get({ subscribe })
        const existing = tabs.find(
            (t) => t.filePath === tab.filePath && t.staged === tab.staged,
        )
        if (existing) {
            tabStore.activateDiff(existing.id)
            return existing
        }

        const id = `diff-${++diffTabCounter}`
        const newTab: DiffTab = { ...tab, id }
        update((tabs) => [...tabs, newTab])
        tabStore.activateDiff(id)
        return newTab
    }

    function close(id: string) {
        const tabs = get({ subscribe })
        const index = tabs.findIndex((t) => t.id === id)
        if (index === -1) return

        const remaining = tabs.filter((t) => t.id !== id)
        update(() => remaining)

        const tabState = get(tabStore)
        if (tabState.activeView === 'diff' && tabState.activeTabId === id) {
            if (remaining.length > 0) {
                tabStore.activateDiff(remaining[Math.min(index, remaining.length - 1)].id)
            } else {
                tabStore.fallbackFromDiff()
            }
        }
    }

    function reset() {
        diffTabCounter = 0
        update(() => [])
    }

    return { subscribe, open, close, reset }
}

export const diffTabStore = createDiffTabStore()