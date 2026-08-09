import { describe, it, expect, afterEach, vi } from 'vitest'
import { EditorView } from '@codemirror/view'
import { EditorState, EditorSelection } from '@codemirror/state'
import {
    copySelection,
    cutSelection,
    pasteFromClipboard,
} from '../../../src/editor/editorClipboard'

function makeView(doc: string, from: number, to = from): EditorView {
    return new EditorView({
        state: EditorState.create({
            doc,
            selection: EditorSelection.single(from, to),
        }),
        parent: document.createElement('div'),
    })
}

afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
    })
})

describe('copySelection', () => {
    it('writes the selected text to the clipboard when there is a non-empty selection', async () => {
        const writeText = vi.fn()
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        })
        const view = makeView('program Test;', 0, 7)

        await copySelection(view)

        expect(writeText).toHaveBeenCalledWith('program')
    })

    it('does not write to the clipboard when there is no selection', async () => {
        const writeText = vi.fn()
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        })
        const view = makeView('program Test;', 3)

        await copySelection(view)

        expect(writeText).not.toHaveBeenCalled()
    })
})

describe('cutSelection', () => {
    it('writes the selected text to the clipboard and removes it from the document', async () => {
        const writeText = vi.fn()
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        })
        const view = makeView('program Test;', 0, 8)

        await cutSelection(view)

        expect(writeText).toHaveBeenCalledWith('program ')
        expect(view.state.doc.toString()).toBe('Test;')
    })

    it('does not write to the clipboard or change the document when there is no selection', async () => {
        const writeText = vi.fn()
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        })
        const view = makeView('program Test;', 3)

        await cutSelection(view)

        expect(writeText).not.toHaveBeenCalled()
        expect(view.state.doc.toString()).toBe('program Test;')
    })
})

describe('pasteFromClipboard', () => {
    it('inserts the clipboard text at the current cursor position', async () => {
        const readText = vi.fn().mockResolvedValue('Hello')
        Object.defineProperty(navigator, 'clipboard', {
            value: { readText },
            configurable: true,
        })
        const view = makeView('program Test;', 0)

        await pasteFromClipboard(view)

        expect(view.state.doc.toString()).toBe('Helloprogram Test;')
    })

    it('replaces the current selection with the clipboard text', async () => {
        const readText = vi.fn().mockResolvedValue('unit')
        Object.defineProperty(navigator, 'clipboard', {
            value: { readText },
            configurable: true,
        })
        const view = makeView('program Test;', 0, 7)

        await pasteFromClipboard(view)

        expect(view.state.doc.toString()).toBe('unit Test;')
    })

    it('does not change the document when the clipboard returns an empty string', async () => {
        const readText = vi.fn().mockResolvedValue('')
        Object.defineProperty(navigator, 'clipboard', {
            value: { readText },
            configurable: true,
        })
        const view = makeView('program Test;', 0)

        await pasteFromClipboard(view)

        expect(view.state.doc.toString()).toBe('program Test;')
    })
})
