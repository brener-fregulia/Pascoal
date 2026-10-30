import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte'
import { get } from 'svelte/store'
import App from '../../../src/App.svelte'
import { recentWorkspacesStore } from '../../../src/project/recentWorkspaces'
import { settingsStore } from '../../../src/settings/settingsStore'
import { explorerStore } from '../../../src/project/explorerStore'
import { tabStore } from '../../../src/editor/tabs'
import { fpcInstallStore } from '../../../src/toolchain/fpcInstall'
import { EditorView } from '@codemirror/view'

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

    it('cancels the default action of middle-click anywhere in the window', async () => {
        const { container } = render(App)
        await waitFor(() => expect(container.querySelector('#statusbar')).toBeInTheDocument())
        for (const type of ['mousedown', 'mouseup', 'auxclick']) {
            const ev = new MouseEvent(type, { button: 1, bubbles: true, cancelable: true })
            container.querySelector('#statusbar')!.dispatchEvent(ev)
            expect(ev.defaultPrevented).toBe(true)
        }
        const left = new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true })
        container.querySelector('#statusbar')!.dispatchEvent(left)
        expect(left.defaultPrevented).toBe(false)
    })

    it('keeps the right panel hidden until the statusbar toggle is used', async () => {
        const { container, getByRole } = render(App)
        expect(container.querySelector('#right-panel')).toBeNull()
        const toggle = getByRole('button', { name: 'Toggle right panel' })
        await fireEvent.click(toggle)
        await waitFor(() =>
            expect(container.querySelector('#right-panel')).toBeInTheDocument(),
        )
        expect(container.querySelector('#welcome')).toBeInTheDocument()
        await fireEvent.click(toggle)
        await waitFor(() => expect(container.querySelector('#right-panel')).toBeNull())
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
    // Delivers the event to the registered handler, like the Tauri event
    // system does for frontend-to-frontend events.
    emit: vi.fn(async (eventName: string, payload?: unknown) => {
        await mockListenHandlers[eventName]?.({ payload })
    }),
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

describe('App - command palette', () => {
    beforeEach(() => {
        mockInvoke.mockReset()
        mockInvoke.mockImplementation(defaultInvokeImpl())
        clearListenHandlers()
        explorerStore.reset()
        tabStore.reset()
        fpcInstallStore.hide()
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        settingsStore.updateSetting('reopenLastWorkspace', false)
    })

    afterEach(() => {
        cleanup()
        explorerStore.reset()
        tabStore.reset()
        fpcInstallStore.hide()
        settingsStore.updateSetting('reopenLastWorkspace', true)
            ; (window as any).__TAURI__ = undefined
    })

    async function renderReady() {
        const utils = render(App)
        // The last listener App.svelte registers on mount.
        await waitFor(() =>
            expect(mockListenHandlers['menu-version-history']).toBeDefined(),
        )
        return utils
    }

    async function openPalette() {
        await fireEvent.keyDown(document.activeElement ?? document.body, {
            key: 'P',
            ctrlKey: true,
            shiftKey: true,
        })
    }

    function palettes() {
        return document.querySelectorAll('[role="dialog"][aria-label="Command Palette"]')
    }

    it('opens on Ctrl+Shift+P with the input focused and only once', async () => {
        const { getByRole } = await renderReady()
        await openPalette()
        expect(document.activeElement).toBe(getByRole('combobox'))
        await openPalette()
        await fireEvent.keyDown(window, { key: 'P', ctrlKey: true, shiftKey: true })
        expect(palettes()).toHaveLength(1)
    })

    it('closes on Escape and gives focus back', async () => {
        const { getByRole } = await renderReady()
        const toggle = getByRole('button', { name: 'Toggle right panel' })
        toggle.focus()
        await openPalette()
        await fireEvent.keyDown(getByRole('combobox'), { key: 'Escape' })
        expect(palettes()).toHaveLength(0)
        expect(document.activeElement).toBe(toggle)
    })

    it('does not open over a store-controlled modal', async () => {
        await renderReady()
        fpcInstallStore.show()
        await openPalette()
        expect(palettes()).toHaveLength(0)
    })

    it('does not open over a modal controlled by App state', async () => {
        const { findByRole } = await renderReady()
        await mockListenHandlers['menu-about']({ payload: undefined })
        await findByRole('dialog', { name: 'About Pascoal' })
        await openPalette()
        expect(palettes()).toHaveLength(0)
    })

    it('opens a folder through the existing menu handler, showing the Explorer', async () => {
        mockInvoke.mockImplementation(
            defaultInvokeImpl({
                open_workspace: async () => ({
                    folder: { name: 'MyProject', path: '/tmp/MyProject' },
                    tree: [],
                }),
            }),
        )
        const { getByRole, container } = await renderReady()
        await openPalette()
        await fireEvent.click(getByRole('option', { name: 'Open Folder...' }))

        expect(palettes()).toHaveLength(0)
        await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith('open_workspace', undefined))
        await waitFor(() => {
            expect(container.querySelector('.file-tree')).toBeInTheDocument()
        })
    })

    it('opens Find in Files through the existing handler with Enter', async () => {
        const { getByRole, container } = await renderReady()
        await openPalette()
        const input = getByRole('combobox')
        await fireEvent.input(input, { target: { value: 'find' } })
        await fireEvent.keyDown(input, { key: 'Enter' })

        await waitFor(() => {
            expect(container.querySelector('.search-panel')).toBeInTheDocument()
        })
    })

    it('creates a file through the existing handler', async () => {
        const { getByRole } = await renderReady()
        await openPalette()
        await fireEvent.click(getByRole('option', { name: 'New File' }))
        await waitFor(() => expect(get(tabStore).tabs).toHaveLength(1))
        expect(get(tabStore).activeTabId).toBe(get(tabStore).tabs[0].id)
    })

    it('keeps editor shortcuts from running while typing in the palette', async () => {
        const { getByRole, container } = await renderReady()
        await mockListenHandlers['menu-new-file']({ payload: undefined })
        await waitFor(() => expect(container.querySelector('.cm-editor')).toBeInTheDocument())
        mockInvoke.mockClear()

        await openPalette()
        const input = getByRole('combobox')
        await fireEvent.keyDown(input, { key: 's', ctrlKey: true })
        await fireEvent.keyDown(input, { key: 'S', ctrlKey: true, shiftKey: true })
        await fireEvent.keyDown(input, { key: 'F5' })
        await fireEvent.keyDown(input, { key: 'f', ctrlKey: true })
        await fireEvent.keyDown(input, { key: 'h', ctrlKey: true })
        await fireEvent.keyDown(input, { key: 'F', ctrlKey: true, shiftKey: true })
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(palettes()).toHaveLength(1)
        expect(mockInvoke).not.toHaveBeenCalled()
        expect(container.querySelector('.find-widget')).toBeNull()
        expect(container.querySelector('.search-panel')).toBeNull()
    })

    it('closes with Escape without closing the editor find widget', async () => {
        const { getByRole, container } = await renderReady()
        await mockListenHandlers['menu-new-file']({ payload: undefined })
        await waitFor(() => expect(container.querySelector('.cm-editor')).toBeInTheDocument())
        await fireEvent.keyDown(document, { key: 'f', ctrlKey: true })
        await waitFor(() => expect(container.querySelector('.find-widget')).toBeInTheDocument())

        await openPalette()
        await fireEvent.keyDown(getByRole('combobox'), { key: 'Escape' })

        expect(palettes()).toHaveLength(0)
        expect(container.querySelector('.find-widget')).toBeInTheDocument()
    })

    // ── Editor commands ─────────────────────────────────────────────────

    const SOURCE = 'program Test;\nbegin\n  WriteLn(1);\nend.\n'

    async function renderWithFile(filePath: string | null = '/tmp/test.pas') {
        const utils = await renderReady()
        const tab = filePath
            ? await tabStore.openFile(filePath, SOURCE)
            : await tabStore.newTab(SOURCE)
        tabStore.activate(tab.id)
        await waitFor(() =>
            expect(mockListenHandlers['menu-toggle-comment']).toBeDefined(),
        )
        const view = EditorView.findFromDOM(
            utils.container.querySelector('.cm-editor') as HTMLElement,
        )!
        await waitFor(() => expect(view.state.doc.toString()).toBe(SOURCE))
        mockInvoke.mockClear()
        return { ...utils, view, tab }
    }

    async function runFromPalette(id: string) {
        await openPalette()
        await fireEvent.click(document.querySelector(`[role="option"][id$="-option-${id}"]`)!)
    }

    function selectLines(view: EditorView, from: number, to: number) {
        const doc = view.state.doc
        view.dispatch({
            selection: { anchor: doc.line(from).from, head: doc.line(to).to },
        })
        view.focus()
    }

    function optionLabels() {
        return Array.from(document.querySelectorAll('[role="option"]')).map(
            (o) => o.textContent?.trim(),
        )
    }

    it('lists the editor commands only while the editor shows an active tab', async () => {
        const { getByRole } = await renderWithFile()
        await openPalette()
        expect(optionLabels()).toEqual([
            'New File',
            'Open File...',
            'Open Folder...',
            'Save',
            'Save As...',
            'Find',
            'Replace',
            'Find in Files',
            'Toggle Line Comment',
        ])
        await fireEvent.keyDown(getByRole('combobox'), { key: 'Escape' })

        tabStore.showWelcome()
        await openPalette()
        expect(optionLabels()).not.toContain('Save')
    })

    it('hides the editor commands in the Settings view', async () => {
        const { getByRole, container } = await renderWithFile()
        await fireEvent.click(getByRole('button', { name: 'Settings' }))
        await waitFor(() => expect(container.querySelector('.cm-editor')).toBeNull())
        await openPalette()
        expect(optionLabels()).toEqual([
            'New File',
            'Open File...',
            'Open Folder...',
            'Find in Files',
        ])
    })

    it('saves the active file through the existing Ctrl+S handler', async () => {
        const { view, tab } = await renderWithFile()
        tabStore.markDirty(tab.id)
        selectLines(view, 2, 3)
        const selection = view.state.selection

        await runFromPalette('file.save')

        await waitFor(() =>
            expect(mockInvoke).toHaveBeenCalledWith('save_file', {
                content: SOURCE,
                filePath: '/tmp/test.pas',
            }),
        )
        await waitFor(() => expect(tabStore.getActive()?.isDirty).toBe(false))
        expect(palettes()).toHaveLength(0)
        expect(view.state.selection.eq(selection)).toBe(true)
    })

    it('falls back to Save As for an untitled file, like the menu', async () => {
        const { tab } = await renderWithFile(null)
        await runFromPalette('file.save')
        await waitFor(() =>
            expect(mockInvoke).toHaveBeenCalledWith('save_file_as', {
                content: SOURCE,
                suggestedName: tab.fileName,
                folderPath: null,
            }),
        )
        expect(mockInvoke).not.toHaveBeenCalledWith('save_file', expect.anything())
    })

    it('saves as through the existing handler and updates the tab path', async () => {
        mockInvoke.mockImplementation(
            defaultInvokeImpl({ save_file_as: async () => ({ path: '/tmp/renamed.pas' }) }),
        )
        await renderWithFile()
        await runFromPalette('file.saveAs')
        await waitFor(() =>
            expect(tabStore.getActive()?.filePath).toBe('/tmp/renamed.pas'),
        )
        expect(mockInvoke).toHaveBeenCalledWith('save_file_as', expect.anything())
    })

    it('opens Find with the focus in the find input after the palette closes', async () => {
        const { container } = await renderWithFile()
        await runFromPalette('edit.find')
        await waitFor(() =>
            expect(document.activeElement).toBe(
                container.querySelector('.find-widget .find-input'),
            ),
        )
        expect(palettes()).toHaveLength(0)
        expect(container.querySelectorAll('.find-widget .find-input')).toHaveLength(1)
    })

    it('opens Replace with the replace row and the focus in the find input', async () => {
        const { container } = await renderWithFile()
        await runFromPalette('edit.replace')
        await waitFor(() =>
            expect(document.activeElement).toBe(
                container.querySelector('.find-widget .find-input'),
            ),
        )
        expect(container.querySelectorAll('.find-widget .find-input')).toHaveLength(2)
    })

    it('toggles the comment of the lines selected before opening the palette', async () => {
        const { view } = await renderWithFile()
        selectLines(view, 2, 3)

        await runFromPalette('edit.toggleLineComment')

        await waitFor(() =>
            expect(view.state.doc.toString()).toBe(
                'program Test;\n// begin\n//   WriteLn(1);\nend.\n',
            ),
        )
        const { from, to } = view.state.selection.main
        expect(view.state.doc.lineAt(from).number).toBe(2)
        expect(view.state.doc.lineAt(to).number).toBe(3)
    })

    it('gives the focus and the selection back to the editor on Escape', async () => {
        const { view, getByRole } = await renderWithFile()
        selectLines(view, 2, 3)
        const selection = view.state.selection
        const focused = document.activeElement
        expect(focused).toBe(view.contentDOM)

        await openPalette()
        expect(document.activeElement).toBe(getByRole('combobox'))
        await fireEvent.keyDown(getByRole('combobox'), { key: 'Escape' })

        expect(document.activeElement).toBe(focused)
        expect(view.state.selection.eq(selection)).toBe(true)
    })
})
