import { writable, get } from 'svelte/store'

export interface ExplorerFile {
    name: string
    path: string
    relativePath: string
}

export interface ExplorerFolder {
    name: string
    path: string
}

interface ExplorerState {
    folder: ExplorerFolder | null
    files: ExplorerFile[]
    loading: boolean
    error: string | null
}

function createExplorerStore() {
    const { subscribe, update, set } = writable<ExplorerState>({
        folder: null,
        files: [],
        loading: false,
        error: null,
    })

    async function openFolder(): Promise<boolean> {
        if (!window.__TAURI__) return false

        update(s => ({ ...s, loading: true, error: null }))

        try {
            const result = await window.__TAURI__.core.invoke('open_folder') as {
                folder: ExplorerFolder
                files: ExplorerFile[]
            } | null

            if (!result) {
                // User cancelled the dialog
                update(s => ({ ...s, loading: false }))
                return false
            }

            update(s => ({
                ...s,
                folder: result.folder,
                files: result.files,
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
            const result = await window.__TAURI__.core.invoke('list_folder_files', {
                folderPath: state.folder.path,
            }) as ExplorerFile[]

            update(s => ({ ...s, files: result, loading: false }))
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            update(s => ({ ...s, loading: false, error: msg }))
        }
    }

    function closeFolder() {
        set({ folder: null, files: [], loading: false, error: null })
    }

    function reset() {
        set({ folder: null, files: [], loading: false, error: null })
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