import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

const {
    mockNewTab,
    mockActivate,
    mockOpenFile,
    mockValidate,
    mockAdd,
    mockRemove,
    mockRecentEntries,
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
    }>,
}))

vi.mock('../../../src/editor/tabs', () => ({
    tabStore: {
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

import Welcome from '../../../src/app/Welcome.svelte'

afterEach(() => {
    cleanup()
    mockRecentEntries.length = 0
    vi.clearAllMocks()
})

describe('Welcome', () => {
    it('calls recentStore.validate on mount', () => {
        render(Welcome)
        expect(mockValidate).toHaveBeenCalled()
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
})