import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

const { mockShowWelcome, mockActivate, mockClose, mockTabState } = vi.hoisted(() => ({
    mockShowWelcome: vi.fn(),
    mockActivate: vi.fn(),
    mockClose: vi.fn(),
    mockTabState: {
        tabs: [] as Array<{ id: string; fileName: string; isDirty: boolean }>,
        activeTabId: null as string | null,
        activeView: 'welcome' as 'welcome' | 'editor',
    },
}))

vi.mock('../../../src/editor/tabs', () => ({
    tabStore: {
        subscribe: (fn: (v: typeof mockTabState) => void) => {
            fn(mockTabState)
            return () => { }
        },
        showWelcome: mockShowWelcome,
        activate: mockActivate,
        close: mockClose,
    },
}))

import TabBar from '../../../src/shared/TabBar.svelte'

afterEach(() => {
    cleanup()
    mockTabState.tabs = []
    mockTabState.activeTabId = null
    mockTabState.activeView = 'welcome'
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

    it('calls tabStore.close when a tab close button is clicked', async () => {
        mockTabState.tabs = [{ id: 'a', fileName: 'main.pas', isDirty: false }]
        const { getByLabelText } = render(TabBar)
        await fireEvent.click(getByLabelText('Close main.pas'))
        expect(mockClose).toHaveBeenCalledWith('a')
    })
})