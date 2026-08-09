import { describe, it, expect } from 'vitest'
import { EditorView } from '@codemirror/view'
import { EditorState, EditorSelection } from '@codemirror/state'
import { toggleLineComment, toggleBlockComment } from '@codemirror/commands'
import { pascalExtensions } from '../../../src/editor/editor-extensions'

function makeView(doc: string, from: number, to = from): EditorView {
    return new EditorView({
        state: EditorState.create({
            doc,
            selection: EditorSelection.single(from, to),
            extensions: pascalExtensions(() => { }),
        }),
        parent: document.createElement('div'),
    })
}

// Regression coverage for the `(* *)` vs `//` bug: the legacy Pascal stream
// mode only declares a block-comment token in its own languageData, which
// made toggleComment/toggleLineComment fall back to `(* *)` block comments
// since no line token was defined. pascalExtensions() now extends the
// language data with a `//` line token via `pascalLanguage.data.of(...)`.
describe('pascalExtensions comment tokens', () => {
    it('toggles a // line comment, not a (* *) block comment', () => {
        const view = makeView('writeln(1);', 0)

        toggleLineComment(view)

        expect(view.state.doc.toString()).toBe('// writeln(1);')
    })

    it('uncomments an already-line-commented line back to the original text', () => {
        const view = makeView('// writeln(1);', 0)

        toggleLineComment(view)

        expect(view.state.doc.toString()).toBe('writeln(1);')
    })

    it('still supports (* *) block comments via toggleBlockComment', () => {
        const view = makeView('writeln(1);', 0, 11)

        toggleBlockComment(view)

        expect(view.state.doc.toString()).toBe('(* writeln(1); *)')
    })
})
