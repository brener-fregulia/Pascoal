import { describe, it, expect, vi } from 'vitest'
import { get } from 'svelte/store'
import { settingsStore, type Settings } from '../../../src/settings/settingsStore'

const DEFAULTS: Settings = {
    autoSaveBeforeRun: true,
}

describe('settingsStore', () => {
    describe('load', () => {
        it('does nothing outside a Tauri context', async () => {
            vi.stubGlobal('__TAURI__', undefined)
            await settingsStore.load()
            expect(get(settingsStore)).toEqual(DEFAULTS)
        })

        it('merges saved settings over the defaults', async () => {
            vi.stubGlobal('__TAURI__', {
                core: {
                    invoke: vi
                        .fn()
                        .mockResolvedValue(
                            JSON.stringify({ autoSaveBeforeRun: false }),
                        ),
                },
            })

            await settingsStore.load()

            expect(get(settingsStore)).toEqual({
                ...DEFAULTS,
                autoSaveBeforeRun: false,
            })
        })

        it('leaves existing settings unchanged when there is no settings file yet', async () => {
            // Establish a known, non-default state first
            vi.stubGlobal('__TAURI__', {
                core: {
                    invoke: vi
                        .fn()
                        .mockResolvedValue(
                            JSON.stringify({ autoSaveBeforeRun: false }),
                        ),
                },
            })
            await settingsStore.load()
            expect(get(settingsStore).autoSaveBeforeRun).toBe(false)

            // A failed load (no settings file) should NOT reset to
            // defaults - the catch block in settings.ts is intentionally
            // empty, so whatever was already loaded stays as-is.
            vi.stubGlobal('__TAURI__', {
                core: {
                    invoke: vi.fn().mockRejectedValue(new Error('not found')),
                },
            })
            await settingsStore.load()

            expect(get(settingsStore).autoSaveBeforeRun).toBe(false)
        })
    })

    describe('updateSetting', () => {
        it('updates the store immediately', () => {
            vi.stubGlobal('__TAURI__', undefined)
            settingsStore.updateSetting('autoSaveBeforeRun', false)
            expect(get(settingsStore).autoSaveBeforeRun).toBe(false)
            settingsStore.updateSetting('autoSaveBeforeRun', true)
        })

        it('attempts to persist the change via save_settings', () => {
            const invokeMock = vi.fn().mockResolvedValue(undefined)
            vi.stubGlobal('__TAURI__', { core: { invoke: invokeMock } })

            settingsStore.updateSetting('autoSaveBeforeRun', false)

            expect(invokeMock).toHaveBeenCalledWith(
                'save_settings',
                expect.objectContaining({ content: expect.any(String) }),
            )
            settingsStore.updateSetting('autoSaveBeforeRun', true)
        })
    })
})