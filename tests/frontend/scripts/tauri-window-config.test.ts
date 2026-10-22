import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const config = JSON.parse(
    readFileSync('../src-tauri/tauri.conf.json', 'utf-8'),
)
const win = config.app.windows[0]

// Mirrors the layout constants in src/editor/EditorArea.svelte:
// activity bar + minimum side panel + width reserved for the editor.
const MIN_LAYOUT_WIDTH = 48 + 220 + 480

describe('main window configuration', () => {
    it('stays resizable so the built-in undecorated resize borders apply', () => {
        expect(win.resizable).toBe(true)
        expect(win.decorations).toBe(false)
    })

    it('has a minimum width that fits the activity bar, side panel and editor', () => {
        expect(win.minWidth).toBeGreaterThanOrEqual(MIN_LAYOUT_WIDTH)
    })

    it('has a minimum height that keeps titlebar, tab bar and statusbar usable', () => {
        // titlebar 36 + tab bar 35 + statusbar 24 + room for content
        expect(win.minHeight).toBeGreaterThanOrEqual(36 + 35 + 24 + 300)
    })

    it('keeps the initial size above the minimum', () => {
        expect(win.width).toBeGreaterThanOrEqual(win.minWidth)
        expect(win.height).toBeGreaterThanOrEqual(win.minHeight)
    })
})
