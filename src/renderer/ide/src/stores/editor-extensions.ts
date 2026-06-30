import { keymap, highlightActiveLine, lineNumbers, highlightActiveLineGutter, EditorView } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, historyKeymap, history, indentWithTab } from '@codemirror/commands'
import { StreamLanguage, indentOnInput, bracketMatching } from '@codemirror/language'
import { search, searchKeymap } from '@codemirror/search'
import { pascal } from '@codemirror/legacy-modes/mode/pascal'
import { buildPascoalTheme, pascalDecoratorPlugins } from './editor-theme'

// Shared compartment - allows swapping theme without destroying editor state
export const themeCompartment = new Compartment()

export function pascalExtensions(onDocChange: () => void) {
  return [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    history(),
    indentOnInput(),
    bracketMatching(),
    search({ top: true }),
    StreamLanguage.define(pascal),
    EditorState.tabSize.of(2),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      indentWithTab,
    ]),
    ...pascalDecoratorPlugins,
    themeCompartment.of(buildPascoalTheme()),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onDocChange()
      }
    }),
  ]
}