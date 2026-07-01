import { StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView } from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'

// Effect used to push a freshly computed set of match decorations
// into the editor. FindWidget.svelte builds this set whenever the
// query, options, or current match index change.
export const setMatchDecorations = StateEffect.define<DecorationSet>()

export const matchHighlightField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none
    },
    update(deco, tr) {
        deco = deco.map(tr.changes)
        for (const e of tr.effects) {
            if (e.is(setMatchDecorations)) {
                return e.value
            }
        }
        return deco
    },
    provide: (f) => EditorView.decorations.of((view) => view.state.field(f)),
})

// Reused across all ranges — CodeMirror decorations are meant to be
// shared singleton objects applied at many positions.
export const matchMark = Decoration.mark({ class: 'cm-pascal-match' })
export const selectedMatchMark = Decoration.mark({ class: 'cm-pascal-match-selected' })