import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

const {
    mockExplorerState,
    mockOpenFolder,
    mockRefresh,
    mockCloseFolder,
    mockAppState,
    mockTabStoreOpenFile,
    mockTabStoreActivate,
} =
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
        mockAppState: {
            info: null as { platform: string } | null,
            loading: false,
        },
        mockTabStoreOpenFile: vi.fn().mockResolvedValue({ id: 'tab-1' }),
        mockTabStoreActivate: vi.fn(),
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
        openFile: mockTabStoreOpenFile,
        activate: mockTabStoreActivate,
    },
}))

vi.mock('../../../src/app/app', () => ({
    appStore: {
        subscribe: (fn: (v: typeof mockAppState) => void) => {
            fn(mockAppState)
            return () => { }
        },
    },
}))

import FileTree from '../../../src/project/FileTree.svelte'

afterEach(() => {
    cleanup()
    mockExplorerState.folder = null
    mockExplorerState.tree = []
    mockExplorerState.loading = false
    mockExplorerState.error = null
    mockAppState.info = null
    mockAppState.loading = false
    vi.clearAllMocks()
        ; (window as any).__TAURI__ = undefined
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

function setupTree() {
    mockExplorerState.folder = { name: 'MyProject', path: '/tmp/MyProject' }
    mockExplorerState.tree = [
        {
            name: 'main.pas',
            path: '/tmp/MyProject/main.pas',
            relativePath: 'main.pas',
            isDirectory: false,
            children: null,
        },
        {
            name: 'src',
            path: '/tmp/MyProject/src',
            relativePath: 'src',
            isDirectory: true,
            children: [],
        },
    ]
}

describe('FileTree selection and context menu', () => {
    afterEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: undefined,
            configurable: true,
        })
    })

    it('marks a clicked file as selected', async () => {
        setupTree()
        const { getByText } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.click(row)
        expect(row.className).toContain('selected')
    })

    it('marks a clicked folder as selected', async () => {
        setupTree()
        const { getByText } = render(FileTree)
        const row = getByText('src').closest('button') as HTMLElement
        await fireEvent.click(row)
        expect(row.className).toContain('selected')
    })

    it('opens the context menu with "Open" for a file', async () => {
        setupTree()
        const { getByText } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        expect(getByText('Open')).toBeInTheDocument()
    })

    it('opens the context menu without "Open" for a folder', async () => {
        setupTree()
        const { getByText, queryByText } = render(FileTree)
        const row = getByText('src').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        expect(queryByText('Open')).not.toBeInTheDocument()
    })

    it('selects the right-clicked item even when another item was already selected', async () => {
        setupTree()
        const { getByText } = render(FileTree)
        const fileRow = getByText('main.pas').closest('button') as HTMLElement
        const folderRow = getByText('src').closest('button') as HTMLElement
        await fireEvent.click(fileRow)
        expect(fileRow.className).toContain('selected')
        await fireEvent.contextMenu(folderRow)
        expect(folderRow.className).toContain('selected')
        expect(fileRow.className).not.toContain('selected')
    })

    it('opens the file and closes the menu when "Open" is clicked', async () => {
        setupTree()
        const mockInvoke = vi.fn().mockResolvedValue('program content')
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByText, queryByText } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        await fireEvent.click(getByText('Open'))
        expect(queryByText('Open')).not.toBeInTheDocument()
        await vi.waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('read_file', {
                path: '/tmp/MyProject/main.pas',
            })
            expect(mockTabStoreOpenFile).toHaveBeenCalledWith(
                '/tmp/MyProject/main.pas',
                'program content',
            )
            expect(mockTabStoreActivate).toHaveBeenCalledWith('tab-1')
        })
    })

    it('calls reveal_in_file_manager with the node path when the reveal item is clicked', async () => {
        setupTree()
        const mockInvoke = vi.fn().mockResolvedValue(undefined)
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByText } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        await fireEvent.click(getByText('Open Containing Folder'))
        await vi.waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('reveal_in_file_manager', {
                path: '/tmp/MyProject/main.pas',
            })
        })
    })

    it('labels the reveal action for Windows when the platform is windows', async () => {
        setupTree()
        mockAppState.info = { platform: 'windows' }
        const { getByText } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        expect(getByText('Reveal in File Explorer')).toBeInTheDocument()
    })

    it('labels the reveal action for macOS when the platform is macos', async () => {
        setupTree()
        mockAppState.info = { platform: 'macos' }
        const { getByText } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        expect(getByText('Reveal in Finder')).toBeInTheDocument()
    })

    it('copies the absolute path when "Copy Path" is clicked', async () => {
        setupTree()
        const writeText = vi.fn()
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        })
        const { getByText } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        await fireEvent.click(getByText('Copy Path'))
        expect(writeText).toHaveBeenCalledWith('/tmp/MyProject/main.pas')
    })

    it('copies the relative path when "Copy Relative Path" is clicked', async () => {
        setupTree()
        const writeText = vi.fn()
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        })
        const { getByText } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        await fireEvent.click(getByText('Copy Relative Path'))
        expect(writeText).toHaveBeenCalledWith('main.pas')
    })

    it('closes the context menu when Escape is pressed', async () => {
        setupTree()
        const { getByText, queryByText } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        expect(getByText('Open')).toBeInTheDocument()
        await fireEvent.keyDown(window, { key: 'Escape' })
        expect(queryByText('Open')).not.toBeInTheDocument()
    })

    it('closes the context menu when the backdrop is clicked', async () => {
        setupTree()
        const { getByText, queryByText, container } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        expect(getByText('Open')).toBeInTheDocument()
        const backdrop = container.querySelector('.menu-backdrop') as HTMLElement
        await fireEvent.click(backdrop)
        expect(queryByText('Open')).not.toBeInTheDocument()
    })
})