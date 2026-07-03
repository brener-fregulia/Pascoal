import { writable, get } from 'svelte/store'
import { explorerStore } from './explorerStore'

export interface GitFileStatus {
    path: string
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'unmerged'
}

interface GitState {
    isRepo: boolean
    branch: string | null
    staged: GitFileStatus[]
    unstaged: GitFileStatus[]
    loading: boolean
    error: string | null
    commitMessage: string
}

const INITIAL: GitState = {
    isRepo: false,
    branch: null,
    staged: [],
    unstaged: [],
    loading: false,
    error: null,
    commitMessage: '',
}

function createGitStore() {
    const { subscribe, update, set } = writable<GitState>({ ...INITIAL })

    function folderPath(): string | null {
        return get(explorerStore).folder?.path ?? null
    }

    async function refresh() {
        const folder = folderPath()

        if (!folder || !window.__TAURI__) {
            update(s => ({ ...INITIAL, commitMessage: s.commitMessage }))
            return
        }

        update(s => ({ ...s, loading: true, error: null }))

        try {
            const result = await window.__TAURI__.core.invoke('git_status', {
                folderPath: folder,
            }) as {
                isRepo: boolean
                branch: string | null
                staged: GitFileStatus[]
                unstaged: GitFileStatus[]
            }
            update(s => ({ ...s, ...result, loading: false }))
        } catch (e) {
            update(s => ({ ...s, loading: false, error: errMsg(e) }))
        }
    }

    function errMsg(e: unknown): string {
        return e instanceof Error ? e.message : String(e)
    }

    async function stage(path: string) {
        const folder = folderPath()
        if (!folder || !window.__TAURI__) return
        try {
            await window.__TAURI__.core.invoke('git_stage', { folderPath: folder, filePath: path })
            await refresh()
        } catch (e) {
            update(s => ({ ...s, error: errMsg(e) }))
        }
    }

    async function unstage(path: string) {
        const folder = folderPath()
        if (!folder || !window.__TAURI__) return
        try {
            await window.__TAURI__.core.invoke('git_unstage', { folderPath: folder, filePath: path })
            await refresh()
        } catch (e) {
            update(s => ({ ...s, error: errMsg(e) }))
        }
    }

    async function stageAll() {
        const folder = folderPath()
        if (!folder || !window.__TAURI__) return
        try {
            await window.__TAURI__.core.invoke('git_stage_all', { folderPath: folder })
            await refresh()
        } catch (e) {
            update(s => ({ ...s, error: errMsg(e) }))
        }
    }

    async function unstageAll() {
        const folder = folderPath()
        if (!folder || !window.__TAURI__) return
        try {
            await window.__TAURI__.core.invoke('git_unstage_all', { folderPath: folder })
            await refresh()
        } catch (e) {
            update(s => ({ ...s, error: errMsg(e) }))
        }
    }

    async function commit(): Promise<boolean> {
        const folder = folderPath()
        const message = get({ subscribe }).commitMessage
        if (!folder || !window.__TAURI__ || !message.trim()) return false

        try {
            await window.__TAURI__.core.invoke('git_commit', { folderPath: folder, message })
            update(s => ({ ...s, commitMessage: '' }))
            await refresh()
            return true
        } catch (e) {
            update(s => ({ ...s, error: errMsg(e) }))
            return false
        }
    }

    async function initRepo() {
        const folder = folderPath()
        if (!folder || !window.__TAURI__) return
        try {
            await window.__TAURI__.core.invoke('git_init', { folderPath: folder })
            await refresh()
        } catch (e) {
            update(s => ({ ...s, error: errMsg(e) }))
        }
    }

    function setCommitMessage(msg: string) {
        update(s => ({ ...s, commitMessage: msg }))
    }

    function reset() {
        set({ ...INITIAL })
    }

    return {
        subscribe,
        refresh,
        stage,
        unstage,
        stageAll,
        unstageAll,
        commit,
        initRepo,
        setCommitMessage,
        reset,
    }
}

export const gitStore = createGitStore()

// Cache of fetched diffs, keyed by `${staged}:${path}`, so re-expanding
// a row doesn't refetch immediately. Cleared on every refresh() call site
// in GitPanel.svelte when needed.
export const diffCache = writable<Record<string, string>>({})