import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import { EditorState } from '@codemirror/state'

const {
    mockTabState,
    mockGetActive,
    mockMarkClean,
    mockUpdateFilePath,
    mockUpdateEditorState,
    mockRunActiveFile,
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

afterEach(() => {
    cleanup()
    mockTabState.tabs = []
    mockTabState.activeTabId = null
    vi.clearAllMocks()
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
})