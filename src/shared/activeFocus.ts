import { writable } from 'svelte/store'

// Tracks which panel last received keyboard focus among the areas that
// Cut/Copy/Paste in the Edit menu can target - the editor and the file
// explorer's tree. Editor.svelte and FileTree.svelte each set this on
// `focusin`; the Edit menu handlers read it to decide where to route the
// clipboard action, since both areas implement their own cut/copy/paste.
export type ActiveFocus = 'editor' | 'explorer' | null

export const activeFocusStore = writable<ActiveFocus>(null)
