import { writable, get } from 'svelte/store'

export interface ExplorerNode {
    name: string
    path: string
    relativePath: string
    isDirectory: boolean
    children: ExplorerNode[] | null
}

export interface ExplorerFolder {
    name: string
    path: string
}

interface ExplorerState {
    folder: ExplorerFolder | null
    tree: ExplorerNode[]
    loading: boolean
    error: string | null
}

function createExplorerStore() {
    const { subscribe, update, set } = writable<ExplorerState>({
        folder: null,
        tree: [],
        loading: false,
        error: null,
    })

    async function openFolder(): Promise<boolean> {
        if (!window.__TAURI__) return false

        update(s => ({ ...s, loading: true, error: null }))

        try {
            const result = await window.__TAURI__.core.invoke('open_folder') as {
                folder: ExplorerFolder
                tree: ExplorerNode[]
            } | null

            if (!result) {
                update(s => ({ ...s, loading: false }))
                return false
            }

            update(s => ({
                ...s,
                folder: result.folder,
                tree: result.tree,
                loading: false,
                error: null,
            }))

            return true
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            update(s => ({ ...s, loading: false, error: msg }))
            return false
        }
    }

    async function refresh(): Promise<void> {
        const state = get({ subscribe })
        if (!state.folder || !window.__TAURI__) return

        update(s => ({ ...s, loading: true, error: null }))

        try {
            const result = await window.__TAURI__.core.invoke('list_folder_tree', {
                folderPath: state.folder.path,
            }) as ExplorerNode[]

            update(s => ({ ...s, tree: result, loading: false }))
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            update(s => ({ ...s, loading: false, error: msg }))
        }
    }

    function closeFolder() {
        set({ folder: null, tree: [], loading: false, error: null })
    }

    function reset() {
        set({ folder: null, tree: [], loading: false, error: null })
    }

    return {
        subscribe,
        openFolder,
        refresh,
        closeFolder,
        reset,
    }
}

export const explorerStore = createExplorerStore()