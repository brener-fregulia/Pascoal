import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { get } from 'svelte/store'
import {
    settingsStore,
    DEFAULT_FONT_SIZE,
    MAX_FONT_SIZE,
} from '../../../src/settings/settingsStore'
import { activeFocusStore } from '../../../src/shared/activeFocus'

const {
    mockTabState,
    mockGetActive,
    mockMarkClean,
    mockUpdateFilePath,
    mockUpdateEditorState,
    mockRunActiveFile,
    mockListen,
    listenHandlers,
    mockUndo,
    mockRedo,
    mockCopySelection,
    mockCutSelection,
    mockPasteFromClipboard,
} = vi.hoisted(() => ({
    mockTabState: {
        tabs: [] as Array<{
            id: string
            fileName: string
            filePath: string | null
            state: unknown
        }>,
        activeTabId: null as string | null,
    },
    mockGetActive: vi.fn(),
    mockMarkClean: vi.fn(),
    mockUpdateFilePath: vi.fn(),
    mockUpdateEditorState: vi.fn(),
    mockRunActiveFile: vi.fn(),
    mockListen: vi.fn(
        (event: string, handler: (...args: unknown[]) => unknown) => {
            listenHandlers[event] = handler
            return Promise.resolve(() => {
                delete listenHandlers[event]
            })
        },
    ),
    listenHandlers: {} as Record<string, (...args: unknown[]) => unknown>,
    mockUndo: vi.fn(),
    mockRedo: vi.fn(),
    mockCopySelection: vi.fn(),
    mockCutSelection: vi.fn(),
    mockPasteFromClipboard: vi.fn(),
}))

vi.mock('../../../src/editor/tabs', () => ({
    tabStore: {
        subscribe: (fn: (v: typeof mockTabState) => void) => {
            fn(mockTabState)
            return () => { }
        },
        getActive: mockGetActive,
        markClean: mockMarkClean,
        updateFilePath: mockUpdateFilePath,
        updateEditorState: mockUpdateEditorState,
    },
}))

vi.mock('../../../src/toolchain/runner', () => ({
    runActiveFile: mockRunActiveFile,
}))

vi.mock('@tauri-apps/api/event', () => ({
    listen: mockListen,
}))

vi.mock('@codemirror/commands', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@codemirror/commands')>()
    return {
        ...actual,
        undo: mockUndo,
        redo: mockRedo,
    }
})

vi.mock('../../../src/editor/editorClipboard', () => ({
    copySelection: mockCopySelection,
    cutSelection: mockCutSelection,
    pasteFromClipboard: mockPasteFromClipboard,
}))

import Editor from '../../../src/editor/Editor.svelte'

function makeTab(
    overrides: Partial<{
        id: string
        fileName: string
        filePath: string | null
        doc: string
    }> = {},
) {
    return {
        id: overrides.id ?? 'tab-1',
        fileName: overrides.fileName ?? 'main.pas',
        filePath: ('filePath' in overrides
            ? overrides.filePath
            : '/tmp/main.pas') as string | null,
        state: EditorState.create({ doc: overrides.doc ?? 'program Test;' }),
    }
}

afterEach(async () => {
    cleanup()
    mockTabState.tabs = []
    mockTabState.activeTabId = null
    settingsStore.updateSetting('fontSize', DEFAULT_FONT_SIZE)
    activeFocusStore.set(null)
    // Editor's onMount kicks off setupMenuListeners() without awaiting it
    // (fire-and-forget), and it resolves through several chained
    // `await listen(...)` calls (one per `menu-*` event). Every test in this
    // file mounts Editor with the real (mocked) `@tauri-apps/api/event`
    // module now, so without draining a full macrotask tick here, a chain
    // left in-flight by one test's unmount can keep calling the mocked
    // `listen()` in the middle of a *later* test, leaking extra calls into
    // its assertions. A real `setTimeout` tick guarantees the microtask
    // queue (and this chain) is fully drained before the next test starts.
    await new Promise((resolve) => setTimeout(resolve, 0))
    vi.clearAllMocks()
    for (const key of Object.keys(listenHandlers)) delete listenHandlers[key]
})

describe('Editor', () => {
    it('mounts a CodeMirror editor into the DOM', () => {
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        const { container } = render(Editor)
        expect(container.querySelector('.cm-editor')).toBeInTheDocument()
    })

    it('renders the run button', () => {
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        const { getByLabelText } = render(Editor)
        expect(getByLabelText('Run')).toBeInTheDocument()
    })

    it('calls runActiveFile when the run button is clicked', async () => {
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        const { getByLabelText } = render(Editor)
        await fireEvent.click(getByLabelText('Run'))
        expect(mockRunActiveFile).toHaveBeenCalled()
    })

    it('calls runActiveFile on F5', async () => {
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        render(Editor)
        await fireEvent.keyDown(document, { key: 'F5' })
        expect(mockRunActiveFile).toHaveBeenCalled()
    })

    it('saves via the tauri client on Ctrl+S when the file has a path', async () => {
        vi.stubGlobal('__TAURI__', {
            core: { invoke: vi.fn().mockResolvedValue(undefined) },
        })
        const tab = makeTab({ filePath: '/tmp/main.pas' })
        mockGetActive.mockReturnValue(tab)
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        render(Editor)
        await fireEvent.keyDown(document, { key: 's', ctrlKey: true })
        expect(mockMarkClean).toHaveBeenCalledWith(tab.id)
    })

    it('opens the find widget on Ctrl+F', async () => {
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        const { container } = render(Editor)
        await fireEvent.keyDown(document, { key: 'f', ctrlKey: true })
        expect(container.querySelector('.find-widget')).toBeInTheDocument()
    })

    describe('zoom', () => {
        it('increases the font size on Ctrl+Wheel up', async () => {
            const tab = makeTab()
            mockTabState.tabs = [tab]
            mockTabState.activeTabId = tab.id
            const { container } = render(Editor)
            const target = container.querySelector('#codemirror-editor')!
            await fireEvent.wheel(target, { ctrlKey: true, deltaY: -100 })
            expect(get(settingsStore).fontSize).toBe(DEFAULT_FONT_SIZE + 1)
        })

        it('decreases the font size on Ctrl+Wheel down', async () => {
            const tab = makeTab()
            mockTabState.tabs = [tab]
            mockTabState.activeTabId = tab.id
            const { container } = render(Editor)
            const target = container.querySelector('#codemirror-editor')!
            await fireEvent.wheel(target, { ctrlKey: true, deltaY: 100 })
            expect(get(settingsStore).fontSize).toBe(DEFAULT_FONT_SIZE - 1)
        })

        it('ignores wheel scrolling without Ctrl held', async () => {
            const tab = makeTab()
            mockTabState.tabs = [tab]
            mockTabState.activeTabId = tab.id
            const { container } = render(Editor)
            const target = container.querySelector('#codemirror-editor')!
            await fireEvent.wheel(target, { deltaY: -100 })
            expect(get(settingsStore).fontSize).toBe(DEFAULT_FONT_SIZE)
        })

        it('increases the font size on Ctrl+=', async () => {
            const tab = makeTab()
            mockTabState.tabs = [tab]
            mockTabState.activeTabId = tab.id
            render(Editor)
            await fireEvent.keyDown(document, {
                key: '=',
                code: 'Equal',
                ctrlKey: true,
            })
            expect(get(settingsStore).fontSize).toBe(DEFAULT_FONT_SIZE + 1)
        })

        it('increases the font size on the numpad add key', async () => {
            const tab = makeTab()
            mockTabState.tabs = [tab]
            mockTabState.activeTabId = tab.id
            render(Editor)
            await fireEvent.keyDown(document, {
                key: '+',
                code: 'NumpadAdd',
                ctrlKey: true,
            })
            expect(get(settingsStore).fontSize).toBe(DEFAULT_FONT_SIZE + 1)
        })

        it('decreases the font size on Ctrl+-', async () => {
            const tab = makeTab()
            mockTabState.tabs = [tab]
            mockTabState.activeTabId = tab.id
            render(Editor)
            await fireEvent.keyDown(document, {
                key: '-',
                code: 'Minus',
                ctrlKey: true,
            })
            expect(get(settingsStore).fontSize).toBe(DEFAULT_FONT_SIZE - 1)
        })

        it('resets to the default font size on Ctrl+0', async () => {
            settingsStore.updateSetting('fontSize', 20)
            const tab = makeTab()
            mockTabState.tabs = [tab]
            mockTabState.activeTabId = tab.id
            render(Editor)
            await fireEvent.keyDown(document, {
                key: '0',
                code: 'Digit0',
                ctrlKey: true,
            })
            expect(get(settingsStore).fontSize).toBe(DEFAULT_FONT_SIZE)
        })

        it('resets to the default font size on the numpad 0 key', async () => {
            settingsStore.updateSetting('fontSize', 20)
            const tab = makeTab()
            mockTabState.tabs = [tab]
            mockTabState.activeTabId = tab.id
            render(Editor)
            await fireEvent.keyDown(document, {
                key: '0',
                code: 'Numpad0',
                ctrlKey: true,
            })
            expect(get(settingsStore).fontSize).toBe(DEFAULT_FONT_SIZE)
        })

        it('clamps zoom in at the maximum font size', async () => {
            settingsStore.updateSetting('fontSize', MAX_FONT_SIZE)
            const tab = makeTab()
            mockTabState.tabs = [tab]
            mockTabState.activeTabId = tab.id
            render(Editor)
            await fireEvent.keyDown(document, {
                key: '=',
                code: 'Equal',
                ctrlKey: true,
            })
            expect(get(settingsStore).fontSize).toBe(MAX_FONT_SIZE)
        })

        it('clamps zoom out at the minimum font size', async () => {
            settingsStore.updateSetting('fontSize', 10)
            const tab = makeTab()
            mockTabState.tabs = [tab]
            mockTabState.activeTabId = tab.id
            render(Editor)
            await fireEvent.keyDown(document, {
                key: '-',
                code: 'Minus',
                ctrlKey: true,
            })
            expect(get(settingsStore).fontSize).toBe(10)
        })

        it('reflects the current font size in the editor container style', async () => {
            const tab = makeTab()
            mockTabState.tabs = [tab]
            mockTabState.activeTabId = tab.id
            const { container } = render(Editor)
            await fireEvent.keyDown(document, {
                key: '=',
                code: 'Equal',
                ctrlKey: true,
            })
            const target = container.querySelector(
                '#codemirror-editor',
            ) as HTMLElement
            expect(target.style.getPropertyValue('--editor-font-size')).toBe(
                `${DEFAULT_FONT_SIZE + 1}px`,
            )
        })
    })
})

describe('Editor Edit menu (undo/redo/cut/copy/paste)', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    // Editor's setupMenuListeners awaits `listen()` sequentially for all 5
    // events inside one async function. Waiting for only some of them to be
    // registered (e.g. just menu-undo) before a test ends lets the remaining
    // in-flight `await listen(...)` calls resolve *after* cleanup(), leaking
    // extra mockListen calls into whichever test runs next. Every test below
    // that renders with Tauri available waits for all 5 first to avoid that.
    async function waitForAllMenuListeners() {
        await vi.waitFor(() => {
            expect(listenHandlers['menu-undo']).toBeDefined()
            expect(listenHandlers['menu-redo']).toBeDefined()
            expect(listenHandlers['menu-cut']).toBeDefined()
            expect(listenHandlers['menu-copy']).toBeDefined()
            expect(listenHandlers['menu-paste']).toBeDefined()
        })
    }

    it('registers menu-undo/redo/cut/copy/paste listeners when Tauri is available', async () => {
        vi.stubGlobal('__TAURI__', { core: { invoke: vi.fn() } })
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        render(Editor)

        await waitForAllMenuListeners()
    })

    it('does not register any menu listeners when Tauri is unavailable', async () => {
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        render(Editor)

        // Give any stray async registration a chance to run before asserting.
        await Promise.resolve()
        await Promise.resolve()

        expect(mockListen).not.toHaveBeenCalled()
        expect(listenHandlers['menu-undo']).toBeUndefined()
        expect(listenHandlers['menu-cut']).toBeUndefined()
    })

    it('calls undo with the EditorView instance on menu-undo', async () => {
        vi.stubGlobal('__TAURI__', { core: { invoke: vi.fn() } })
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        render(Editor)
        await waitForAllMenuListeners()

        await listenHandlers['menu-undo']()

        expect(mockUndo).toHaveBeenCalledTimes(1)
        expect(mockUndo.mock.calls[0][0]).toBeInstanceOf(EditorView)
    })

    it('calls redo with the EditorView instance on menu-redo', async () => {
        vi.stubGlobal('__TAURI__', { core: { invoke: vi.fn() } })
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        render(Editor)
        await waitForAllMenuListeners()

        await listenHandlers['menu-redo']()

        expect(mockRedo).toHaveBeenCalledTimes(1)
        expect(mockRedo.mock.calls[0][0]).toBeInstanceOf(EditorView)
    })

    it('calls cutSelection/copySelection/pasteFromClipboard when focus is on the editor', async () => {
        vi.stubGlobal('__TAURI__', { core: { invoke: vi.fn() } })
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        render(Editor)
        await waitForAllMenuListeners()
        activeFocusStore.set('editor')

        await listenHandlers['menu-cut']()
        await listenHandlers['menu-copy']()
        await listenHandlers['menu-paste']()

        expect(mockCutSelection.mock.calls[0][0]).toBeInstanceOf(EditorView)
        expect(mockCopySelection.mock.calls[0][0]).toBeInstanceOf(EditorView)
        expect(mockPasteFromClipboard.mock.calls[0][0]).toBeInstanceOf(EditorView)
    })

    it('calls cutSelection/copySelection/pasteFromClipboard when no panel has focus yet', async () => {
        vi.stubGlobal('__TAURI__', { core: { invoke: vi.fn() } })
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        render(Editor)
        await waitForAllMenuListeners()

        await listenHandlers['menu-cut']()

        expect(mockCutSelection).toHaveBeenCalledTimes(1)
    })

    it('does not call cutSelection/copySelection/pasteFromClipboard when the explorer owns focus', async () => {
        vi.stubGlobal('__TAURI__', { core: { invoke: vi.fn() } })
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        render(Editor)
        await waitForAllMenuListeners()
        activeFocusStore.set('explorer')

        await listenHandlers['menu-cut']()
        await listenHandlers['menu-copy']()
        await listenHandlers['menu-paste']()

        expect(mockCutSelection).not.toHaveBeenCalled()
        expect(mockCopySelection).not.toHaveBeenCalled()
        expect(mockPasteFromClipboard).not.toHaveBeenCalled()
    })

    it('sets the active focus to "editor" when the codemirror container receives focus', async () => {
        const tab = makeTab()
        mockTabState.tabs = [tab]
        mockTabState.activeTabId = tab.id
        const { container } = render(Editor)
        const target = container.querySelector('#codemirror-editor') as HTMLElement

        await fireEvent.focusIn(target)

        expect(get(activeFocusStore)).toBe('editor')
    })
})