import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import { tick } from 'svelte'
import { get } from 'svelte/store'
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
import { rightPanelStore } from '../../../src/app/rightPanel'

const initialWindowWidth = window.innerWidth

afterEach(() => {
    cleanup()
    window.innerWidth = initialWindowWidth
    localStorage.clear()
    mockTabState.tabs = []
    mockTabState.activeTabId = null
    mockTabState.activeView = 'welcome'
    mockTabState.welcomeClosed = false
    mockConsoleState.visible = false
    mockConsoleState.position = 'bottom'
    mockExplorerState.folder = null
    mockExplorerState.tree = []
    rightPanelStore.reset()
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

describe('EditorArea side panel width', () => {
    // 1048 px window - 48 px ActivityBar = 1000 px group, so 1% = 10 px.
    const GROUP_1000 = 1048

    async function settle() {
        for (let i = 0; i < 3; i++) {
            await tick()
            await new Promise((resolve) => setTimeout(resolve, 0))
        }
    }

    async function resizeWindow(width: number) {
        window.innerWidth = width
        window.dispatchEvent(new Event('resize'))
        await settle()
    }

    async function renderWithSidePanel(activePanel: string | null = 'explorer') {
        const result = render(EditorArea, { props: { activePanel } })
        await settle()
        return result
    }

    function resizer(container: HTMLElement) {
        return container.querySelector('[data-pane-resizer]') as HTMLElement
    }

    function sidebarPct(container: HTMLElement) {
        return Number(resizer(container).getAttribute('aria-valuenow'))
    }

    async function pressResizeKey(container: HTMLElement, key: string) {
        await fireEvent.keyDown(resizer(container), { key })
        await fireEvent.keyUp(resizer(container), { key })
        await settle()
    }

    it('opens at the default 220 px width on first use', async () => {
        window.innerWidth = GROUP_1000
        const { container } = await renderWithSidePanel()
        expect(sidebarPct(container)).toBe(22)
    })

    it('restores the saved width on startup', async () => {
        localStorage.setItem('pascoal-side-panel-width', '300')
        window.innerWidth = GROUP_1000
        const { container } = await renderWithSidePanel()
        expect(sidebarPct(container)).toBe(30)
    })

    it('saves the width chosen with the keyboard in pixels', async () => {
        window.innerWidth = GROUP_1000
        const { container } = await renderWithSidePanel()
        await pressResizeKey(container, 'ArrowRight')
        expect(sidebarPct(container)).toBe(32)
        expect(localStorage.getItem('pascoal-side-panel-width')).toBe('320')
    })

    it('keeps the chosen pixel width when the window is resized', async () => {
        window.innerWidth = GROUP_1000
        const { container } = await renderWithSidePanel()
        await pressResizeKey(container, 'ArrowRight')

        // 1548 px window -> 1500 px group; 320 px = 21.33%
        await resizeWindow(1548)
        expect(sidebarPct(container)).toBe(21)
        expect(localStorage.getItem('pascoal-side-panel-width')).toBe('320')
    })

    it('clamps to the editor reserve in narrow windows without losing the preference', async () => {
        localStorage.setItem('pascoal-side-panel-width', '600')
        window.innerWidth = GROUP_1000
        const { container } = await renderWithSidePanel()
        // 1000 px - 480 px editor reserve = 520 px max
        expect(sidebarPct(container)).toBe(52)

        // 2048 px window -> 2000 px group; 600 px = 30%
        await resizeWindow(2048)
        expect(sidebarPct(container)).toBe(30)
        expect(localStorage.getItem('pascoal-side-panel-width')).toBe('600')
    })

    it('reopens a collapsed panel at the preferred width', async () => {
        localStorage.setItem('pascoal-side-panel-width', '300')
        window.innerWidth = GROUP_1000
        const { container, rerender } = await renderWithSidePanel()
        await pressResizeKey(container, 'Home')
        expect(sidebarPct(container)).toBe(0)

        await rerender({ activePanel: null })
        await settle()
        await rerender({ activePanel: 'search' })
        await settle()
        expect(sidebarPct(container)).toBe(30)
        expect(localStorage.getItem('pascoal-side-panel-width')).toBe('300')
    })

    it('does not use the window-size dependent PaneForge autosave', async () => {
        window.innerWidth = GROUP_1000
        const { container } = await renderWithSidePanel()
        await pressResizeKey(container, 'ArrowRight')
        await new Promise((resolve) => setTimeout(resolve, 150))
        expect(localStorage.getItem('paneforge:pascoal-side-panel')).toBeNull()
    })
})

describe('EditorArea right panel', () => {
    // 1248 px window - 48 px ActivityBar = 1200 px group.
    const WIDE = 1248

    async function settle() {
        for (let i = 0; i < 3; i++) {
            await tick()
            await new Promise((resolve) => setTimeout(resolve, 0))
        }
    }

    async function renderArea(activePanel: string | null = null) {
        const result = render(EditorArea, { props: { activePanel } })
        await settle()
        return result
    }

    async function setOpen(open: boolean) {
        if (get(rightPanelStore).open !== open) rightPanelStore.toggle()
        await settle()
    }

    it('is hidden by default', async () => {
        window.innerWidth = WIDE
        const { container } = await renderArea()
        expect(container.querySelector('#right-panel')).toBeNull()
    })

    it('shows the empty state when opened and hides when closed', async () => {
        window.innerWidth = WIDE
        const { container, getByText } = await renderArea()
        await setOpen(true)
        expect(container.querySelector('#right-panel')).toBeInTheDocument()
        expect(getByText(/Nothing to show yet/)).toBeInTheDocument()
        await setOpen(false)
        expect(container.querySelector('#right-panel')).toBeNull()
    })

    it('keeps the editor mounted and beside the panel', async () => {
        window.innerWidth = WIDE
        const { container } = await renderArea()
        const main = container.querySelector('#main-content')
        await setOpen(true)
        expect(container.querySelector('#main-content')).toBe(main)
        const panes = [...container.querySelectorAll('[data-pane]')]
        expect(panes.at(-1)).toContainElement(
            container.querySelector('#right-panel') as HTMLElement,
        )
        expect(panes.at(-2)).toContainElement(main as HTMLElement)
    })

    it('works together with the left sidebar', async () => {
        window.innerWidth = WIDE
        const { container } = await renderArea('explorer')
        await setOpen(true)
        expect(container.querySelector('#side-panel')).toBeInTheDocument()
        expect(container.querySelector('#right-panel')).toBeInTheDocument()
        expect(container.querySelector('#main-content')).toBeInTheDocument()
        expect(container.querySelectorAll('[data-pane-resizer]')).toHaveLength(2)
    })

    it('does not touch the saved left width', async () => {
        localStorage.setItem('pascoal-side-panel-width', '300')
        window.innerWidth = WIDE
        await renderArea('explorer')
        await setOpen(true)
        expect(localStorage.getItem('pascoal-side-panel-width')).toBe('300')
    })

    it('does not appear over the editor when there is no room, and returns later', async () => {
        // 760 px window -> 712 px group: sidebar (220) + panel (200) + editor (480) do not fit.
        window.innerWidth = 760
        const { container } = await renderArea('explorer')
        await setOpen(true)
        expect(container.querySelector('#right-panel')).toBeNull()
        expect(container.querySelector('#side-panel')).toBeInTheDocument()

        window.dispatchEvent(new Event('resize'))
        window.innerWidth = WIDE
        window.dispatchEvent(new Event('resize'))
        await settle()
        expect(container.querySelector('#right-panel')).toBeInTheDocument()
    })

    it('fits at the minimum window width when the left sidebar is closed', async () => {
        window.innerWidth = 760
        const { container } = await renderArea(null)
        await setOpen(true)
        expect(container.querySelector('#right-panel')).toBeInTheDocument()
    })

    it('reports availability to the shell', async () => {
        window.innerWidth = 760
        await renderArea('explorer')
        expect(get(rightPanelStore).available).toBe(false)
    })
})

describe('EditorArea right panel persistence', () => {
    // 1248 px window - 48 px ActivityBar = 1200 px group, so 1% = 12 px.
    const WIDE = 1248

    async function settle() {
        for (let i = 0; i < 3; i++) {
            await tick()
            await new Promise((resolve) => setTimeout(resolve, 0))
        }
    }

    async function renderArea(activePanel: string | null = null) {
        const result = render(EditorArea, { props: { activePanel } })
        await settle()
        return result
    }

    async function open() {
        rightPanelStore.toggle()
        await settle()
    }

    function rightPct(container: HTMLElement) {
        const panes = container.querySelectorAll<HTMLElement>('[data-pane]')
        return Number(panes[panes.length - 1].style.flexGrow)
    }

    async function pressKey(container: HTMLElement, key: string) {
        const handles = container.querySelectorAll('[data-pane-resizer]')
        const handle = handles[handles.length - 1] as HTMLElement
        await fireEvent.keyDown(handle, { key })
        await fireEvent.keyUp(handle, { key })
        await settle()
    }

    it('opens at 260 px by default without saving anything', async () => {
        window.innerWidth = WIDE
        const { container } = await renderArea()
        await open()
        expect(rightPct(container)).toBeCloseTo((260 / 1200) * 100, 0)
        expect(localStorage.getItem('pascoal-right-panel-width')).toBeNull()
    })

    it('restores the saved width', async () => {
        localStorage.setItem('pascoal-right-panel-width', '360')
        window.innerWidth = WIDE
        const { container } = await renderArea()
        await open()
        expect(rightPct(container)).toBeCloseTo(30, 0)
    })

    it('ignores an invalid saved width', async () => {
        localStorage.setItem('pascoal-right-panel-width', '-5')
        window.innerWidth = WIDE
        const { container } = await renderArea()
        await open()
        expect(rightPct(container)).toBeCloseTo((260 / 1200) * 100, 0)
    })

    it('saves a keyboard resize in pixels and keeps it after hiding and reopening', async () => {
        window.innerWidth = WIDE
        const { container } = await renderArea()
        await open()
        await pressKey(container, 'ArrowLeft')
        const saved = localStorage.getItem('pascoal-right-panel-width')
        expect(Number(saved)).toBeGreaterThan(260)

        await open()
        await open()
        expect(Number(localStorage.getItem('pascoal-right-panel-width'))).toBe(Number(saved))
        expect(rightPct(container)).toBeCloseTo((Number(saved) / 1200) * 100, 0)
    })

    it('keeps the preferred width when the window shrinks and recovers it', async () => {
        localStorage.setItem('pascoal-right-panel-width', '400')
        window.innerWidth = WIDE
        const { container } = await renderArea()
        await open()

        // 760 px window, sidebar closed -> 712 px group; 712 - 480 = 232 px max.
        window.innerWidth = 760
        window.dispatchEvent(new Event('resize'))
        await settle()
        expect(rightPct(container)).toBeLessThan((400 / 712) * 100)
        expect(localStorage.getItem('pascoal-right-panel-width')).toBe('400')

        window.innerWidth = WIDE
        window.dispatchEvent(new Event('resize'))
        await settle()
        expect(rightPct(container)).toBeCloseTo((400 / 1200) * 100, 0)
        expect(localStorage.getItem('pascoal-right-panel-width')).toBe('400')
    })

    it('keeps the open preference while there is no room and shows the panel again later', async () => {
        window.innerWidth = WIDE
        const { container } = await renderArea('explorer')
        await open()
        window.innerWidth = 760
        window.dispatchEvent(new Event('resize'))
        await settle()
        expect(container.querySelector('#right-panel')).toBeNull()
        expect(localStorage.getItem('pascoal-right-panel-open')).toBe('true')

        window.innerWidth = WIDE
        window.dispatchEvent(new Event('resize'))
        await settle()
        expect(container.querySelector('#right-panel')).toBeInTheDocument()
    })

    it('does not write the sidebar width when resizing the right panel', async () => {
        window.innerWidth = WIDE
        const { container } = await renderArea('explorer')
        await open()
        await pressKey(container, 'ArrowLeft')
        expect(localStorage.getItem('pascoal-side-panel-width')).toBeNull()
    })

    it('keeps existing tabs and the editor mounted when toggling', async () => {
        mockTabState.tabs = [
            { id: 'tab-1', state: EditorState.create({ doc: 'program Test;' }) },
        ]
        mockTabState.activeTabId = 'tab-1'
        mockTabState.activeView = 'editor'
        window.innerWidth = WIDE
        const { container } = await renderArea()
        const wrapper = container.querySelector('#editor-wrapper')
        await open()
        expect(container.querySelector('#editor-wrapper')).toBe(wrapper)
        expect(wrapper).toHaveClass('visible')
        expect(mockTabState.tabs).toHaveLength(1)
    })
})
