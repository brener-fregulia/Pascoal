import { keymap, highlightActiveLine, lineNumbers, highlightActiveLineGutter } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, historyKeymap, history, indentWithTab } from '@codemirror/commands'
import { StreamLanguage, indentOnInput, bracketMatching } from '@codemirror/language'
import { pascal } from '@codemirror/legacy-modes/mode/pascal'
import { buildPascoalTheme, pascalDecoratorPlugins } from './editor-theme'

// Shared compartment — allows swapping theme without destroying editor state
export const themeCompartment = new Compartment()

export function pascalExtensions(onDocChange: () => void) {
  return [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    history(),
    indentOnInput(),
    bracketMatching(),
    StreamLanguage.define(pascal),
    EditorState.tabSize.of(2),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      indentWithTab,
    ]),
    ...pascalDecoratorPlugins,
    themeCompartment.of(buildPascoalTheme()),
    EditorState.changeFilter.of(() => {
      onDocChange()
      return true
    }),
  ]
}