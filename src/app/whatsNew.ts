import { writable, get } from 'svelte/store'
import { appStore } from './app'
import { localeStore } from '../i18n'
import { loadReleaseNote } from '../i18n/release-notes'

const STORAGE_KEY = 'pascoal-last-seen-version'

interface WhatsNewState {
    show: boolean
    version: string | null
    note: string | null
}

function createWhatsNewStore() {
    const { subscribe, set, update } = writable<WhatsNewState>({
        show: false,
        version: null,
        note: null,
    })

    function getSavedVersion(): string | null {
        try {
            return localStorage.getItem(STORAGE_KEY)
        } catch {
            return null
        }
    }

    function saveVersion(version: string) {
        try {
            localStorage.setItem(STORAGE_KEY, version)
        } catch {
            /* ignore */
        }
    }

    // Called once on startup, after appStore.init() has resolved a real
    // version. Only shows the modal if there WAS a previously seen version
    // and it differs from the current one - never on first install (nothing
    // to compare against yet), matching the "shown once after an update"
    // design agreed on.
    async function checkAfterUpdate() {
        const info = get(appStore).info
        if (!info || info.version === '—') return

        const seen = getSavedVersion()

        if (seen === null) {
            // First launch ever with this feature - nothing to announce
            // retroactively, just start tracking from here.
            saveVersion(info.version)
            return
        }

        if (seen === info.version) return

        const note = await loadReleaseNote(get(localeStore), info.version)
        saveVersion(info.version)

        if (note) {
            set({ show: true, version: info.version, note })
        }
    }

    // Called from the Help menu - re-shows the current version's note
    // on demand, regardless of whether it was already seen.
    async function showCurrent() {
        const info = get(appStore).info
        if (!info || info.version === '—') return

        const note = await loadReleaseNote(get(localeStore), info.version)
        if (note) {
            set({ show: true, version: info.version, note })
        }
    }

    function dismiss() {
        update((s) => ({ ...s, show: false }))
    }

    return { subscribe, checkAfterUpdate, showCurrent, dismiss }
}

export const whatsNewStore = createWhatsNewStore()