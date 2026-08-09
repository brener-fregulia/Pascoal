import type { EditorView } from '@codemirror/view'

// Cut/Copy/Paste helpers used by the Edit menu's `menu-cut`/`menu-copy`/
// `menu-paste` handlers in Editor.svelte. Kept as standalone functions
// (rather than inline in the Tauri event listener) so they're testable in
// isolation from Tauri/menu wiring.
//
// These intentionally duplicate what CodeMirror/the browser already do for
// native keyboard shortcuts (Ctrl+X/C/V) and contenteditable - there's no
// existing abstraction to reuse here, since the editor never needed
// programmatic clipboard access before the Edit menu required it.

export async function copySelection(view: EditorView): Promise<void> {
    const { from, to } = view.state.selection.main
    if (from === to) return
    await navigator.clipboard.writeText(view.state.sliceDoc(from, to))
}

export async function cutSelection(view: EditorView): Promise<void> {
    const { from, to } = view.state.selection.main
    if (from === to) return
    await navigator.clipboard.writeText(view.state.sliceDoc(from, to))
    view.dispatch({ changes: { from, to, insert: '' } })
}

export async function pasteFromClipboard(view: EditorView): Promise<void> {
    const text = await navigator.clipboard.readText()
    if (!text) return
    view.dispatch(view.state.replaceSelection(text))
}
