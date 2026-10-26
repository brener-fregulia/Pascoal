import { writable } from 'svelte/store'

// Shell-owned state of the optional right panel. `open` is the user's
// explicit choice and is the only part remembered across sessions;
// `available` is set by the layout and says whether the window currently has
// room for the panel without squeezing the editor, so it is never persisted.
const OPEN_KEY = 'pascoal-right-panel-open'
const WIDTH_KEY = 'pascoal-right-panel-width'

function loadOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) === 'true'
  } catch {
    return false
  }
}

function saveOpen(open: boolean) {
  try {
    localStorage.setItem(OPEN_KEY, String(open))
  } catch {
    /* ignore */
  }
}

// Like the sidebar, the preferred width is remembered in pixels because
// PaneForge only works in percentages of the current window.
export function loadRightPanelWidth(fallback: number): number {
  try {
    const width = Math.round(Number(localStorage.getItem(WIDTH_KEY)))
    return Number.isFinite(width) && width > 0 ? width : fallback
  } catch {
    return fallback
  }
}

export function saveRightPanelWidth(width: number) {
  const rounded = Math.round(width)
  if (!Number.isFinite(rounded) || rounded <= 0) return

  try {
    localStorage.setItem(WIDTH_KEY, String(rounded))
  } catch {
    /* ignore */
  }
}

interface RightPanelState {
  open: boolean
  available: boolean
}

function createRightPanelStore() {
  const { subscribe, update, set } = writable<RightPanelState>({
    open: loadOpen(),
    available: true,
  })

  return {
    subscribe,
    toggle: () =>
      update((s) => {
        saveOpen(!s.open)
        return { ...s, open: !s.open }
      }),
    setAvailable: (available: boolean) =>
      update((s) => (s.available === available ? s : { ...s, available })),
    reset: () => set({ open: false, available: true }),
  }
}

export const rightPanelStore = createRightPanelStore()
