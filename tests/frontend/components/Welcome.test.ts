import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte'

const {
    mockNewTab,
    mockActivate,
    mockOpenFile,
    mockValidate,
    mockAdd,
    mockRemove,
    mockRecentEntries,
    mockValidateWorkspaces,
    mockAddWorkspace,
    mockRemoveWorkspace,
    mockRecentWorkspaceEntries,
    mockOpenFolderAtPath,
    mockExplorerState,
    mockTabState,
    mockAsk,
} = vi.hoisted(() => ({
    mockNewTab: vi.fn().mockResolvedValue({ id: 'new-tab' }),
    mockActivate: vi.fn(),
    mockOpenFile: vi.fn().mockResolvedValue({ id: 'opened-tab' }),
    mockValidate: vi.fn(),
    mockAdd: vi.fn(),
    mockRemove: vi.fn(),
    mockRecentEntries: [] as Array<{
        filePath: string
        fileName: string
        openedAt: number
        workspacePath?: string | null
    }>,
    mockValidateWorkspaces: vi.fn(),
    mockAddWorkspace: vi.fn(),
    mockRemoveWorkspace: vi.fn(),
    mockRecentWorkspaceEntries: [] as Array<{
        path: string
        name: string
        openedAt: number
    }>,
    mockOpenFolderAtPath: vi.fn().mockResolvedValue(true),
    mockExplorerState: { folder: null as { name: string; path: string } | null },
    mockTabState: {
        tabs: [] as Array<{ id: string; isDirty: boolean }>,
        activeTabId: null as string | null,
    },
    mockAsk: vi.fn().mockResolvedValue(true),
}))

vi.mock('../../../src/editor/tabs', () => ({
    tabStore: {
        subscribe: (fn: (v: typeof mockTabState) => void) => {
            fn(mockTabState)
            return () => { }
        },
        newTab: mockNewTab,
        activate: mockActivate,
        openFile: mockOpenFile,
    },
}))

vi.mock('../../../src/project/recent', () => ({
    recentStore: {
        subscribe: (fn: (v: typeof mockRecentEntries) => void) => {
            fn(mockRecentEntries)
            return () => { }
        },
        validate: mockValidate,
        add: mockAdd,
        remove: mockRemove,
    },
}))

vi.mock('../../../src/project/recentWorkspaces', () => ({
    recentWorkspacesStore: {
        subscribe: (fn: (v: typeof mockRecentWorkspaceEntries) => void) => {
            fn(mockRecentWorkspaceEntries)
            return () => { }
        },
        validate: mockValidateWorkspaces,
        add: mockAddWorkspace,
        remove: mockRemoveWorkspace,
    },
}))

vi.mock('../../../src/project/explorerStore', () => ({
    explorerStore: {
        subscribe: (fn: (v: typeof mockExplorerState) => void) => {
            fn(mockExplorerState)
            return () => { }
        },
        openFolderAtPath: mockOpenFolderAtPath,
    },
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
    ask: mockAsk,
}))

import Welcome from '../../../src/app/Welcome.svelte'

afterEach(() => {
    cleanup()
    mockRecentEntries.length = 0
    mockRecentWorkspaceEntries.length = 0
    mockExplorerState.folder = null
    mockTabState.tabs = []
    mockTabState.activeTabId = null
    vi.clearAllMocks()
        ; (window as any).__TAURI__ = undefined
})

describe('Welcome', () => {
    it('calls recentStore.validate on mount', () => {
        render(Welcome)
        expect(mockValidate).toHaveBeenCalled()
    })

    it('calls recentWorkspacesStore.validate on mount', () => {
        render(Welcome)
        expect(mockValidateWorkspaces).toHaveBeenCalled()
    })

    it('shows the empty state when there are no recent files', () => {
        const { getByText } = render(Welcome)
        expect(getByText('No recent projects.')).toBeInTheDocument()
    })

    it('lists recent files when present', () => {
        mockRecentEntries.push({
            filePath: '/tmp/main.pas',
            fileName: 'main.pas',
            openedAt: Date.now(),
        })
        const { getByText } = render(Welcome)
        expect(getByText('main.pas')).toBeInTheDocument()
    })

    it('creates and activates a new tab when "New File..." is clicked', async () => {
        const { getByText } = render(Welcome)
        await fireEvent.click(getByText('New File...'))
        expect(mockNewTab).toHaveBeenCalled()
        expect(mockActivate).toHaveBeenCalledWith('new-tab')
    })

    it('removes a recent entry when its remove button is clicked', async () => {
        mockRecentEntries.push({
            filePath: '/tmp/main.pas',
            fileName: 'main.pas',
            openedAt: Date.now(),
        })
        const { getAllByLabelText } = render(Welcome)
        const removeBtn = getAllByLabelText('Remove from recents')[0]
        await fireEvent.click(removeBtn)
        expect(mockRemove).toHaveBeenCalledWith('/tmp/main.pas')
    })

    describe('recent workspaces', () => {
        it('shows the empty state when there are no recent workspaces', () => {
            const { getByText } = render(Welcome)
            expect(getByText('No recent workspaces.')).toBeInTheDocument()
        })

        it('lists recent workspaces when present', () => {
            mockRecentWorkspaceEntries.push({
                path: '/tmp/MyProject',
                name: 'MyProject',
                openedAt: Date.now(),
            })
            const { getByText } = render(Welcome)
            expect(getByText('MyProject')).toBeInTheDocument()
        })

        it('opens a recent workspace when clicked', async () => {
            ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
            mockRecentWorkspaceEntries.push({
                path: '/tmp/MyProject',
                name: 'MyProject',
                openedAt: Date.now(),
            })
            const { getByText } = render(Welcome)
            await fireEvent.click(getByText('MyProject'))
            expect(mockOpenFolderAtPath).toHaveBeenCalledWith('/tmp/MyProject')
        })

        it('removes the entry when reopening a recent workspace fails', async () => {
            ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
            mockOpenFolderAtPath.mockResolvedValueOnce(false)
            mockRecentWorkspaceEntries.push({
                path: '/tmp/Missing',
                name: 'Missing',
                openedAt: Date.now(),
            })
            const { getByText } = render(Welcome)
            await fireEvent.click(getByText('Missing'))
            await waitFor(() =>
                expect(mockRemoveWorkspace).toHaveBeenCalledWith('/tmp/Missing'),
            )
        })

        it('removes a recent workspace entry when its remove button is clicked', async () => {
            mockRecentWorkspaceEntries.push({
                path: '/tmp/MyProject',
                name: 'MyProject',
                openedAt: Date.now(),
            })
            const { getAllByLabelText } = render(Welcome)
            const removeBtn = getAllByLabelText('Remove from recents').find(
                (el) => el.closest('.recent-entry')?.textContent?.includes('MyProject'),
            )
            await fireEvent.click(removeBtn!)
            expect(mockRemoveWorkspace).toHaveBeenCalledWith('/tmp/MyProject')
        })
    })

    describe('opening a recent file from a different workspace', () => {
        function pushRecentFile(workspacePath: string | null) {
            mockRecentEntries.push({
                filePath: '/tmp/other/main.pas',
                fileName: 'main.pas',
                openedAt: Date.now(),
                workspacePath,
            })
        }

        it('does not switch workspace when the entry has no workspacePath', async () => {
            ; (window as any).__TAURI__ = {
                core: { invoke: vi.fn().mockResolvedValue('content') },
            }
            pushRecentFile(null)
            const { getByText } = render(Welcome)
            await fireEvent.click(getByText('main.pas'))
            expect(mockOpenFolderAtPath).not.toHaveBeenCalled()
            expect(mockOpenFile).toHaveBeenCalledWith(
                '/tmp/other/main.pas',
                'content',
            )
        })

        it('does not switch workspace when the entry matches the open folder', async () => {
            ; (window as any).__TAURI__ = {
                core: { invoke: vi.fn().mockResolvedValue('content') },
            }
            mockExplorerState.folder = { name: 'Current', path: '/tmp/current' }
            pushRecentFile('/tmp/current')
            const { getByText } = render(Welcome)
            await fireEvent.click(getByText('main.pas'))
            expect(mockOpenFolderAtPath).not.toHaveBeenCalled()
        })

        it('switches workspace first when there are no dirty tabs', async () => {
            ; (window as any).__TAURI__ = {
                core: { invoke: vi.fn().mockResolvedValue('content') },
            }
            pushRecentFile('/tmp/other')
            const { getByText } = render(Welcome)
            await fireEvent.click(getByText('main.pas'))
            expect(mockOpenFolderAtPath).toHaveBeenCalledWith('/tmp/other')
            await waitFor(() =>
                expect(mockOpenFile).toHaveBeenCalledWith(
                    '/tmp/other/main.pas',
                    'content',
                ),
            )
        })

        it('asks for confirmation when a dirty tab is open, and proceeds if confirmed', async () => {
            ; (window as any).__TAURI__ = {
                core: { invoke: vi.fn().mockResolvedValue('content') },
            }
            mockTabState.tabs = [{ id: 'tab-1', isDirty: true }]
            mockAsk.mockResolvedValueOnce(true)
            pushRecentFile('/tmp/other')
            const { getByText } = render(Welcome)
            await fireEvent.click(getByText('main.pas'))
            expect(mockAsk).toHaveBeenCalled()
            await waitFor(() =>
                expect(mockOpenFolderAtPath).toHaveBeenCalledWith('/tmp/other'),
            )
            await waitFor(() => expect(mockOpenFile).toHaveBeenCalled())
        })

        it('aborts entirely when the user cancels the confirmation', async () => {
            ; (window as any).__TAURI__ = {
                core: { invoke: vi.fn().mockResolvedValue('content') },
            }
            mockTabState.tabs = [{ id: 'tab-1', isDirty: true }]
            mockAsk.mockResolvedValueOnce(false)
            pushRecentFile('/tmp/other')
            const { getByText } = render(Welcome)
            await fireEvent.click(getByText('main.pas'))
            expect(mockAsk).toHaveBeenCalled()
            expect(mockOpenFolderAtPath).not.toHaveBeenCalled()
            expect(mockOpenFile).not.toHaveBeenCalled()
        })

        it('removes the recent entry and does not open the file if reopening the workspace fails', async () => {
            ; (window as any).__TAURI__ = {
                core: { invoke: vi.fn().mockResolvedValue('content') },
            }
            mockOpenFolderAtPath.mockResolvedValueOnce(false)
            pushRecentFile('/tmp/other')
            const { getByText } = render(Welcome)
            await fireEvent.click(getByText('main.pas'))
            expect(mockRemove).toHaveBeenCalledWith('/tmp/other/main.pas')
            expect(mockOpenFile).not.toHaveBeenCalled()
        })
    })
})
