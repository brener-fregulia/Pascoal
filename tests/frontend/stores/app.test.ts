import { describe, it, expect, vi } from 'vitest'
import { get } from 'svelte/store'
import { appStore } from '../../../src/app/app'

function state() {
    return get(appStore)
}

describe('appStore', () => {
    describe('init', () => {
        it('falls back to defaults outside a Tauri context', async () => {
            vi.stubGlobal('__TAURI__', undefined)

            await appStore.init()

            expect(state()).toEqual({
                info: {
                    name: 'Pascoal',
                    version: '—',
                    fpcInstalled: false,
                    fpcVersion: null,
                    platform: 'linux',
                    documentsDir: '',
                },
                loading: false,
            })
        })

        it('maps the raw snake_case response into camelCase AppInfo', async () => {
            vi.stubGlobal('__TAURI__', {
                core: {
                    invoke: vi.fn().mockResolvedValue({
                        name: 'Pascoal',
                        version: '2026.2.1',
                        fpc_installed: true,
                        fpc_version: '3.2.2',
                        platform: 'windows',
                        documents_dir: 'C:\\Users\\test\\Documents\\Pascoal',
                    }),
                },
            })

            await appStore.init()

            expect(state()).toEqual({
                info: {
                    name: 'Pascoal',
                    version: '2026.2.1',
                    fpcInstalled: true,
                    fpcVersion: '3.2.2',
                    platform: 'windows',
                    documentsDir: 'C:\\Users\\test\\Documents\\Pascoal',
                },
                loading: false,
            })
        })

        it('sets window.__documentsDir and window.__platform as a side effect', async () => {
            vi.stubGlobal('__TAURI__', {
                core: {
                    invoke: vi.fn().mockResolvedValue({
                        name: 'Pascoal',
                        version: '2026.2.1',
                        fpc_installed: true,
                        fpc_version: '3.2.2',
                        platform: 'windows',
                        documents_dir: 'C:\\Docs',
                    }),
                },
            })

            await appStore.init()

            expect((window as any).__documentsDir).toBe('C:\\Docs')
            expect((window as any).__platform).toBe('windows')
        })

        it('sets info to null on invoke failure', async () => {
            vi.stubGlobal('__TAURI__', {
                core: { invoke: vi.fn().mockRejectedValue(new Error('boom')) },
            })

            await appStore.init()

            expect(state()).toEqual({ info: null, loading: false })
        })
    })
})