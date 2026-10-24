// PaneForge only works in percentages and keys its autoSaveId storage by the
// panes' constraints, which here depend on the window width. The side panel
// width is therefore remembered in pixels, independent of the window size.
const STORAGE_KEY = 'pascoal-side-panel-width'

export function loadSidePanelWidth(fallback: number): number {
  try {
    const width = Math.round(Number(localStorage.getItem(STORAGE_KEY)))
    return Number.isFinite(width) && width > 0 ? width : fallback
  } catch {
    return fallback
  }
}

export function saveSidePanelWidth(width: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.round(width)))
  } catch {
    /* ignore */
  }
}
