import { EditorView, Decoration, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

// Read a CSS variable from the document root at call time
function v(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// Pascal built-in types — String excluded (tokenizer handles it as t.string)
const PASCAL_TYPES = new Set([
    'integer', 'real', 'boolean', 'char', 'byte', 'word',
    'longint', 'longword', 'int64', 'qword', 'cardinal', 'single',
    'double', 'extended', 'pointer', 'file', 'shortint',
    'smallint', 'nativeint', 'nativeuint',
])

// Pascal built-in procedures and functions
const PASCAL_BUILTINS = new Set([
    'writeln', 'write', 'readln', 'read', 'readkey',
    'length', 'copy', 'delete', 'insert', 'pos', 'concat',
    'upcase', 'lowercase', 'trim', 'str', 'val',
    'inc', 'dec', 'succ', 'pred',
    'abs', 'sqr', 'sqrt', 'round', 'trunc', 'int', 'frac',
    'sin', 'cos', 'arctan', 'exp', 'ln',
    'odd', 'chr', 'ord',
    'high', 'low', 'sizeof', 'typeof',
    'new', 'dispose', 'assigned',
    'halt', 'exit', 'break', 'continue',
    'random', 'randomize',
    'inttostr', 'strtoint', 'strtointdef', 'floattostr', 'strtofloat',
    'result',
])

const WORD_RE = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g

const typeMark = Decoration.mark({ class: 'cm-pascal-type' })
const builtinMark = Decoration.mark({ class: 'cm-pascal-builtin' })

function buildDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()

    for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        WORD_RE.lastIndex = 0
        let match: RegExpExecArray | null

        while ((match = WORD_RE.exec(text)) !== null) {
            const word = match[0].toLowerCase()
            const start = from + match.index
            const end = start + match[0].length

            if (PASCAL_TYPES.has(word)) {
                builder.add(start, end, typeMark)
            } else if (PASCAL_BUILTINS.has(word)) {
                builder.add(start, end, builtinMark)
            }
        }
    }

    return builder.finish()
}

export const pascalDecoratorPlugins = [
    ViewPlugin.fromClass(
        class {
            decorations
            constructor(view: EditorView) {
                this.decorations = buildDecorations(view)
            }
            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = buildDecorations(update.view)
                }
            }
        },
        { decorations: (v: any) => v.decorations }
    ),
]

// Called once per theme change — builds a fresh theme from current CSS vars
export function buildPascoalTheme() {
    const bg = v('--bg')
    const panel = v('--panel')
    const border = v('--border')
    const text = v('--text')
    const textDim = v('--text-dim')
    const accent = v('--accent')
    const accent2 = v('--accent2')
    const success = v('--success')
    const error = v('--error')
    const fontMono = v('--font-mono') || '"JetBrains Mono", monospace'

    const NUMBER_COLOR = '#E5A84A'
    const BUILTIN_COLOR = '#61AFEF'

    const editorTheme = EditorView.theme({
        '&': {
            background: bg,
            color: text,
            fontFamily: fontMono,
            fontSize: '13px',
            height: '100%',
        },
        '.cm-scroller': {
            fontFamily: fontMono,
            overflow: 'auto',
        },
        '.cm-content': {
            caretColor: accent,
            padding: '16px 0',
        },
        '.cm-cursor': {
            borderLeftColor: accent,
        },
        '.cm-activeLine': {
            backgroundColor: `${panel}99`,
        },
        '.cm-activeLineGutter': {
            backgroundColor: `${panel}99`,
        },
        '.cm-gutters': {
            backgroundColor: bg,
            color: textDim,
            border: 'none',
            borderRight: `1px solid ${border}`,
        },
        '.cm-lineNumbers .cm-gutterElement': {
            padding: '0 12px 0 8px',
            minWidth: '3ch',
        },
        '.cm-selectionBackground, ::selection': {
            backgroundColor: `${accent2}33`,
        },
        '&.cm-focused .cm-selectionBackground': {
            backgroundColor: `${accent2}44`,
        },
        '.cm-matchingBracket': {
            backgroundColor: `${accent2}33`,
            outline: `1px solid ${accent2}`,
        },
        '.cm-foldPlaceholder': {
            backgroundColor: panel,
            border: `1px solid ${border}`,
            color: textDim,
        },
        '.cm-tooltip': {
            backgroundColor: panel,
            border: `1px solid ${border}`,
            color: text,
        },
        '.cm-panels': {
            backgroundColor: panel,
            color: text,
        },
        '.cm-searchMatch': {
            backgroundColor: `${accent}33`,
            outline: `1px solid ${accent}66`,
        },
        '.cm-searchMatch.cm-searchMatch-selected': {
            backgroundColor: `${accent}55`,
        },
    }, { dark: bg < '#888' })

    const highlightStyle = HighlightStyle.define([
        { tag: t.keyword, color: accent, fontWeight: '500' },
        { tag: t.string, color: success },
        { tag: t.character, color: success },
        { tag: t.number, color: NUMBER_COLOR },
        { tag: t.integer, color: NUMBER_COLOR },
        { tag: t.float, color: NUMBER_COLOR },
        { tag: t.comment, color: textDim, fontStyle: 'italic' },
        { tag: t.lineComment, color: textDim, fontStyle: 'italic' },
        { tag: t.blockComment, color: textDim, fontStyle: 'italic' },
        { tag: t.operator, color: text },
        { tag: t.compareOperator, color: text },
        { tag: t.arithmeticOperator, color: text },
        { tag: t.function(t.variableName), color: BUILTIN_COLOR },
        { tag: t.definition(t.variableName), color: text },
        { tag: t.variableName, color: text },
        { tag: t.propertyName, color: text },
        { tag: t.name, color: text },
        { tag: t.constant(t.name), color: NUMBER_COLOR },
        { tag: t.punctuation, color: textDim },
        { tag: t.bracket, color: textDim },
        { tag: t.meta, color: textDim, fontStyle: 'italic' },
        { tag: t.invalid, color: error, textDecoration: 'underline' },
    ])

    return [editorTheme, syntaxHighlighting(highlightStyle)]
}