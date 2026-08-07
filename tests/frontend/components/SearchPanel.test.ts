import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

const { mockSearchState, mockSearch, mockToggleCaseSensitive, mockExplorerState } =
    vi.hoisted(() => ({
        mockSearchState: {
            results: [] as Array<{
                filePath: string
                fileName: string
                lineNumber: number
                lineText: string
                column: number
            }>,
            loading: false,
            caseSensitive: false,
        },
        mockSearch: vi.fn(),
        mockToggleCaseSensitive: vi.fn(),
        mockExplorerState: {
            folder: null as { name: string; path: string } | null,
        },
    }))

vi.mock('../../../src/project/searchStore', () => ({
    searchStore: {
        subscribe: (fn: (v: typeof mockSearchState) => void) => {
            fn(mockSearchState)
            return () => { }
        },
        search: mockSearch,
        toggleCaseSensitive: mockToggleCaseSensitive,
    },
    pendingJumpLine: { set: vi.fn() },
}))

vi.mock('../../../src/project/explorerStore', () => ({
    explorerStore: {
        subscribe: (fn: (v: typeof mockExplorerState) => void) => {
            fn(mockExplorerState)
            return () => { }
        },
    },
}))

vi.mock('../../../src/editor/tabs', () => ({
    tabStore: {
        openFile: vi.fn().mockResolvedValue({ id: 'tab-1' }),
        activate: vi.fn(),
    },
}))

import SearchPanel from '../../../src/project/SearchPanel.svelte'

afterEach(() => {
    cleanup()
    mockSearchState.results = []
    mockSearchState.loading = false
    mockSearchState.caseSensitive = false
    mockExplorerState.folder = null
    vi.clearAllMocks()
    vi.useRealTimers()
        ; (window as any).__TAURI__ = undefined
})

describe('SearchPanel', () => {
    it('shows the no-folder message when no folder is open', () => {
        const { getByText } = render(SearchPanel)
        expect(
            getByText('Open a folder to search across files.'),
        ).toBeInTheDocument()
    })

    it('debounces the search call while typing', async () => {
        vi.useFakeTimers()
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        const { getByPlaceholderText } = render(SearchPanel)
        const input = getByPlaceholderText('Search in files...')

        await fireEvent.input(input, { target: { value: 'writeln' } })
        expect(mockSearch).not.toHaveBeenCalled()

        vi.advanceTimersByTime(250)
        expect(mockSearch).toHaveBeenCalledWith('writeln')
    })

    it('shows grouped results by file', () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        mockSearchState.results = [
            {
                filePath: '/tmp/main.pas',
                fileName: 'main.pas',
                lineNumber: 3,
                lineText: "  writeln('hi');",
                column: 2,
            },
        ]
        const { getByText } = render(SearchPanel)
        expect(getByText('main.pas')).toBeInTheDocument()
        expect(getByText("writeln('hi');")).toBeInTheDocument()
    })

    it('toggles case sensitivity and re-runs the search', async () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        const { getByTitle } = render(SearchPanel)
        await fireEvent.click(getByTitle('Match case'))
        expect(mockToggleCaseSensitive).toHaveBeenCalled()
        expect(mockSearch).toHaveBeenCalled()
    })
})