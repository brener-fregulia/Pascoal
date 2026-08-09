import { writable, get } from 'svelte/store'
import { explorerStore } from './explorerStore'
import { isTauriAvailable, invoke } from '../integrations/tauri/client'

export interface SearchMatch {
    filePath: string
    fileName: string
    lineNumber: number
    lineText: string
    column: number
}

interface SearchState {
    query: string
    results: SearchMatch[]
    loading: boolean
    caseSensitive: boolean
}

function createSearchStore() {
    const { subscribe, update, set } = writable<SearchState>({
        query: '',
        results: [],
        loading: false,
        caseSensitive: false,
    })

    async function search(query: string) {
        const folder = get(explorerStore).folder

        if (!query.trim()) {
            update(s => ({ ...s, query, results: [] }))
            return
        }

        if (!folder || !isTauriAvailable()) {
            update(s => ({ ...s, query, results: [] }))
            return
        }

        update(s => ({ ...s, query, loading: true }))

        const caseSensitive = get({ subscribe }).caseSensitive

        try {
            const results = await invoke<SearchMatch[]>('search_in_folder', {
                folderPath: folder.path,
                query,
                caseSensitive,
            })

            update(s => ({ ...s, results, loading: false }))
        } catch (e) {
            console.error('search_in_folder failed:', e)
            update(s => ({ ...s, results: [], loading: false }))
        }
    }

    function toggleCaseSensitive() {
        update(s => ({ ...s, caseSensitive: !s.caseSensitive }))
    }

    function clear() {
        set({ query: '', results: [], loading: false, caseSensitive: false })
    }

    function reset() {
        set({ query: '', results: [], loading: false, caseSensitive: false })
    }

    return { subscribe, search, toggleCaseSensitive, clear, reset }
}

export const searchStore = createSearchStore()

// Set by SearchPanel when a result is clicked — Editor.svelte watches this
// to scroll to and select the matching line after the tab opens.
export const pendingJumpLine = writable<number | null>(null)

// Incremented by App.svelte's `menu-find-in-files` listener to tell an
// already-mounted (or just-mounted) SearchPanel to focus its query input,
// mirroring the focusTick pattern FindWidget uses for the editor's Find/Replace.
export const searchFocusTick = writable(0)