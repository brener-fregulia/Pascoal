import { keymap, highlightActiveLine, lineNumbers, highlightActiveLineGutter, EditorView } from '@codemirror/view'
import { EditorState, Compartment, type Extension } from '@codemirror/state'
import { defaultKeymap, historyKeymap, history, indentWithTab } from '@codemirror/commands'
import { StreamLanguage, indentOnInput, bracketMatching } from '@codemirror/language'
import { search } from '@codemirror/search'
import { pascal } from '@codemirror/legacy-modes/mode/pascal'
import { buildPascoalTheme } from './editor-theme'
import { matchHighlightField } from './search-highlight'

// Shared compartment - allows swapping theme without destroying editor state
export const themeCompartment = new Compartment()

export function pascalExtensions(onDocChange: () => void, highlightExtensions: Extension[] = []) {
  return [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    history(),
    indentOnInput(),
    bracketMatching(),
    // search() gives us findNext/findPrevious/replaceNext/replaceAll and
    // the query state field that FindWidget.svelte drives directly.
    // Actual match highlighting is done by our own matchHighlightField
    // below, since it needs to work reliably without the default panel.
    search(),
    matchHighlightField,
    StreamLanguage.define(pascal),
    EditorState.tabSize.of(2),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      indentWithTab,
    ]),
    ...highlightExtensions,
    themeCompartment.of(buildPascoalTheme()),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onDocChange()
      }
    }),
  ]
}

// A leaner extension set for read-only diff panes (DiffView.svelte) -
// syntax highlighting and line numbers, no editing keymaps, history,
// or search, since there's nothing to edit or search there.
export function pascalDiffExtensions(highlightExtensions: Extension[] = []) {
  return [
    lineNumbers(),
    StreamLanguage.define(pascal),
    ...highlightExtensions,
    themeCompartment.of(buildPascoalTheme()),
    EditorView.editable.of(false),
    EditorState.readOnly.of(true),
  ]
}