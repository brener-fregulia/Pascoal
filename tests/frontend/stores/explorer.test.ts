import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'
import { explorerStore } from '../../../src/renderer/ide/src/stores//explorerStore'

function state() {
    return get(explorerStore)
}

const MOCK_FOLDER = { name: 'MyProject', path: 'C:\\Users\\test\\MyProject' }
const MOCK_FILES = [
    { name: 'main.pas', path: 'C:\\Users\\test\\MyProject\\main.pas', relativePath: 'main.pas' },
    { name: 'utils.pas', path: 'C:\\Users\\test\\MyProject\\utils.pas', relativePath: 'utils.pas' },
]

describe('explorerStore', () => {
    beforeEach(() => {
        explorerStore.reset()
        vi.restoreAllMocks()
    })

    describe('initial state', () => {
        it('has no folder open', () => {
            expect(state().folder).toBeNull()
        })

        it('has empty file list', () => {
            expect(state().files).toHaveLength(0)
        })

        it('is not loading', () => {
            expect(state().loading).toBe(false)
        })

        it('has no error', () => {
            expect(state().error).toBeNull()
        })
    })

    describe('openFolder', () => {
        it('returns false when not in Tauri context', async () => {
            const result = await explorerStore.openFolder()
            expect(result).toBe(false)
        })

        it('returns false when user cancels dialog', async () => {
            Object.defineProperty(window, '__TAURI__', {
                value: {
                    core: { invoke: vi.fn().mockResolvedValue(null) },
                },
                writable: true,
                configurable: true,
            })

            const result = await explorerStore.openFolder()
            expect(result).toBe(false)
            expect(state().folder).toBeNull()
            expect(state().loading).toBe(false)
        })

        it('sets folder and files on success', async () => {
            Object.defineProperty(window, '__TAURI__', {
                value: {
                    core: {
                        invoke: vi.fn().mockResolvedValue({
                            folder: MOCK_FOLDER,
                            files: MOCK_FILES,
                        }),
                    },
                },
                writable: true,
                configurable: true,
            })

            const result = await explorerStore.openFolder()

            expect(result).toBe(true)
            expect(state().folder).toEqual(MOCK_FOLDER)
            expect(state().files).toHaveLength(2)
            expect(state().files[0].name).toBe('main.pas')
        })

        it('sets error on failure', async () => {
            Object.defineProperty(window, '__TAURI__', {
                value: {
                    core: { invoke: vi.fn().mockRejectedValue(new Error('permission denied')) },
                },
                writable: true,
                configurable: true,
            })

            const result = await explorerStore.openFolder()

            expect(result).toBe(false)
            expect(state().error).toBe('permission denied')
            expect(state().loading).toBe(false)
        })

        it('clears loading state after success', async () => {
            Object.defineProperty(window, '__TAURI__', {
                value: {
                    core: {
                        invoke: vi.fn().mockResolvedValue({ folder: MOCK_FOLDER, files: MOCK_FILES }),
                    },
                },
                writable: true,
                configurable: true,
            })

            await explorerStore.openFolder()
            expect(state().loading).toBe(false)
        })
    })

    describe('closeFolder', () => {
        it('clears folder and files', async () => {
            Object.defineProperty(window, '__TAURI__', {
                value: {
                    core: {
                        invoke: vi.fn().mockResolvedValue({ folder: MOCK_FOLDER, files: MOCK_FILES }),
                    },
                },
                writable: true,
                configurable: true,
            })

            await explorerStore.openFolder()
            explorerStore.closeFolder()

            expect(state().folder).toBeNull()
            expect(state().files).toHaveLength(0)
        })
    })

    describe('refresh', () => {
        it('does nothing when no folder is open', async () => {
            await explorerStore.refresh()
            expect(state().loading).toBe(false)
        })

        it('does nothing outside Tauri context', async () => {
            // folder set manually via reset + openFolder mock would be needed,
            // but without Tauri the store guard prevents it
            await explorerStore.refresh()
            expect(state().files).toHaveLength(0)
        })
    })

    describe('reset', () => {
        it('restores initial state', async () => {
            Object.defineProperty(window, '__TAURI__', {
                value: {
                    core: {
                        invoke: vi.fn().mockResolvedValue({ folder: MOCK_FOLDER, files: MOCK_FILES }),
                    },
                },
                writable: true,
                configurable: true,
            })

            await explorerStore.openFolder()
            explorerStore.reset()

            expect(state().folder).toBeNull()
            expect(state().files).toHaveLength(0)
            expect(state().error).toBeNull()
        })
    })
})