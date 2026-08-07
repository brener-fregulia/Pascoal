import { writable, get } from 'svelte/store'
import { isTauriAvailable, invoke } from '../integrations/tauri/client'

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
        if (!isTauriAvailable()) return false

        update(s => ({ ...s, loading: true, error: null }))

        try {
            const result = await invoke<{
                folder: ExplorerFolder
                tree: ExplorerNode[]
            } | null>('open_workspace')

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
        if (!state.folder || !isTauriAvailable()) return

        update(s => ({ ...s, loading: true, error: null }))

        try {
            const result = await invoke<ExplorerNode[]>('list_folder_tree', {
                folderPath: state.folder.path,
            })

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