import { EditorView } from '@codemirror/view'

// Read a CSS variable from the document root at call time
function v(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
}

// Called once per theme change — builds a fresh theme from current CSS vars
export function buildPascoalTheme() {
  const bg = v('--bg')
  const panel = v('--panel')
  const border = v('--border')
  const text = v('--text')
  const textDim = v('--text-dim')
  const accent = v('--accent')
  const accent2 = v('--accent2')
  const fontMono = v('--font-mono') || '"JetBrains Mono", monospace'

  const editorTheme = EditorView.theme(
    {
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
    },
    { dark: bg < '#888' },
  )

  // No syntaxHighlighting() here anymore. We spent this whole debugging
  // session proving, category by category (keyword, type, string, comment,
  // meta/pp directives...), that any color left in the legacy StreamLanguage
  // Pascal mode's HighlightStyle leaks through and wins over Tree-sitter's
  // cm-ts-*/cm-pascal-* marks - CodeMirror nests decorations from different
  // extensions rather than merging them onto one span, and for `color`
  // (an inherited property) the innermost span's own value always wins,
  // regardless of !important on its ancestors. Tree-sitter now correctly
  // covers every category the legacy layer used to color, so instead of
  // fighting the nesting order we just stopped feeding it colors at all.
  // StreamLanguage.define(pascal) itself stays wired in editor-extensions.ts
  // for indentOnInput/bracketMatching - only its visual highlighting is gone.
  //
  // Trade-off: `npm run dev:ide` (frontend-only preview, no Tauri backend)
  // never runs Tree-sitter, so Pascal files show no syntax highlighting at
  // all in that mode now. Accepted deliberately - cargo tauri dev is the
  // primary dev workflow.
  return [editorTheme]
}
