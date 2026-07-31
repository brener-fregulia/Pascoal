import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'

// appStore is a real singleton with its own init()/Tauri wiring - mocking
// the whole module (instead of driving it through a fake window.__TAURI__)
// keeps this a focused unit test of whatsNewStore's own logic, not a
// re-test of get_app_info's IPC flow.
vi.mock('../../../src/app/app', () => {
    let currentState: { info: unknown; loading: boolean } = {
        info: null,
        loading: false,
    }
    const listeners = new Set<(v: typeof currentState) => void>()

    function notify() {
        listeners.forEach((fn) => fn(currentState))
    }

    return {
        appStore: {
            subscribe(fn: (v: typeof currentState) => void) {
                listeners.add(fn)
                fn(currentState)
                return () => listeners.delete(fn)
            },
            init: vi.fn(),
            __setInfo(info: unknown) {
                currentState = { info, loading: false }
                notify()
            },
        },
    }
})

vi.mock('../../../src/i18n/release-notes', () => ({
    loadReleaseNote: vi.fn(),
}))

import { whatsNewStore } from '../../../src/app/whatsNew'
import { appStore } from '../../../src/app/app'
import { loadReleaseNote } from '../../../src/i18n/release-notes'

interface WhatsNewState {
    show: boolean
    version: string | null
    note: string | null
}

function state(): WhatsNewState {
    return get(whatsNewStore) as WhatsNewState
}

function setInfo(version: string) {
    ; (appStore as any).__setInfo({
        name: 'Pascoal',
        version,
        fpcInstalled: true,
        fpcVersion: '3.2.2',
        platform: 'linux',
        documentsDir: '/tmp',
    })
}

const STORAGE_KEY = 'pascoal-last-seen-version'

describe('whatsNewStore', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.mocked(loadReleaseNote).mockReset()
            ; (appStore as any).__setInfo(null)
        whatsNewStore.dismiss()
    })

    describe('checkAfterUpdate', () => {
        it('does nothing when appStore has no info yet', async () => {
            await whatsNewStore.checkAfterUpdate()
            expect(state().show).toBe(false)
            expect(loadReleaseNote).not.toHaveBeenCalled()
        })

        it('does not show on first launch and starts tracking the version', async () => {
            setInfo('2026.1.1')

            await whatsNewStore.checkAfterUpdate()

            expect(state().show).toBe(false)
            expect(localStorage.getItem(STORAGE_KEY)).toBe('2026.1.1')
            expect(loadReleaseNote).not.toHaveBeenCalled()
        })

        it('does not show when the saved version matches the current one', async () => {
            localStorage.setItem(STORAGE_KEY, '2026.1.1')
            setInfo('2026.1.1')

            await whatsNewStore.checkAfterUpdate()

            expect(state().show).toBe(false)
            expect(loadReleaseNote).not.toHaveBeenCalled()
        })

        it('shows the modal after an update when a note exists', async () => {
            localStorage.setItem(STORAGE_KEY, '2026.1.0')
            setInfo('2026.1.1')
            vi.mocked(loadReleaseNote).mockResolvedValue(
                'Improved highlighting.',
            )

            await whatsNewStore.checkAfterUpdate()

            expect(state()).toEqual({
                show: true,
                version: '2026.1.1',
                note: 'Improved highlighting.',
            })
            expect(localStorage.getItem(STORAGE_KEY)).toBe('2026.1.1')
        })

        it('updates the saved version but stays hidden when there is no note', async () => {
            localStorage.setItem(STORAGE_KEY, '2026.1.0')
            setInfo('2026.1.1')
            vi.mocked(loadReleaseNote).mockResolvedValue(null)

            await whatsNewStore.checkAfterUpdate()

            expect(state().show).toBe(false)
            expect(localStorage.getItem(STORAGE_KEY)).toBe('2026.1.1')
        })
    })

    describe('showCurrent', () => {
        it('shows the current version note on demand', async () => {
            setInfo('2026.1.1')
            vi.mocked(loadReleaseNote).mockResolvedValue(
                'Improved highlighting.',
            )

            await whatsNewStore.showCurrent()

            expect(state()).toEqual({
                show: true,
                version: '2026.1.1',
                note: 'Improved highlighting.',
            })
        })

        it('does nothing if there is no note for the current version', async () => {
            setInfo('2026.1.1')
            vi.mocked(loadReleaseNote).mockResolvedValue(null)

            await whatsNewStore.showCurrent()

            expect(state().show).toBe(false)
        })

        it('does nothing when appStore has no info yet', async () => {
            await whatsNewStore.showCurrent()
            expect(loadReleaseNote).not.toHaveBeenCalled()
        })
    })

    describe('dismiss', () => {
        it('hides the modal without clearing version/note', async () => {
            setInfo('2026.1.1')
            vi.mocked(loadReleaseNote).mockResolvedValue(
                'Improved highlighting.',
            )
            await whatsNewStore.showCurrent()

            whatsNewStore.dismiss()

            const s = state()
            expect(s.show).toBe(false)
            expect(s.version).toBe('2026.1.1')
            expect(s.note).toBe('Improved highlighting.')
        })
    })
})