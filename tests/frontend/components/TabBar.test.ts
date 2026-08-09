import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

const { mockShowWelcome, mockCloseWelcome, mockActivate, mockActivateDiff, mockClose, mockTabState } = vi.hoisted(() => ({
    mockShowWelcome: vi.fn(),
    mockCloseWelcome: vi.fn(),
    mockActivate: vi.fn(),
    mockActivateDiff: vi.fn(),
    mockClose: vi.fn(),
    mockTabState: {
        tabs: [] as Array<{ id: string; fileName: string; isDirty: boolean }>,
        activeTabId: null as string | null,
        activeView: 'welcome' as 'welcome' | 'editor' | 'diff',
        welcomeClosed: false,
    },
}))

vi.mock('../../../src/editor/tabs', () => ({
    tabStore: {
        subscribe: (fn: (v: typeof mockTabState) => void) => {
            fn(mockTabState)
            return () => { }
        },
        showWelcome: mockShowWelcome,
        closeWelcome: mockCloseWelcome,
        activate: mockActivate,
        activateDiff: mockActivateDiff,
        close: mockClose,
    },
}))

import TabBar from '../../../src/shared/TabBar.svelte'
import { diffTabStore } from '../../../src/editor/diffTabs'

afterEach(() => {
    cleanup()
    mockTabState.tabs = []
    mockTabState.activeTabId = null
    mockTabState.activeView = 'welcome'
    mockTabState.welcomeClosed = false
    diffTabStore.reset()
    vi.clearAllMocks()
})

describe('TabBar', () => {
    it('always renders the Welcome tab', () => {
        const { getByText } = render(TabBar)
        expect(getByText('Welcome')).toBeInTheDocument()
    })

    it('renders one tab per open file', () => {
        mockTabState.tabs = [
            { id: 'a', fileName: 'main.pas', isDirty: false },
            { id: 'b', fileName: 'utils.pas', isDirty: false },
        ]
        const { getByText } = render(TabBar)
        expect(getByText('main.pas')).toBeInTheDocument()
        expect(getByText('utils.pas')).toBeInTheDocument()
    })

    it('prefixes dirty tabs with a dot', () => {
        mockTabState.tabs = [{ id: 'a', fileName: 'main.pas', isDirty: true }]
        const { getByText } = render(TabBar)
        expect(getByText('● main.pas')).toBeInTheDocument()
    })

    it('calls tabStore.activate when a file tab is clicked', async () => {
        mockTabState.tabs = [{ id: 'a', fileName: 'main.pas', isDirty: false }]
        const { getByText } = render(TabBar)
        await fireEvent.click(getByText('main.pas'))
        expect(mockActivate).toHaveBeenCalledWith('a')
    })

    it('calls tabStore.showWelcome when the Welcome tab is clicked', async () => {
        mockTabState.tabs = [{ id: 'a', fileName: 'main.pas', isDirty: false }]
        const { getByText } = render(TabBar)
        await fireEvent.click(getByText('Welcome'))
        expect(mockShowWelcome).toHaveBeenCalled()
    })

    it('does not render the Welcome tab when welcomeClosed is true', () => {
        mockTabState.welcomeClosed = true
        const { queryByText } = render(TabBar)
        expect(queryByText('Welcome')).not.toBeInTheDocument()
    })

    it('calls tabStore.closeWelcome when the Welcome tab close button is clicked', async () => {
        const { getByLabelText } = render(TabBar)
        await fireEvent.click(getByLabelText('Close Welcome'))
        expect(mockCloseWelcome).toHaveBeenCalled()
    })

    it('calls tabStore.close when a tab close button is clicked', async () => {
        mockTabState.tabs = [{ id: 'a', fileName: 'main.pas', isDirty: false }]
        const { getByLabelText } = render(TabBar)
        await fireEvent.click(getByLabelText('Close main.pas'))
        expect(mockClose).toHaveBeenCalledWith('a')
    })

    it('renders one tab per open diff', () => {
        diffTabStore.open({
            filePath: 'a.pas',
            fileName: 'a.pas',
            staged: false,
            original: 'old',
            modified: 'new',
        })
        const { getByText } = render(TabBar)
        expect(getByText('a.pas')).toBeInTheDocument()
    })

    it('marks diff tabs as read-only', () => {
        diffTabStore.open({
            filePath: 'a.pas',
            fileName: 'a.pas',
            staged: false,
            original: 'old',
            modified: 'new',
        })
        const { getByTitle } = render(TabBar)
        expect(getByTitle('Read-only')).toBeInTheDocument()
    })

    it('calls tabStore.activateDiff when a diff tab is clicked', async () => {
        const tab = diffTabStore.open({
            filePath: 'a.pas',
            fileName: 'a.pas',
            staged: false,
            original: 'old',
            modified: 'new',
        })
        mockActivateDiff.mockClear()
        const { getByText } = render(TabBar)
        await fireEvent.click(getByText('a.pas'))
        expect(mockActivateDiff).toHaveBeenCalledWith(tab.id)
    })

    it('calls diffTabStore.close when a diff tab close button is clicked', async () => {
        diffTabStore.open({
            filePath: 'a.pas',
            fileName: 'a.pas',
            staged: false,
            original: 'old',
            modified: 'new',
        })
        const { getByLabelText, queryByText } = render(TabBar)
        await fireEvent.click(getByLabelText('Close a.pas'))
        expect(queryByText('a.pas')).not.toBeInTheDocument()
    })
})