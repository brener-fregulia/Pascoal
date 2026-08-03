import { describe, it, expect, afterEach, vi } from 'vitest'
import { get } from 'svelte/store'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte'
import ToolchainSettings from '../../../src/settings/ToolchainSettings.svelte'
import { fpcInstallStore } from '../../../src/toolchain/fpcInstall'

function mockTauri(handlers: Record<string, (...args: any[]) => any>) {
    vi.stubGlobal('__TAURI__', {
        core: {
            invoke: vi.fn().mockImplementation((cmd: string, args: any) => {
                const handler = handlers[cmd]
                if (!handler) return Promise.reject(new Error(`no handler for ${cmd}`))
                return handler(args)
            }),
        },
    })
}

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    fpcInstallStore.hide()
})

describe('ToolchainSettings', () => {
    it('shows both tools as installed with version and path', async () => {
        mockTauri({
            get_toolchain_status: () =>
                Promise.resolve({
                    fpc: { installed: true, version: '3.2.2', path: '/usr/bin/fpc' },
                    git: { installed: true, version: '2.43.0', path: '/usr/bin/git' },
                }),
        })

        const { findByText } = render(ToolchainSettings)

        expect(await findByText('3.2.2')).toBeInTheDocument()
        expect(await findByText('2.43.0')).toBeInTheDocument()
        expect(await findByText('/usr/bin/fpc')).toBeInTheDocument()
        expect(await findByText('/usr/bin/git')).toBeInTheDocument()
    })

    it('shows an install button for FPC when not found', async () => {
        mockTauri({
            get_toolchain_status: () =>
                Promise.resolve({
                    fpc: { installed: false, version: null, path: null },
                    git: { installed: true, version: '2.43.0', path: '/usr/bin/git' },
                }),
            detect_installer: () => Promise.resolve('winget'),
        })

        const { findByText } = render(ToolchainSettings)

        expect(await findByText('Install')).toBeInTheDocument()
    })

    it('opens the FPC install modal when Install is clicked', async () => {
        mockTauri({
            get_toolchain_status: () =>
                Promise.resolve({
                    fpc: { installed: false, version: null, path: null },
                    git: { installed: true, version: '2.43.0', path: '/usr/bin/git' },
                }),
            detect_installer: () => Promise.resolve('winget'),
        })

        const { findByText } = render(ToolchainSettings)
        await fireEvent.click(await findByText('Install'))

        expect(get(fpcInstallStore).visible).toBe(true)
    })

    it('shows a download button for git when not found', async () => {
        mockTauri({
            get_toolchain_status: () =>
                Promise.resolve({
                    fpc: { installed: true, version: '3.2.2', path: '/usr/bin/fpc' },
                    git: { installed: false, version: null, path: null },
                }),
        })

        const { findByText } = render(ToolchainSettings)

        expect(await findByText('Download')).toBeInTheDocument()
    })

    it('opens the git download page when Download is clicked', async () => {
        let openedUrl: string | undefined
        mockTauri({
            get_toolchain_status: () =>
                Promise.resolve({
                    fpc: { installed: true, version: '3.2.2', path: '/usr/bin/fpc' },
                    git: { installed: false, version: null, path: null },
                }),
            open_url: (args: { url: string }) => {
                openedUrl = args.url
                return Promise.resolve()
            },
        })

        const { findByText } = render(ToolchainSettings)
        await fireEvent.click(await findByText('Download'))

        await waitFor(() => expect(openedUrl).toBe('https://git-scm.com/downloads'))
    })

    it('refreshes the status after a successful FPC install', async () => {
        let calls = 0
        mockTauri({
            get_toolchain_status: () => {
                calls++
                return Promise.resolve(
                    calls === 1
                        ? {
                            fpc: { installed: false, version: null, path: null },
                            git: { installed: true, version: '2.43.0', path: '/usr/bin/git' },
                        }
                        : {
                            fpc: { installed: true, version: '3.2.2', path: '/usr/bin/fpc' },
                            git: { installed: true, version: '2.43.0', path: '/usr/bin/git' },
                        },
                )
            },
            detect_installer: () => Promise.resolve('winget'),
        })

        const { findByText } = render(ToolchainSettings)
        await findByText('Install')

        fpcInstallStore.setSuccess()

        expect(await findByText('3.2.2')).toBeInTheDocument()
    })
})