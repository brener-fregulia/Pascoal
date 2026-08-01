import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'
import { fpcInstallStore } from '../../../src/toolchain/fpcInstall'

function state() {
    return get(fpcInstallStore)
}

describe('fpcInstallStore', () => {
    beforeEach(() => {
        fpcInstallStore.hide()
    })

    describe('show', () => {
        it('makes the store visible and resets status/output', () => {
            vi.stubGlobal('__TAURI__', undefined)
            fpcInstallStore.show()
            expect(state().visible).toBe(true)
            expect(state().status).toBe('idle')
            expect(state().output).toBe('')
        })

        it('triggers package manager detection', async () => {
            const invokeMock = vi.fn().mockResolvedValue('winget')
            vi.stubGlobal('__TAURI__', { core: { invoke: invokeMock } })

            fpcInstallStore.show()
            await Promise.resolve()
            await Promise.resolve()

            expect(invokeMock).toHaveBeenCalledWith('detect_installer', undefined)
        })
    })

    describe('hide', () => {
        it('makes the store invisible', () => {
            vi.stubGlobal('__TAURI__', undefined)
            fpcInstallStore.show()
            fpcInstallStore.hide()
            expect(state().visible).toBe(false)
        })
    })

    describe('detectPackageManager', () => {
        it('does not change the package manager outside a Tauri context', async () => {
            vi.stubGlobal('__TAURI__', undefined)
            const before = state().packageManager
            await fpcInstallStore.detectPackageManager()
            expect(state().packageManager).toBe(before)
        })

        it('sets the detected package manager', async () => {
            vi.stubGlobal('__TAURI__', {
                core: { invoke: vi.fn().mockResolvedValue('apt-get') },
            })

            await fpcInstallStore.detectPackageManager()

            expect(state().packageManager).toBe('apt-get')
        })
    })

    describe('install', () => {
        it('does nothing outside a Tauri context', async () => {
            vi.stubGlobal('__TAURI__', undefined)
            await fpcInstallStore.install()
            expect(state().status).toBe('idle')
        })

        it('sets status to error on failure', async () => {
            vi.stubGlobal('__TAURI__', {
                core: {
                    invoke: vi.fn().mockRejectedValue(new Error('install failed')),
                },
            })

            await fpcInstallStore.install()

            expect(state().status).toBe('error')
            expect(state().output).toContain('install failed')
        })
    })

    describe('appendOutput / setSuccess / setError', () => {
        it('appendOutput appends to the existing output', () => {
            const before = state().output
            fpcInstallStore.appendOutput('line 1\n')
            fpcInstallStore.appendOutput('line 2\n')
            expect(state().output).toBe(before + 'line 1\nline 2\n')
        })

        it('setSuccess sets status to success', () => {
            fpcInstallStore.setSuccess()
            expect(state().status).toBe('success')
        })

        it('setError sets status to error and appends the message', () => {
            fpcInstallStore.setError('something broke')
            expect(state().status).toBe('error')
            expect(state().output).toContain('something broke')
        })
    })
})