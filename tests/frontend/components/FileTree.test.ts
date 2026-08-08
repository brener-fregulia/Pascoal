import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

const {
    mockExplorerState,
    mockOpenFolder,
    mockRefresh,
    mockCloseFolder,
    mockAppState,
    mockTabState,
    mockTabStoreOpenFile,
    mockTabStoreActivate,
    mockTabStoreRemapPaths,
    mockTabStoreClose,
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
        mockTabState: {
            tabs: [] as { id: string; filePath: string | null }[],
            activeTabId: null as string | null,
            activeView: 'welcome' as const,
        },
        mockTabStoreOpenFile: vi.fn().mockResolvedValue({ id: 'tab-1' }),
        mockTabStoreActivate: vi.fn(),
        mockTabStoreRemapPaths: vi.fn(),
        mockTabStoreClose: vi.fn().mockResolvedValue(true),
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
        subscribe: (fn: (v: typeof mockTabState) => void) => {
            fn(mockTabState)
            return () => { }
        },
        openFile: mockTabStoreOpenFile,
        activate: mockTabStoreActivate,
        remapPaths: mockTabStoreRemapPaths,
        close: mockTabStoreClose,
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
    mockTabState.tabs = []
    mockTabState.activeTabId = null
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

describe('FileTree create file and folder', () => {
    afterEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: undefined,
            configurable: true,
        })
    })

    it('creates at the workspace root when nothing is selected and the toolbar "New File" button is clicked', async () => {
        setupTree()
        const mockInvoke = vi.fn().mockResolvedValue('/tmp/MyProject/new.pas')
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByTitle, container } = render(FileTree)

        await fireEvent.click(getByTitle('New File'))
        const input = container.querySelector('.new-entry-input') as HTMLInputElement
        expect(input).toBeInTheDocument()

        await fireEvent.input(input, { target: { value: 'new.pas' } })
        await fireEvent.keyDown(input, { key: 'Enter' })

        await vi.waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('create_file', {
                parentPath: '/tmp/MyProject',
                name: 'new.pas',
            })
        })
    })

    it('creates inside the selected folder, expanding it, when the toolbar "New File" button is clicked', async () => {
        setupTree()
        const mockInvoke = vi.fn().mockResolvedValue('/tmp/MyProject/src/new.pas')
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByText, getByTitle, container } = render(FileTree)

        const folderRow = getByText('src').closest('button') as HTMLElement
        // Selecting via the context menu (rather than a plain click) leaves
        // the folder collapsed, so this also exercises the "expand it if
        // collapsed" behavior of the toolbar action below.
        await fireEvent.contextMenu(folderRow)
        await fireEvent.keyDown(window, { key: 'Escape' })
        expect(folderRow.querySelector('.chevron')?.textContent).toBe('▸')

        await fireEvent.click(getByTitle('New File'))

        expect(folderRow.querySelector('.chevron')?.textContent).toBe('▾')
        const input = container.querySelector('.new-entry-input') as HTMLInputElement
        expect(input).toBeInTheDocument()

        await fireEvent.input(input, { target: { value: 'new.pas' } })
        await fireEvent.keyDown(input, { key: 'Enter' })

        await vi.waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('create_file', {
                parentPath: '/tmp/MyProject/src',
                name: 'new.pas',
            })
        })
    })

    it('creates at the workspace root, not at the selected file’s own folder, when a file is selected', async () => {
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
                children: [
                    {
                        name: 'inner.pas',
                        path: '/tmp/MyProject/src/inner.pas',
                        relativePath: 'src/inner.pas',
                        isDirectory: false,
                        children: null,
                    },
                ],
            },
        ]
        const mockInvoke = vi.fn().mockResolvedValue('/tmp/MyProject/root.pas')
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByText, getByTitle, container } = render(FileTree)

        await fireEvent.click(getByText('src')) // expands and selects the folder
        await fireEvent.click(getByText('inner.pas')) // selects the nested file

        await fireEvent.click(getByTitle('New File'))

        const input = container.querySelector('.new-entry-input') as HTMLInputElement
        expect(input).toBeInTheDocument()
        await fireEvent.input(input, { target: { value: 'root.pas' } })
        await fireEvent.keyDown(input, { key: 'Enter' })

        await vi.waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('create_file', {
                parentPath: '/tmp/MyProject',
                name: 'root.pas',
            })
        })
    })

    it('clears the input, refreshes the tree, and opens the created file on success', async () => {
        setupTree()
        const mockInvoke = vi.fn((cmd: string) => {
            if (cmd === 'create_file') return Promise.resolve('/tmp/MyProject/new.pas')
            if (cmd === 'read_file') return Promise.resolve('program New;')
            return Promise.resolve(undefined)
        })
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByTitle, container } = render(FileTree)

        await fireEvent.click(getByTitle('New File'))
        const input = container.querySelector('.new-entry-input') as HTMLInputElement
        await fireEvent.input(input, { target: { value: 'new.pas' } })
        await fireEvent.keyDown(input, { key: 'Enter' })

        await vi.waitFor(() => {
            expect(container.querySelector('.new-entry-input')).not.toBeInTheDocument()
        })
        expect(mockRefresh).toHaveBeenCalled()
        await vi.waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('read_file', {
                path: '/tmp/MyProject/new.pas',
            })
            expect(mockTabStoreOpenFile).toHaveBeenCalledWith(
                '/tmp/MyProject/new.pas',
                'program New;',
            )
            expect(mockTabStoreActivate).toHaveBeenCalledWith('tab-1')
        })
    })

    it('keeps the input open and shows the error message when the name conflicts with an existing entry', async () => {
        setupTree()
        const mockInvoke = vi
            .fn()
            .mockRejectedValue(new Error('A file or folder with this name already exists'))
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByTitle, getByText, container } = render(FileTree)

        await fireEvent.click(getByTitle('New File'))
        const input = container.querySelector('.new-entry-input') as HTMLInputElement
        await fireEvent.input(input, { target: { value: 'main.pas' } })
        await fireEvent.keyDown(input, { key: 'Enter' })

        await vi.waitFor(() => {
            expect(
                getByText('A file or folder with this name already exists'),
            ).toBeInTheDocument()
        })
        expect(container.querySelector('.new-entry-input')).toBeInTheDocument()
    })

    it('cancels without calling the backend when Escape is pressed', async () => {
        setupTree()
        const mockInvoke = vi.fn()
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByTitle, container } = render(FileTree)

        await fireEvent.click(getByTitle('New File'))
        const input = container.querySelector('.new-entry-input') as HTMLInputElement
        await fireEvent.input(input, { target: { value: 'new.pas' } })
        await fireEvent.keyDown(input, { key: 'Escape' })

        expect(container.querySelector('.new-entry-input')).not.toBeInTheDocument()
        expect(mockInvoke).not.toHaveBeenCalledWith('create_file', expect.anything())
    })

    // Regression test for a real bug caught by this exact test while it was
    // being written: NewEntryRow's `parentPath` prop was originally bound to
    // `pendingCreate.parentPath` (a live reference to the *shared* state) in
    // FileTree.svelte/FileTreeNode.svelte, instead of the row's own stable
    // `node.path`/`folder.path`. That made a stale blur from a replaced
    // request clobber the request that replaced it, since the shared
    // parentPath had already moved on to the new target by the time the old
    // row's blur fired. Fixed by passing `node.path`/`folder.path` instead -
    // see the comment on NewEntryRow's handleBlur for the full explanation.
    it('keeps a newer pending create request alive when a stale blur from the request it replaced fires', async () => {
        setupTree()
        const mockInvoke = vi.fn()
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByText, container } = render(FileTree)

        // Start a pending create for the "src" folder via its context menu.
        const folderRow = getByText('src').closest('button') as HTMLElement
        await fireEvent.contextMenu(folderRow)
        await fireEvent.click(getByText('New File'))
        const staleInput = container.querySelector('.new-entry-input') as HTMLInputElement
        expect(staleInput).toBeInTheDocument()

        // A new create request for the workspace root replaces the pending
        // one for "src" - this is the request that must survive below.
        await fireEvent.contextMenu(container.querySelector('.tree-body') as HTMLElement)
        await fireEvent.click(getByText('New File'))
        const freshInput = container.querySelector('.new-entry-input') as HTMLInputElement
        expect(freshInput).toBeInTheDocument()
        expect(freshInput).not.toBe(staleInput)

        // A stale blur from the now-detached "src" row (e.g. fired as a
        // side effect of it being unmounted) must not clear the request
        // that already replaced it.
        await fireEvent.blur(staleInput)

        expect(container.querySelector('.new-entry-input')).toBe(freshInput)
        expect(mockInvoke).not.toHaveBeenCalledWith('create_file', expect.anything())
    })
})

describe('FileTree rename file and folder', () => {
    afterEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: undefined,
            configurable: true,
        })
    })

    it('starts renaming the selected item when F2 is pressed', async () => {
        setupTree()
        const { getByText, container } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.click(row)
        await fireEvent.keyDown(window, { key: 'F2' })

        const input = container.querySelector('.rename-input') as HTMLInputElement
        expect(input).toBeInTheDocument()
        expect(input.value).toBe('main.pas')
    })

    it('does nothing when F2 is pressed with nothing selected', async () => {
        setupTree()
        const { container } = render(FileTree)
        await fireEvent.keyDown(window, { key: 'F2' })
        expect(container.querySelector('.rename-input')).not.toBeInTheDocument()
    })

    it('does nothing when F2 is pressed while a create is already pending', async () => {
        setupTree()
        const { getByText, getByTitle, container } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.click(row)
        await fireEvent.click(getByTitle('New File'))
        expect(container.querySelector('.new-entry-input')).toBeInTheDocument()

        await fireEvent.keyDown(window, { key: 'F2' })

        expect(container.querySelector('.new-entry-input')).toBeInTheDocument()
        expect(container.querySelector('.rename-input')).not.toBeInTheDocument()
    })

    it('does nothing when F2 is pressed while a rename is already pending on another item', async () => {
        setupTree()
        const { getByText, container } = render(FileTree)
        const fileRow = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.click(fileRow)
        await fireEvent.keyDown(window, { key: 'F2' })
        const input = container.querySelector('.rename-input') as HTMLInputElement
        expect(input).toBeInTheDocument()

        // Select a different item, then try F2 again - the guard must block
        // it since a rename is already pending, leaving the original request
        // untouched.
        const folderRow = getByText('src').closest('button') as HTMLElement
        await fireEvent.click(folderRow)
        await fireEvent.keyDown(window, { key: 'F2' })

        expect(container.querySelectorAll('.rename-input')).toHaveLength(1)
        expect(container.querySelector('.rename-input')).toBe(input)
        expect(input.value).toBe('main.pas')
    })

    it('starts renaming a file via the context menu', async () => {
        setupTree()
        const { getByText, container } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        await fireEvent.click(getByText('Rename'))

        const input = container.querySelector('.rename-input') as HTMLInputElement
        expect(input).toBeInTheDocument()
        expect(input.value).toBe('main.pas')
    })

    it('starts renaming a folder via the context menu', async () => {
        setupTree()
        const { getByText, container } = render(FileTree)
        const row = getByText('src').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        await fireEvent.click(getByText('Rename'))

        const input = container.querySelector('.rename-input') as HTMLInputElement
        expect(input).toBeInTheDocument()
        expect(input.value).toBe('src')
    })

    it('confirms a valid new name, calls rename_path, closes the input, and refreshes the tree', async () => {
        setupTree()
        const mockInvoke = vi.fn().mockResolvedValue('/tmp/MyProject/renamed.pas')
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByText, container } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        await fireEvent.click(getByText('Rename'))
        const input = container.querySelector('.rename-input') as HTMLInputElement
        await fireEvent.input(input, { target: { value: 'renamed.pas' } })
        await fireEvent.keyDown(input, { key: 'Enter' })

        await vi.waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith('rename_path', {
                path: '/tmp/MyProject/main.pas',
                newName: 'renamed.pas',
            })
        })
        await vi.waitFor(() => {
            expect(container.querySelector('.rename-input')).not.toBeInTheDocument()
        })
        expect(mockRefresh).toHaveBeenCalled()
    })

    it('does not call the backend when confirming with the same name', async () => {
        setupTree()
        const mockInvoke = vi.fn()
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByText, container } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        await fireEvent.click(getByText('Rename'))
        const input = container.querySelector('.rename-input') as HTMLInputElement
        await fireEvent.keyDown(input, { key: 'Enter' })

        expect(container.querySelector('.rename-input')).not.toBeInTheDocument()
        expect(mockInvoke).not.toHaveBeenCalledWith('rename_path', expect.anything())
    })

    it('does not call the backend when confirming with an empty or whitespace-only name', async () => {
        setupTree()
        const mockInvoke = vi.fn()
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByText, container } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        await fireEvent.click(getByText('Rename'))
        const input = container.querySelector('.rename-input') as HTMLInputElement
        await fireEvent.input(input, { target: { value: '   ' } })
        await fireEvent.keyDown(input, { key: 'Enter' })

        expect(container.querySelector('.rename-input')).not.toBeInTheDocument()
        expect(mockInvoke).not.toHaveBeenCalledWith('rename_path', expect.anything())
    })

    it('keeps the input open and shows the error message when the new name conflicts with an existing entry', async () => {
        setupTree()
        const mockInvoke = vi
            .fn()
            .mockRejectedValue(new Error('A file or folder with this name already exists'))
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByText, container } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        await fireEvent.click(getByText('Rename'))
        const input = container.querySelector('.rename-input') as HTMLInputElement
        await fireEvent.input(input, { target: { value: 'src' } })
        await fireEvent.keyDown(input, { key: 'Enter' })

        await vi.waitFor(() => {
            expect(
                getByText('A file or folder with this name already exists'),
            ).toBeInTheDocument()
        })
        expect(container.querySelector('.rename-input')).toBeInTheDocument()
    })

    it('cancels without calling the backend when Escape is pressed', async () => {
        setupTree()
        const mockInvoke = vi.fn()
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByText, container } = render(FileTree)
        const row = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.contextMenu(row)
        await fireEvent.click(getByText('Rename'))
        const input = container.querySelector('.rename-input') as HTMLInputElement
        await fireEvent.input(input, { target: { value: 'renamed.pas' } })
        await fireEvent.keyDown(input, { key: 'Escape' })

        expect(container.querySelector('.rename-input')).not.toBeInTheDocument()
        expect(mockInvoke).not.toHaveBeenCalledWith('rename_path', expect.anything())
    })

    // Regression test proving FileTreeNode.svelte passes RenameInput its own
    // stable `node.path`, not a live read of the shared "what's being
    // renamed now" state - see the comment on RenameInput.svelte's
    // handleBlur. A stale blur from a rename request that was already
    // replaced by a newer one must be a no-op, not a clobber of the request
    // that replaced it. (This is the same class of race NewEntryRow had for
    // create requests before it was fixed in the previous sub-item.)
    it('keeps a newer pending rename request alive when a stale blur from the request it replaced fires', async () => {
        setupTree()
        const mockInvoke = vi.fn()
            ; (window as any).__TAURI__ = { core: { invoke: mockInvoke } }
        const { getByText, container } = render(FileTree)

        // Start renaming "main.pas" via F2.
        const fileRow = getByText('main.pas').closest('button') as HTMLElement
        await fireEvent.click(fileRow)
        await fireEvent.keyDown(window, { key: 'F2' })
        const staleInput = container.querySelector('.rename-input') as HTMLInputElement
        expect(staleInput).toBeInTheDocument()
        expect(staleInput.value).toBe('main.pas')

        // A rename request for "src", started via the context menu, replaces
        // the pending one for "main.pas" - this is the request that must
        // survive below.
        const folderRow = getByText('src').closest('button') as HTMLElement
        await fireEvent.contextMenu(folderRow)
        await fireEvent.click(getByText('Rename'))
        const freshInput = container.querySelector('.rename-input') as HTMLInputElement
        expect(freshInput).toBeInTheDocument()
        expect(freshInput).not.toBe(staleInput)
        expect(freshInput.value).toBe('src')

        // A stale blur from the now-detached "main.pas" row (e.g. fired as a
        // side effect of it being unmounted) must not clear the request that
        // already replaced it.
        await fireEvent.blur(staleInput)

        expect(container.querySelector('.rename-input')).toBe(freshInput)
        expect(mockInvoke).not.toHaveBeenCalledWith('rename_path', expect.anything())
    })
})