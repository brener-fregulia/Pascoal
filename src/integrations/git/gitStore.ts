import { writable, get } from 'svelte/store'
import { explorerStore } from '../../project/explorerStore'
import { t } from '../../i18n'
import { isTauriAvailable, invoke } from '../tauri/client'

export interface GitFileStatus {
    path: string
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'unmerged'
}

interface GitNotice {
    type: 'success' | 'error'
    message: string
}

interface GitState {
    isRepo: boolean
    branch: string | null
    staged: GitFileStatus[]
    unstaged: GitFileStatus[]
    loading: boolean
    error: string | null
    commitMessage: string
    needsIdentity: boolean
    notice: GitNotice | null
    remoteUrl: string | null
}

const INITIAL: GitState = {
    isRepo: false,
    branch: null,
    staged: [],
    unstaged: [],
    loading: false,
    error: null,
    commitMessage: '',
    needsIdentity: false,
    notice: null,
    remoteUrl: null,
}

function createGitStore() {
    const { subscribe, update, set } = writable<GitState>({ ...INITIAL })

    let noticeTimer: ReturnType<typeof setTimeout> | undefined

    function folderPath(): string | null {
        return get(explorerStore).folder?.path ?? null
    }

    function errMsg(e: unknown): string {
        return e instanceof Error ? e.message : String(e)
    }

    function showNotice(type: 'success' | 'error', message: string) {
        if (noticeTimer) clearTimeout(noticeTimer)
        update(s => ({ ...s, notice: { type, message } }))
        noticeTimer = setTimeout(() => {
            update(s => ({ ...s, notice: null }))
        }, 4000)
    }

    async function refresh() {
        const folder = folderPath()

        if (!folder || !isTauriAvailable()) {
            update(s => ({ ...INITIAL, commitMessage: s.commitMessage }))
            return
        }

        update(s => ({ ...s, loading: true, error: null }))

        try {
            const result = await invoke<{
                isRepo: boolean
                branch: string | null
                staged: GitFileStatus[]
                unstaged: GitFileStatus[]
            }>('git_status', { folderPath: folder })
            update(s => ({ ...s, ...result, loading: false }))

            if (result.isRepo) {
                await checkRemote()
            }
        } catch (e) {
            update(s => ({ ...s, loading: false, error: errMsg(e) }))
        }
    }

    async function checkRemote() {
        const folder = folderPath()
        if (!folder || !isTauriAvailable()) return
        try {
            const remoteUrl = await invoke<string | null>('git_get_remote', {
                folderPath: folder,
            })
            update(s => ({ ...s, remoteUrl }))
        } catch {
            update(s => ({ ...s, remoteUrl: null }))
        }
    }

    async function setRemote(url: string): Promise<boolean> {
        const folder = folderPath()
        if (!folder || !isTauriAvailable()) return false
        try {
            await invoke('git_set_remote', { folderPath: folder, url })
            await checkRemote()
            showNotice('success', t('git.remote_link_success'))
            return true
        } catch (e) {
            const msg = errMsg(e)
            update(s => ({ ...s, error: msg }))
            showNotice('error', msg)
            return false
        }
    }

    async function push(): Promise<boolean> {
        const folder = folderPath()
        const state = get({ subscribe })
        if (!folder || !isTauriAvailable() || !state.branch) return false
        update(s => ({ ...s, loading: true }))
        try {
            await invoke('git_push', { folderPath: folder, branch: state.branch })
            update(s => ({ ...s, loading: false }))
            showNotice('success', t('git.push_success'))
            return true
        } catch (e) {
            const msg = errMsg(e)
            update(s => ({ ...s, loading: false, error: msg }))
            showNotice('error', msg)
            return false
        }
    }

    async function pull(): Promise<boolean> {
        const folder = folderPath()
        const state = get({ subscribe })
        if (!folder || !isTauriAvailable() || !state.branch) return false
        update(s => ({ ...s, loading: true }))
        try {
            await invoke('git_pull', { folderPath: folder, branch: state.branch })
            update(s => ({ ...s, loading: false }))
            showNotice('success', t('git.pull_success'))
            await refresh()
            return true
        } catch (e) {
            const msg = errMsg(e)
            update(s => ({ ...s, loading: false, error: msg }))
            showNotice('error', msg)
            return false
        }
    }

    async function sync(): Promise<boolean> {
        const pulled = await pull()
        if (!pulled) return false
        return await push()
    }

    async function discard(path: string, isUntracked: boolean) {
        const folder = folderPath()
        if (!folder || !isTauriAvailable()) return
        try {
            if (isUntracked) {
                await invoke('delete_file', { path: `${folder}/${path}` })
            } else {
                await invoke('git_discard', { folderPath: folder, filePath: path })
            }
            await refresh()
        } catch (e) {
            const msg = errMsg(e)
            update(s => ({ ...s, error: msg }))
            showNotice('error', msg)
        }
    }

    async function stage(path: string) {
        const folder = folderPath()
        if (!folder || !isTauriAvailable()) return
        try {
            await invoke('git_stage', { folderPath: folder, filePath: path })
            await refresh()
        } catch (e) {
            update(s => ({ ...s, error: errMsg(e) }))
        }
    }

    async function unstage(path: string) {
        const folder = folderPath()
        if (!folder || !isTauriAvailable()) return
        try {
            await invoke('git_unstage', { folderPath: folder, filePath: path })
            await refresh()
        } catch (e) {
            update(s => ({ ...s, error: errMsg(e) }))
        }
    }

    async function stageAll() {
        const folder = folderPath()
        if (!folder || !isTauriAvailable()) return
        try {
            await invoke('git_stage_all', { folderPath: folder })
            await refresh()
        } catch (e) {
            update(s => ({ ...s, error: errMsg(e) }))
        }
    }

    async function unstageAll() {
        const folder = folderPath()
        if (!folder || !isTauriAvailable()) return
        try {
            await invoke('git_unstage_all', { folderPath: folder })
            await refresh()
        } catch (e) {
            update(s => ({ ...s, error: errMsg(e) }))
        }
    }

    async function commit(): Promise<boolean> {
        const folder = folderPath()
        const message = get({ subscribe }).commitMessage
        if (!folder || !isTauriAvailable() || !message.trim()) return false

        // Check identity before attempting the commit — surfaces a clear
        // inline form instead of a raw git error about missing user.name/email.
        try {
            const identity = await invoke<{ name: string | null; email: string | null }>(
                'git_check_identity',
                { folderPath: folder },
            )

            if (!identity.name || !identity.email) {
                update(s => ({ ...s, needsIdentity: true }))
                return false
            }
        } catch (e) {
            update(s => ({ ...s, error: errMsg(e) }))
            return false
        }

        try {
            await invoke('git_commit', { folderPath: folder, message })
            update(s => ({ ...s, commitMessage: '', needsIdentity: false, error: null }))
            showNotice('success', t('git.commit_success'))
            await refresh()
            return true
        } catch (e) {
            const msg = errMsg(e)
            update(s => ({ ...s, error: msg }))
            showNotice('error', msg)
            return false
        }
    }

    async function configureIdentity(name: string, email: string, global: boolean): Promise<boolean> {
        const folder = folderPath()
        if (!folder || !isTauriAvailable()) return false

        try {
            await invoke('git_set_identity', {
                folderPath: folder,
                name,
                email,
                global,
            })
            update(s => ({ ...s, needsIdentity: false }))
            return await commit()
        } catch (e) {
            const msg = errMsg(e)
            update(s => ({ ...s, error: msg }))
            showNotice('error', msg)
            return false
        }
    }

    async function initRepo() {
        const folder = folderPath()
        if (!folder || !isTauriAvailable()) return
        try {
            await invoke('git_init', { folderPath: folder })
            await refresh()
        } catch (e) {
            update(s => ({ ...s, error: errMsg(e) }))
        }
    }

    function setCommitMessage(msg: string) {
        update(s => ({ ...s, commitMessage: msg }))
    }

    function reset() {
        if (noticeTimer) clearTimeout(noticeTimer)
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
        configureIdentity,
        initRepo,
        setCommitMessage,
        checkRemote,
        setRemote,
        push,
        pull,
        sync,
        discard,
        reset,
    }
}

export const gitStore = createGitStore()