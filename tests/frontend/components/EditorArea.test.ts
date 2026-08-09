import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import { EditorState } from '@codemirror/state'

const { mockTabState, mockConsoleState } = vi.hoisted(() => ({
    mockTabState: {
        tabs: [] as Array<{ id: string; state: unknown }>,
        activeTabId: null as string | null,
        activeView: 'welcome' as 'welcome' | 'editor',
        welcomeClosed: false,
    },
    mockConsoleState: {
        visible: false,
        position: 'bottom' as 'bottom' | 'right',
    },
}))

vi.mock('../../../src/editor/tabs', () => ({
    tabStore: {
        subscribe: (fn: (v: typeof mockTabState) => void) => {
            fn(mockTabState)
            return () => { }
        },
        updateEditorState: vi.fn(),
        getActive: vi.fn(),
        markClean: vi.fn(),
        updateFilePath: vi.fn(),
    },
}))

vi.mock('../../../src/toolchain/console', () => ({
    consoleStore: {
        subscribe: (fn: (v: typeof mockConsoleState) => void) => {
            fn(mockConsoleState)
            return () => { }
        },
    },
}))

vi.mock('../../../src/toolchain/runner', () => ({
    runActiveFile: vi.fn(),
}))

const { mockExplorerState } = vi.hoisted(() => ({
    mockExplorerState: {
        folder: null as { name: string; path: string } | null,
        tree: [] as unknown[],
        loading: false,
        error: null as string | null,
    },
}))

vi.mock('../../../src/project/explorerStore', () => ({
    explorerStore: {
        subscribe: (fn: (v: typeof mockExplorerState) => void) => {
            fn(mockExplorerState)
            return () => { }
        },
        openFolder: vi.fn(),
        refresh: vi.fn(),
        closeFolder: vi.fn(),
    },
}))

import EditorArea from '../../../src/editor/EditorArea.svelte'

afterEach(() => {
    cleanup()
    mockTabState.tabs = []
    mockTabState.activeTabId = null
    mockTabState.activeView = 'welcome'
    mockTabState.welcomeClosed = false
    mockConsoleState.visible = false
    mockConsoleState.position = 'bottom'
    mockExplorerState.folder = null
    mockExplorerState.tree = []
    vi.clearAllMocks()
})

describe('EditorArea', () => {
    it('shows Welcome when there are no open tabs', () => {
        const { container } = render(EditorArea, {
            props: { activePanel: null },
        })
        expect(container.querySelector('#welcome')).toBeInTheDocument()
    })

    it('hides Welcome even with no open tabs when welcomeClosed is true', () => {
        mockTabState.welcomeClosed = true
        const { container } = render(EditorArea, {
            props: { activePanel: null },
        })
        expect(container.querySelector('#welcome')).not.toBeInTheDocument()
    })

    it('shows the editor wrapper as visible when a tab is open and active', () => {
        mockTabState.tabs = [
            { id: 'tab-1', state: EditorState.create({ doc: 'program Test;' }) },
        ]
        mockTabState.activeTabId = 'tab-1'
        mockTabState.activeView = 'editor'
        const { container } = render(EditorArea, {
            props: { activePanel: null },
        })
        expect(container.querySelector('#editor-wrapper')).toHaveClass('visible')
    })

    it('does not show the console area when consoleStore is not visible', () => {
        const { container } = render(EditorArea, {
            props: { activePanel: null },
        })
        expect(container.querySelector('#console-area')).toBeNull()
    })

    it('does not render any side panel when activePanel is null', () => {
        const { container } = render(EditorArea, {
            props: { activePanel: null },
        })
        expect(container.querySelector('#side-panel')).toBeNull()
    })

    it('renders the side panel with explorer content when activePanel is explorer', () => {
        const { container } = render(EditorArea, {
            props: { activePanel: 'explorer' },
        })
        expect(container.querySelector('#side-panel')).toBeInTheDocument()
    })

    it('still renders the main content area alongside the side panel', () => {
        const { container } = render(EditorArea, {
            props: { activePanel: 'explorer' },
        })
        expect(container.querySelector('#main-content')).toBeInTheDocument()
    })

    it('renders main content without a side panel when activePanel is null', () => {
        const { container } = render(EditorArea, {
            props: { activePanel: null },
        })
        expect(container.querySelector('#main-content')).toBeInTheDocument()
    })
})