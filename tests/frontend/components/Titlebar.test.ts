import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte'

const { mockRecentWorkspaceEntries, mockEmit } = vi.hoisted(() => ({
    mockRecentWorkspaceEntries: [] as Array<{
        path: string
        name: string
        openedAt: number
    }>,
    mockEmit: vi.fn(),
}))

vi.mock('../../../src/project/recentWorkspaces', () => ({
    recentWorkspacesStore: {
        subscribe: (fn: (v: typeof mockRecentWorkspaceEntries) => void) => {
            fn(mockRecentWorkspaceEntries)
            return () => { }
        },
    },
}))

vi.mock('@tauri-apps/api/event', () => ({
    emit: mockEmit,
}))

import Titlebar from '../../../src/app/Titlebar.svelte'

afterEach(() => {
    cleanup()
    mockRecentWorkspaceEntries.length = 0
    vi.clearAllMocks()
        ; (window as any).__TAURI__ = undefined
})

describe('Titlebar', () => {
    it('renders the File, Edit, and Help menu triggers', () => {
        const { getByText } = render(Titlebar)
        expect(getByText('File')).toBeInTheDocument()
        expect(getByText('Edit')).toBeInTheDocument()
        expect(getByText('Help')).toBeInTheDocument()
    })

    it('does not show a dropdown before a menu is clicked', () => {
        const { queryByText } = render(Titlebar)
        expect(queryByText('New File')).not.toBeInTheDocument()
    })

    it('opens the File menu and shows its items', async () => {
        const { getByText } = render(Titlebar)
        await fireEvent.click(getByText('File'))
        expect(getByText('New File')).toBeInTheDocument()
        expect(getByText('Open File...')).toBeInTheDocument()
        expect(getByText('Save')).toBeInTheDocument()
    })

    it('toggles the menu closed when clicked again', async () => {
        const { getByText, queryByText } = render(Titlebar)
        await fireEvent.click(getByText('File'))
        await fireEvent.click(getByText('File'))
        expect(queryByText('New File')).not.toBeInTheDocument()
    })

    it('switches to the Help menu when clicked while File is open', async () => {
        const { getByText, queryByText } = render(Titlebar)
        await fireEvent.click(getByText('File'))
        await fireEvent.click(getByText('Help'))
        expect(queryByText('New File')).not.toBeInTheDocument()
        expect(getByText('About Pascoal')).toBeInTheDocument()
    })

    it('closes the menu on Escape', async () => {
        const { getByText, queryByText } = render(Titlebar)
        await fireEvent.click(getByText('File'))
        await fireEvent.keyDown(window, { key: 'Escape' })
        expect(queryByText('New File')).not.toBeInTheDocument()
    })

    it('closes the menu when an item is clicked', async () => {
        const { getByText, queryByText } = render(Titlebar)
        await fireEvent.click(getByText('File'))
        await fireEvent.click(getByText('New File'))
        expect(queryByText('New File')).not.toBeInTheDocument()
    })

    describe('recent workspaces', () => {
        it('does not show any recent workspace entries when the list is empty', async () => {
            const { getByText, container } = render(Titlebar)
            await fireEvent.click(getByText('File'))
            expect(container.querySelectorAll('.menu-sep')).toHaveLength(1)
        })

        it('lists recent workspaces after a separator when present', async () => {
            mockRecentWorkspaceEntries.push({
                path: '/tmp/MyProject',
                name: 'MyProject',
                openedAt: Date.now(),
            })
            const { getByText, container } = render(Titlebar)
            await fireEvent.click(getByText('File'))
            expect(getByText('MyProject')).toBeInTheDocument()
            expect(container.querySelectorAll('.menu-sep')).toHaveLength(2)
        })

        it('caps the recent workspaces shown in the menu at 5', async () => {
            for (let i = 1; i <= 7; i++) {
                mockRecentWorkspaceEntries.push({
                    path: `/tmp/project${i}`,
                    name: `project${i}`,
                    openedAt: Date.now(),
                })
            }
            const { getByText, queryByText } = render(Titlebar)
            await fireEvent.click(getByText('File'))
            expect(getByText('project1')).toBeInTheDocument()
            expect(getByText('project5')).toBeInTheDocument()
            expect(queryByText('project6')).not.toBeInTheDocument()
            expect(queryByText('project7')).not.toBeInTheDocument()
        })

        it('emits menu-open-recent-workspace with the path when clicked', async () => {
            ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
            mockRecentWorkspaceEntries.push({
                path: '/tmp/MyProject',
                name: 'MyProject',
                openedAt: Date.now(),
            })
            const { getByText } = render(Titlebar)
            await fireEvent.click(getByText('File'))
            await fireEvent.click(getByText('MyProject'))
            await waitFor(() =>
                expect(mockEmit).toHaveBeenCalledWith(
                    'menu-open-recent-workspace',
                    '/tmp/MyProject',
                ),
            )
        })
    })
})

describe('Titlebar Edit menu', () => {
    it('opens the Edit menu and shows Undo, Redo, Cut, Copy, Paste, Find, Replace, Find in Files, and Toggle Line Comment', async () => {
        const { getByText, container } = render(Titlebar)
        await fireEvent.click(getByText('Edit'))
        expect(getByText('Undo')).toBeInTheDocument()
        expect(getByText('Redo')).toBeInTheDocument()
        expect(getByText('Cut')).toBeInTheDocument()
        expect(getByText('Copy')).toBeInTheDocument()
        expect(getByText('Paste')).toBeInTheDocument()
        expect(getByText('Find')).toBeInTheDocument()
        expect(getByText('Replace')).toBeInTheDocument()
        expect(getByText('Find in Files')).toBeInTheDocument()
        expect(getByText('Toggle Line Comment')).toBeInTheDocument()
        expect(container.querySelectorAll('.menu-sep')).toHaveLength(3)
    })

    it.each([
        ['Undo', 'menu-undo'],
        ['Redo', 'menu-redo'],
        ['Cut', 'menu-cut'],
        ['Copy', 'menu-copy'],
        ['Paste', 'menu-paste'],
        ['Find', 'menu-find'],
        ['Replace', 'menu-replace'],
        ['Find in Files', 'menu-find-in-files'],
        ['Toggle Line Comment', 'menu-toggle-comment'],
    ])('emits %s as %s when clicked', async (label, event) => {
        ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
        const { getByText } = render(Titlebar)
        await fireEvent.click(getByText('Edit'))
        await fireEvent.click(getByText(label))
        await waitFor(() =>
            expect(mockEmit).toHaveBeenCalledWith(event, undefined),
        )
    })

    it('closes the menu when an Edit item is clicked', async () => {
        ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
        const { getByText, queryByText } = render(Titlebar)
        await fireEvent.click(getByText('Edit'))
        await fireEvent.click(getByText('Undo'))
        expect(queryByText('Redo')).not.toBeInTheDocument()
    })
})
