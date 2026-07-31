import { writable, get } from 'svelte/store'
import type { Update } from '@tauri-apps/plugin-updater'
import { localeStore } from '../../i18n'
import { loadReleaseNote } from '../../i18n/release-notes'

export type UpdateStatus =
    | 'idle'
    | 'checking'
    | 'available'
    | 'downloading'
    | 'ready'
    | 'error'
    | 'up-to-date'

interface UpdateState {
    status: UpdateStatus
    version: string | null
    notes: string | null
    progress: number
    error: string | null
}

function createUpdateStore() {
    const { subscribe, update } = writable<UpdateState>({
        status: 'idle',
        version: null,
        notes: null,
        progress: 0,
        error: null,
    })

    let pending: Update | null = null

    async function checkForUpdate(silent = true) {
        if (!window.__TAURI__) return
        update((s) => ({ ...s, status: 'checking', error: null }))
        try {
            const { check } = await import('@tauri-apps/plugin-updater')
            const result = await check()
            if (result) {
                pending = result
                const translatedNote = await loadReleaseNote(
                    get(localeStore),
                    result.version,
                )
                update((s) => ({
                    ...s,
                    status: 'available',
                    version: result.version,
                    notes: translatedNote ?? result.body ?? null,
                }))
            } else {
                update((s) => ({ ...s, status: silent ? 'idle' : 'up-to-date' }))
            }
        } catch (e) {
            console.error('Update check failed:', e)
            update((s) => ({
                ...s,
                status: silent ? 'idle' : 'error',
                error: String(e),
            }))
        }
    }

    async function installUpdate() {
        if (!pending) return
        update((s) => ({ ...s, status: 'downloading', progress: 0 }))

        let total = 0
        let downloaded = 0

        try {
            await pending.downloadAndInstall((event) => {
                if (event.event === 'Started') {
                    total = event.data.contentLength ?? 0
                } else if (event.event === 'Progress') {
                    downloaded += event.data.chunkLength
                    const pct = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0
                    update((s) => ({ ...s, progress: pct }))
                } else if (event.event === 'Finished') {
                    update((s) => ({ ...s, progress: 100 }))
                }
            })

            update((s) => ({ ...s, status: 'ready' }))

            const { relaunch } = await import('@tauri-apps/plugin-process')
            await relaunch()
        } catch (e) {
            console.error('Update install failed:', e)
            update((s) => ({ ...s, status: 'error', error: String(e) }))
        }
    }

    function dismiss() {
        update((s) => ({ ...s, status: 'idle' }))
    }

    return {
        subscribe,
        checkForUpdate,
        installUpdate,
        dismiss,
    }
}

export const updateStore = createUpdateStore()