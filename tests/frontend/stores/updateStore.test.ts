import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'

vi.mock('@tauri-apps/plugin-updater', () => ({
    check: vi.fn(),
}))

vi.mock('../../../src/i18n/release-notes', () => ({
    loadReleaseNote: vi.fn(),
}))

import { updateStore } from '../../../src/integrations/updater/updateStore'
import { check } from '@tauri-apps/plugin-updater'
import { loadReleaseNote } from '../../../src/i18n/release-notes'

interface UpdateState {
    status: string
    version: string | null
    notes: string | null
    progress: number
    error: string | null
}

function state(): UpdateState {
    return get(updateStore) as UpdateState
}

describe('updateStore', () => {
    beforeEach(() => {
        vi.stubGlobal('__TAURI__', { core: { invoke: vi.fn() } })
        vi.mocked(check).mockReset()
        vi.mocked(loadReleaseNote).mockReset()
        updateStore.dismiss()
    })

    describe('checkForUpdate', () => {
        it('does nothing outside a Tauri context', async () => {
            vi.stubGlobal('__TAURI__', undefined)
            await updateStore.checkForUpdate(false)
            expect(check).not.toHaveBeenCalled()
        })

        it('sets up-to-date when no update is available and not silent', async () => {
            vi.mocked(check).mockResolvedValue(null as any)
            await updateStore.checkForUpdate(false)
            expect(state().status).toBe('up-to-date')
        })

        it('stays idle when no update is available and silent', async () => {
            vi.mocked(check).mockResolvedValue(null as any)
            await updateStore.checkForUpdate(true)
            expect(state().status).toBe('idle')
        })

        it('uses the translated release note when one exists', async () => {
            vi.mocked(check).mockResolvedValue({
                version: '2026.2.1',
                body: 'Raw GitHub release body',
            } as any)
            vi.mocked(loadReleaseNote).mockResolvedValue('Nota traduzida.')

            await updateStore.checkForUpdate(false)

            expect(state()).toMatchObject({
                status: 'available',
                version: '2026.2.1',
                notes: 'Nota traduzida.',
            })
            expect(loadReleaseNote).toHaveBeenCalledWith(
                expect.anything(),
                '2026.2.1',
            )
        })

        it('falls back to the raw update body when no translated note exists', async () => {
            vi.mocked(check).mockResolvedValue({
                version: '2026.2.1',
                body: 'Raw GitHub release body',
            } as any)
            vi.mocked(loadReleaseNote).mockResolvedValue(null)

            await updateStore.checkForUpdate(false)

            expect(state().notes).toBe('Raw GitHub release body')
        })

        it('falls back to null notes when there is neither a translation nor a body', async () => {
            vi.mocked(check).mockResolvedValue({
                version: '2026.2.1',
                body: null,
            } as any)
            vi.mocked(loadReleaseNote).mockResolvedValue(null)

            await updateStore.checkForUpdate(false)

            expect(state().notes).toBeNull()
        })

        it('sets an error state on failure when not silent', async () => {
            vi.mocked(check).mockRejectedValue(new Error('network down'))
            await updateStore.checkForUpdate(false)
            expect(state().status).toBe('error')
        })
    })

    describe('dismiss', () => {
        it('resets status to idle', async () => {
            vi.mocked(check).mockResolvedValue({
                version: '2026.2.1',
                body: 'x',
            } as any)
            vi.mocked(loadReleaseNote).mockResolvedValue('nota')
            await updateStore.checkForUpdate(false)

            updateStore.dismiss()

            expect(state().status).toBe('idle')
        })
    })
})