import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'

const { mockActivateDiff, mockFallbackFromDiff, mockTabState } = vi.hoisted(() => ({
    mockActivateDiff: vi.fn((id: string) => {
        mockTabState.activeTabId = id
        mockTabState.activeView = 'diff'
    }),
    mockFallbackFromDiff: vi.fn(),
    mockTabState: {
        activeTabId: null as string | null,
        activeView: 'welcome' as 'welcome' | 'editor' | 'diff',
        tabs: [] as unknown[],
    },
}))

vi.mock('../../../src/editor/tabs', () => ({
    tabStore: {
        subscribe: (fn: (v: typeof mockTabState) => void) => {
            fn(mockTabState)
            return () => { }
        },
        activateDiff: mockActivateDiff,
        fallbackFromDiff: mockFallbackFromDiff,
    },
}))

import { diffTabStore } from '../../../src/editor/diffTabs'

function makeTab(filePath: string, staged = false) {
    return { filePath, fileName: filePath, staged, original: 'old', modified: 'new' }
}

beforeEach(() => {
    diffTabStore.reset()
    mockTabState.activeTabId = null
    mockTabState.activeView = 'welcome'
    vi.clearAllMocks()
})

describe('diffTabStore', () => {
    it('opens a new diff tab and activates it', () => {
        const tab = diffTabStore.open(makeTab('a.pas'))
        expect(get(diffTabStore)).toHaveLength(1)
        expect(mockActivateDiff).toHaveBeenCalledWith(tab.id)
    })

    it('reuses an existing tab for the same file and staged flag instead of duplicating', () => {
        const first = diffTabStore.open(makeTab('a.pas'))
        const second = diffTabStore.open(makeTab('a.pas'))
        expect(first.id).toBe(second.id)
        expect(get(diffTabStore)).toHaveLength(1)
    })

    it('opens separate tabs for staged vs unstaged diffs of the same file', () => {
        diffTabStore.open(makeTab('a.pas', false))
        diffTabStore.open(makeTab('a.pas', true))
        expect(get(diffTabStore)).toHaveLength(2)
    })

    it('removes the tab on close', () => {
        const tab = diffTabStore.open(makeTab('a.pas'))
        diffTabStore.close(tab.id)
        expect(get(diffTabStore)).toHaveLength(0)
    })

    it('falls back to an adjacent tab when closing the active diff tab with others remaining', () => {
        const first = diffTabStore.open(makeTab('a.pas'))
        const second = diffTabStore.open(makeTab('b.pas'))
        mockTabState.activeTabId = second.id
        mockTabState.activeView = 'diff'
        vi.clearAllMocks()

        diffTabStore.close(second.id)

        expect(mockActivateDiff).toHaveBeenCalledWith(first.id)
    })

    it('calls tabStore.fallbackFromDiff when closing the last diff tab', () => {
        const tab = diffTabStore.open(makeTab('a.pas'))
        mockTabState.activeTabId = tab.id
        mockTabState.activeView = 'diff'
        vi.clearAllMocks()

        diffTabStore.close(tab.id)

        expect(mockFallbackFromDiff).toHaveBeenCalled()
    })

    it('does not touch tabStore when closing a diff tab that is not the active one', () => {
        const first = diffTabStore.open(makeTab('a.pas'))
        const second = diffTabStore.open(makeTab('b.pas'))
        mockTabState.activeTabId = second.id
        mockTabState.activeView = 'diff'
        vi.clearAllMocks()

        diffTabStore.close(first.id)

        expect(mockActivateDiff).not.toHaveBeenCalled()
        expect(mockFallbackFromDiff).not.toHaveBeenCalled()
    })
})