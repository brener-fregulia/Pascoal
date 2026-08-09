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

import Menu from '../../../src/app/Menu.svelte'

afterEach(() => {
    cleanup()
    mockRecentWorkspaceEntries.length = 0
    vi.clearAllMocks()
        ; (window as any).__TAURI__ = undefined
})

describe('Menu', () => {
    it('renders the File, Edit, and Help menu triggers', () => {
        const { getByText } = render(Menu)
        expect(getByText('File')).toBeInTheDocument()
        expect(getByText('Edit')).toBeInTheDocument()
        expect(getByText('Help')).toBeInTheDocument()
    })

    it('does not show a dropdown before a menu is clicked', () => {
        const { queryByText } = render(Menu)
        expect(queryByText('New File')).not.toBeInTheDocument()
    })

    it('opens the File menu and shows its items', async () => {
        const { getByText } = render(Menu)
        await fireEvent.click(getByText('File'))
        expect(getByText('New File')).toBeInTheDocument()
        expect(getByText('Open File...')).toBeInTheDocument()
        expect(getByText('Save')).toBeInTheDocument()
    })

    it('toggles the menu closed when clicked again', async () => {
        const { getByText, queryByText } = render(Menu)
        await fireEvent.click(getByText('File'))
        await fireEvent.click(getByText('File'))
        expect(queryByText('New File')).not.toBeInTheDocument()
    })

    it('switches to the Help menu when clicked while File is open', async () => {
        const { getByText, queryByText } = render(Menu)
        await fireEvent.click(getByText('File'))
        await fireEvent.click(getByText('Help'))
        expect(queryByText('New File')).not.toBeInTheDocument()
        expect(getByText('About Pascoal')).toBeInTheDocument()
    })

    it('closes the menu on Escape', async () => {
        const { getByText, queryByText } = render(Menu)
        await fireEvent.click(getByText('File'))
        await fireEvent.keyDown(window, { key: 'Escape' })
        expect(queryByText('New File')).not.toBeInTheDocument()
    })

    it('closes the menu when clicking the backdrop', async () => {
        const { getByText, queryByText, container } = render(Menu)
        await fireEvent.click(getByText('File'))
        const backdrop = container.querySelector('.menu-backdrop')
        expect(backdrop).toBeInTheDocument()
        await fireEvent.click(backdrop as Element)
        expect(queryByText('New File')).not.toBeInTheDocument()
    })

    it('closes the menu when an item is clicked', async () => {
        const { getByText, queryByText } = render(Menu)
        await fireEvent.click(getByText('File'))
        await fireEvent.click(getByText('New File'))
        expect(queryByText('New File')).not.toBeInTheDocument()
    })

    describe('recent workspaces', () => {
        it('does not show any recent workspace entries when the list is empty', async () => {
            const { getByText, container } = render(Menu)
            await fireEvent.click(getByText('File'))
            expect(container.querySelectorAll('.menu-sep')).toHaveLength(1)
        })

        it('lists recent workspaces after a separator when present', async () => {
            mockRecentWorkspaceEntries.push({
                path: '/tmp/MyProject',
                name: 'MyProject',
                openedAt: Date.now(),
            })
            const { getByText, container } = render(Menu)
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
            const { getByText, queryByText } = render(Menu)
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
            const { getByText } = render(Menu)
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

describe('Menu Edit menu', () => {
    it('opens the Edit menu and shows Undo, Redo, Cut, Copy, Paste, Find, Replace, Find in Files, and Toggle Line Comment', async () => {
        const { getByText, container } = render(Menu)
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
        const { getByText } = render(Menu)
        await fireEvent.click(getByText('Edit'))
        await fireEvent.click(getByText(label))
        await waitFor(() =>
            expect(mockEmit).toHaveBeenCalledWith(event, undefined),
        )
    })

    it('closes the menu when an Edit item is clicked', async () => {
        ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
        const { getByText, queryByText } = render(Menu)
        await fireEvent.click(getByText('Edit'))
        await fireEvent.click(getByText('Undo'))
        expect(queryByText('Redo')).not.toBeInTheDocument()
    })
})

describe('Menu Help menu', () => {
    it('shows Welcome as the first item, followed by a separator', async () => {
        const { getByText, container } = render(Menu)
        await fireEvent.click(getByText('Help'))
        const items = container.querySelectorAll('.menu-dropdown > *')
        expect(items[0]).toHaveTextContent('Welcome')
        expect(items[1]).toHaveClass('menu-sep')
    })

    it('emits menu-show-welcome when Welcome is clicked', async () => {
        ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
        const { getByText } = render(Menu)
        await fireEvent.click(getByText('Help'))
        await fireEvent.click(getByText('Welcome'))
        await waitFor(() =>
            expect(mockEmit).toHaveBeenCalledWith('menu-show-welcome', undefined),
        )
    })
})
