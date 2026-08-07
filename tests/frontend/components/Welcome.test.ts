import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte'

const {
    mockNewTab,
    mockActivate,
    mockOpenFile,
    mockValidateWorkspaces,
    mockAddWorkspace,
    mockRemoveWorkspace,
    mockRecentWorkspaceEntries,
    mockTabState,
    mockEmit,
} = vi.hoisted(() => ({
    mockNewTab: vi.fn().mockResolvedValue({ id: 'new-tab' }),
    mockActivate: vi.fn(),
    mockOpenFile: vi.fn().mockResolvedValue({ id: 'opened-tab' }),
    mockValidateWorkspaces: vi.fn(),
    mockAddWorkspace: vi.fn(),
    mockRemoveWorkspace: vi.fn(),
    mockRecentWorkspaceEntries: [] as Array<{
        path: string
        name: string
        openedAt: number
    }>,
    mockTabState: {
        tabs: [] as Array<{ id: string; isDirty: boolean }>,
        activeTabId: null as string | null,
    },
    mockEmit: vi.fn(),
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

vi.mock('@tauri-apps/api/event', () => ({
    emit: mockEmit,
}))

import Welcome from '../../../src/app/Welcome.svelte'

afterEach(() => {
    cleanup()
    mockRecentWorkspaceEntries.length = 0
    mockTabState.tabs = []
    mockTabState.activeTabId = null
    vi.clearAllMocks()
        ; (window as any).__TAURI__ = undefined
})

describe('Welcome', () => {
    it('calls recentWorkspacesStore.validate on mount', () => {
        render(Welcome)
        expect(mockValidateWorkspaces).toHaveBeenCalled()
    })

    it('creates and activates a new tab when "New File..." is clicked', async () => {
        const { getByText } = render(Welcome)
        await fireEvent.click(getByText('New File...'))
        expect(mockNewTab).toHaveBeenCalled()
        expect(mockActivate).toHaveBeenCalledWith('new-tab')
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

        // Opening a recent workspace from here is routed through the same
        // menu-open-recent-workspace event the File menu uses (handled in
        // App.svelte) rather than calling explorerStore directly - that
        // listener is what switches the active panel to 'explorer' on
        // success, so opening a workspace visibly shows the folder instead
        // of silently updating state in the background. Success/failure
        // handling (including pruning a stale recentWorkspacesStore entry)
        // lives in that listener now, not in this component.
        it('emits menu-open-recent-workspace when a recent workspace is clicked', async () => {
            ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
            mockRecentWorkspaceEntries.push({
                path: '/tmp/MyProject',
                name: 'MyProject',
                openedAt: Date.now(),
            })
            const { getByText } = render(Welcome)
            await fireEvent.click(getByText('MyProject'))
            await waitFor(() =>
                expect(mockEmit).toHaveBeenCalledWith(
                    'menu-open-recent-workspace',
                    '/tmp/MyProject',
                ),
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
})
