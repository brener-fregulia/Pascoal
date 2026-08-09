import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte'
import { get } from 'svelte/store'
import App from '../../../src/App.svelte'
import { recentWorkspacesStore } from '../../../src/project/recentWorkspaces'
import { settingsStore } from '../../../src/settings/settingsStore'
import { explorerStore } from '../../../src/project/explorerStore'

beforeEach(() => {
    localStorage.clear()
})

afterEach(() => {
    cleanup()
    document.documentElement.removeAttribute('data-theme')
})

async function flushMount() {
    // onMount is async (themeStore.init -> appStore.init -> whatsNewStore.
    // checkAfterUpdate -> the isTauriAvailable() gate) - give it a chance
    // to settle before asserting on anything it sets up.
    await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('App', () => {
    it('renders the shell', () => {
        const { container } = render(App)
        expect(container.querySelector('#titlebar')).toBeInTheDocument()
        expect(container.querySelector('#activity-bar')).toBeInTheDocument()
        expect(container.querySelector('#statusbar')).toBeInTheDocument()
    })

    it('shows Welcome by default with no open tabs', () => {
        const { container } = render(App)
        expect(container.querySelector('#welcome')).toBeInTheDocument()
    })

    it('sets the data-theme attribute on the document root', async () => {
        render(App)
        await flushMount()
        expect(document.documentElement.getAttribute('data-theme')).toBeTruthy()
    })

    it('automatically shows the FPC-missing modal when FPC is not detected', async () => {
        const { findByText } = render(App)
        expect(
            await findByText(
                'No FPC installation was found on this machine. Would you like to install it now?',
            ),
        ).toBeInTheDocument()
    })

    it('opens the search panel on Ctrl+Shift+F', async () => {
        const { container } = render(App)
        await fireEvent.keyDown(window, { key: 'F', ctrlKey: true, shiftKey: true })
        expect(container.querySelector('.search-panel')).toBeInTheDocument()
    })
})

// ── Tauri-backed startup/menu behavior ──────────────────────────────────────
//
// Everything below runs inside the `if (!isTauriAvailable()) return` gate in
// App.svelte's onMount, so window.__TAURI__ needs to be defined - unlike the
// tests above, which rely on every store degrading gracefully when Tauri is
// unavailable. A single `invoke` mock stands in for the whole IPC bridge;
// `listen` is mocked to capture registered handlers so tests can fire them
// manually, the same way the real Tauri event system would.

const { mockInvoke, mockListenHandlers } = vi.hoisted(() => ({
    mockInvoke: vi.fn(),
    mockListenHandlers: {} as Record<string, (event: { payload: unknown }) => unknown>,
}))

vi.mock('@tauri-apps/api/event', () => ({
    listen: vi.fn(
        (eventName: string, handler: (event: { payload: unknown }) => unknown) => {
            mockListenHandlers[eventName] = handler
            return Promise.resolve(() => { })
        },
    ),
}))

function defaultInvokeImpl(
    overrides: Record<string, (payload?: Record<string, unknown>) => unknown> = {},
) {
    return async (cmd: string, payload?: Record<string, unknown>) => {
        if (cmd in overrides) return overrides[cmd](payload)
        switch (cmd) {
            case 'get_app_info':
                return {
                    name: 'Pascoal',
                    version: '1.0.0',
                    fpc_installed: true,
                    fpc_version: '3.2.2',
                    platform: 'linux',
                    documents_dir: '',
                }
            case 'file_exists':
                return true
            case 'git_status':
                return { isRepo: false, branch: null, staged: [], unstaged: [] }
            case 'list_folder_tree':
                return []
            case 'save_settings':
                return null
            default:
                return null
        }
    }
}

function clearListenHandlers() {
    for (const key of Object.keys(mockListenHandlers)) {
        delete mockListenHandlers[key]
    }
}

describe('App - reopening the last workspace on startup', () => {
    beforeEach(() => {
        mockInvoke.mockReset()
        mockInvoke.mockImplementation(defaultInvokeImpl())
        clearListenHandlers()
        recentWorkspacesStore.clear()
        explorerStore.reset()
    })

    afterEach(() => {
        cleanup()
        recentWorkspacesStore.clear()
        explorerStore.reset()
        settingsStore.updateSetting('reopenLastWorkspace', true)
            ; (window as any).__TAURI__ = undefined
    })

    it('opens the most recent workspace and shows the explorer panel when reopening succeeds', async () => {
        ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        mockInvoke.mockImplementation(
            defaultInvokeImpl({
                open_workspace_at_path: async (payload) => ({
                    folder: { name: 'MyProject', path: (payload as { path: string }).path },
                    tree: [],
                }),
            }),
        )
        recentWorkspacesStore.add('/tmp/MyProject', 'MyProject')

        const { container } = render(App)

        await waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('open_workspace_at_path', {
                path: '/tmp/MyProject',
            })
        })
        await waitFor(() => {
            expect(container.querySelector('.file-tree')).toBeInTheDocument()
        })
    })

    it('removes the stale recent-workspace entry when reopening fails', async () => {
        ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        mockInvoke.mockImplementation(
            defaultInvokeImpl({
                open_workspace_at_path: async () => {
                    throw new Error('folder no longer exists')
                },
            }),
        )
        recentWorkspacesStore.add('/tmp/Gone', 'Gone')

        render(App)

        await waitFor(() => {
            expect(
                get(recentWorkspacesStore).find((e) => e.path === '/tmp/Gone'),
            ).toBeUndefined()
        })
    })

    it('never attempts to reopen a workspace when reopenLastWorkspace is disabled', async () => {
        ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        settingsStore.updateSetting('reopenLastWorkspace', false)
        recentWorkspacesStore.add('/tmp/MyProject', 'MyProject')

        render(App)
        await flushMount()

        expect(mockInvoke).not.toHaveBeenCalledWith(
            'open_workspace_at_path',
            expect.anything(),
        )
    })

    it('does not attempt to reopen a workspace when Tauri is unavailable', async () => {
        // window.__TAURI__ intentionally left undefined here.
        recentWorkspacesStore.add('/tmp/MyProject', 'MyProject')

        render(App)
        await flushMount()

        expect(mockInvoke).not.toHaveBeenCalled()
    })
})

describe('App - menu-open-recent-workspace listener', () => {
    beforeEach(() => {
        mockInvoke.mockReset()
        mockInvoke.mockImplementation(defaultInvokeImpl())
        clearListenHandlers()
        recentWorkspacesStore.clear()
        explorerStore.reset()
            // Disabled so the reopen-on-startup behavior (covered above) can't
            // interfere with the listener assertions below.
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        settingsStore.updateSetting('reopenLastWorkspace', false)
    })

    afterEach(() => {
        cleanup()
        recentWorkspacesStore.clear()
        explorerStore.reset()
        settingsStore.updateSetting('reopenLastWorkspace', true)
            ; (window as any).__TAURI__ = undefined
    })

    it('switches to the explorer panel when opening the workspace succeeds', async () => {
        mockInvoke.mockImplementation(
            defaultInvokeImpl({
                open_workspace_at_path: async (payload) => ({
                    folder: { name: 'MyProject', path: (payload as { path: string }).path },
                    tree: [],
                }),
            }),
        )

        const { container } = render(App)
        await waitFor(() =>
            expect(mockListenHandlers['menu-open-recent-workspace']).toBeDefined(),
        )

        await mockListenHandlers['menu-open-recent-workspace']({
            payload: '/tmp/MyProject',
        })

        await waitFor(() => {
            expect(container.querySelector('.file-tree')).toBeInTheDocument()
        })
    })

    it('removes the recent-workspace entry when opening the workspace fails', async () => {
        mockInvoke.mockImplementation(
            defaultInvokeImpl({
                open_workspace_at_path: async () => {
                    throw new Error('folder no longer exists')
                },
            }),
        )
        recentWorkspacesStore.add('/tmp/Gone', 'Gone')

        render(App)
        await waitFor(() =>
            expect(mockListenHandlers['menu-open-recent-workspace']).toBeDefined(),
        )

        await mockListenHandlers['menu-open-recent-workspace']({ payload: '/tmp/Gone' })

        await waitFor(() => {
            expect(
                get(recentWorkspacesStore).find((e) => e.path === '/tmp/Gone'),
            ).toBeUndefined()
        })
    })
})

describe('App - menu-find-in-files listener', () => {
    beforeEach(() => {
        mockInvoke.mockReset()
        mockInvoke.mockImplementation(defaultInvokeImpl())
        clearListenHandlers()
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
    })

    afterEach(() => {
        cleanup()
            ; (window as any).__TAURI__ = undefined
    })

    it('opens the search panel when the menu-find-in-files event fires', async () => {
        const { container } = render(App)
        await waitFor(() =>
            expect(mockListenHandlers['menu-find-in-files']).toBeDefined(),
        )

        await mockListenHandlers['menu-find-in-files']({ payload: undefined })

        await waitFor(() => {
            expect(container.querySelector('.search-panel')).toBeInTheDocument()
        })
    })
})
