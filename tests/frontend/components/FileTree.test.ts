import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

const { mockExplorerState, mockOpenFolder, mockRefresh, mockCloseFolder } =
    vi.hoisted(() => ({
        mockExplorerState: {
            folder: null as { name: string; path: string } | null,
            tree: [] as any[],
            loading: false,
            error: null as string | null,
        },
        mockOpenFolder: vi.fn(),
        mockRefresh: vi.fn(),
        mockCloseFolder: vi.fn(),
    }))

vi.mock('../../../src/project/explorerStore', () => ({
    explorerStore: {
        subscribe: (fn: (v: typeof mockExplorerState) => void) => {
            fn(mockExplorerState)
            return () => { }
        },
        openFolder: mockOpenFolder,
        refresh: mockRefresh,
        closeFolder: mockCloseFolder,
    },
}))

vi.mock('../../../src/editor/tabs', () => ({
    tabStore: {
        openFile: vi.fn(),
        activate: vi.fn(),
    },
}))

import FileTree from '../../../src/project/FileTree.svelte'

afterEach(() => {
    cleanup()
    mockExplorerState.folder = null
    mockExplorerState.tree = []
    mockExplorerState.loading = false
    mockExplorerState.error = null
    vi.clearAllMocks()
})

describe('FileTree', () => {
    it('shows the empty state when no folder is open', () => {
        const { getByText } = render(FileTree)
        expect(getByText('No folder open.')).toBeInTheDocument()
    })

    it('calls explorerStore.openFolder when the open button is clicked', async () => {
        const { getByText } = render(FileTree)
        await fireEvent.click(getByText('Open Folder...'))
        expect(mockOpenFolder).toHaveBeenCalled()
    })

    it('shows the folder name and tree once a folder is open', () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp/MyProject' }
        mockExplorerState.tree = [
            {
                name: 'main.pas',
                path: '/tmp/MyProject/main.pas',
                relativePath: 'main.pas',
                isDirectory: false,
                children: null,
            },
        ]
        const { getByText } = render(FileTree)
        expect(getByText('MyProject')).toBeInTheDocument()
        expect(getByText('main.pas')).toBeInTheDocument()
    })

    it('shows a loading message while the tree loads', () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp/MyProject' }
        mockExplorerState.loading = true
        const { getByText } = render(FileTree)
        expect(getByText('Loading...')).toBeInTheDocument()
    })

    it('shows an error message when present', () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp/MyProject' }
        mockExplorerState.error = 'Permission denied'
        const { getByText } = render(FileTree)
        expect(getByText('Permission denied')).toBeInTheDocument()
    })

    it('shows the empty-folder message when the tree has no entries', () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp/MyProject' }
        mockExplorerState.tree = []
        const { getByText } = render(FileTree)
        expect(getByText('This folder is empty.')).toBeInTheDocument()
    })

    it('calls explorerStore.refresh when the refresh button is clicked', async () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp/MyProject' }
        const { getByTitle } = render(FileTree)
        await fireEvent.click(getByTitle('Refresh'))
        expect(mockRefresh).toHaveBeenCalled()
    })

    it('calls explorerStore.closeFolder when the close button is clicked', async () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp/MyProject' }
        const { getByTitle } = render(FileTree)
        await fireEvent.click(getByTitle('Close folder'))
        expect(mockCloseFolder).toHaveBeenCalled()
    })
})