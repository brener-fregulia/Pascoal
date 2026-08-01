import {
    EditorView,
    ViewPlugin,
    ViewUpdate,
    Decoration,
    type DecorationSet,
} from '@codemirror/view'
import { StateEffect, StateField, RangeSetBuilder } from '@codemirror/state'
import { isTauriAvailable, invoke } from '../../integrations/tauri/client'

interface HighlightSpan {
    start: number
    end: number
    kind: string
}

const DEBOUNCE_MS = 150

// Maps tree-sitter capture names (from pascal-highlights.scm) to CSS classes.
// 'identifier' is intentionally omitted — it's the generic fallback capture
// for plain variable usage, and falls back to the default text color.
const KIND_CLASS: Record<string, string> = {
    keyword: 'cm-ts-keyword',
    string: 'cm-ts-string',
    number: 'cm-ts-number',
    comment: 'cm-ts-comment',
    operator: 'cm-ts-operator',
    'punctuation.bracket': 'cm-ts-punctuation',
    'punctuation.delimiter': 'cm-ts-punctuation',
    constant: 'cm-ts-constant',
    type: 'cm-ts-type',
    'type.parameter': 'cm-ts-type',
    function: 'cm-ts-function',
    variable: 'cm-ts-variable',
    'variable.parameter': 'cm-ts-variable',
}

const markCache: Record<string, Decoration> = {}
function markFor(kind: string): Decoration | null {
    const cls = KIND_CLASS[kind]
    if (!cls) return null
    if (!markCache[kind]) markCache[kind] = Decoration.mark({ class: cls })
    return markCache[kind]
}

export function buildDecorations(docLength: number, spans: HighlightSpan[]): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>()
    const sorted = [...spans].sort((a, b) => a.start - b.start)

    for (const span of sorted) {
        if (span.end <= span.start || span.end > docLength) continue
        const mark = markFor(span.kind)
        if (mark) builder.add(span.start, span.end, mark)
    }

    return builder.finish()
}

const setPascalHighlights = StateEffect.define<DecorationSet>()

const pascalHighlightField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none
    },
    update(deco, tr) {
        deco = deco.map(tr.changes)
        for (const effect of tr.effects) {
            if (effect.is(setPascalHighlights)) deco = effect.value
        }
        return deco
    },
    provide: (field) => EditorView.decorations.from(field),
})

async function requestHighlight(view: EditorView) {
    if (!isTauriAvailable()) return
    const source = view.state.doc.toString()

    try {
        const spans = await invoke<HighlightSpan[]>('highlight_pascal', { source })

        // Bail out if the document already moved on while we were waiting
        if (view.state.doc.toString() !== source) return

        const decorations = buildDecorations(source.length, spans)
        view.dispatch({ effects: setPascalHighlights.of(decorations) })
    } catch (e) {
        console.error('highlight_pascal failed:', e)
    }
}

const debouncedHighlightPlugin = ViewPlugin.fromClass(
    class {
        timer: ReturnType<typeof setTimeout> | null = null

        constructor(view: EditorView) {
            requestHighlight(view)
        }

        update(update: ViewUpdate) {
            if (!update.docChanged) return
            if (this.timer) clearTimeout(this.timer)
            this.timer = setTimeout(() => requestHighlight(update.view), DEBOUNCE_MS)
        }

        destroy() {
            if (this.timer) clearTimeout(this.timer)
        }
    },
)

export const pascalTreeSitterHighlight = [pascalHighlightField, debouncedHighlightPlugin]