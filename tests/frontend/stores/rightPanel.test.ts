import { describe, it, expect, afterEach, vi } from 'vitest'
import { get } from 'svelte/store'

afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.resetModules()
})

// A fresh import simulates an application restart.
async function freshModule() {
    vi.resetModules()
    return import('../../../src/app/rightPanel')
}

describe('rightPanelStore persistence', () => {
    it('starts closed on first run', async () => {
        const { rightPanelStore } = await freshModule()
        expect(get(rightPanelStore).open).toBe(false)
    })

    it('restores an explicit open after a restart', async () => {
        const first = await freshModule()
        first.rightPanelStore.toggle()
        const second = await freshModule()
        expect(get(second.rightPanelStore).open).toBe(true)
    })

    it('restores an explicit close after a restart', async () => {
        const first = await freshModule()
        first.rightPanelStore.toggle()
        first.rightPanelStore.toggle()
        const second = await freshModule()
        expect(get(second.rightPanelStore).open).toBe(false)
    })

    it('does not persist availability or change the preference when space runs out', async () => {
        const first = await freshModule()
        first.rightPanelStore.toggle()
        first.rightPanelStore.setAvailable(false)
        expect(get(first.rightPanelStore).open).toBe(true)
        expect(localStorage.getItem('pascoal-right-panel-open')).toBe('true')
        const second = await freshModule()
        expect(get(second.rightPanelStore)).toEqual({ open: true, available: true })
    })

    it('treats unexpected stored values as closed', async () => {
        localStorage.setItem('pascoal-right-panel-open', 'yes')
        const { rightPanelStore } = await freshModule()
        expect(get(rightPanelStore).open).toBe(false)
    })

    it('survives unavailable localStorage', async () => {
        vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
            throw new Error('denied')
        })
        vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
            throw new Error('denied')
        })
        const { rightPanelStore, loadRightPanelWidth, saveRightPanelWidth } =
            await freshModule()
        expect(get(rightPanelStore).open).toBe(false)
        expect(() => rightPanelStore.toggle()).not.toThrow()
        expect(get(rightPanelStore).open).toBe(true)
        expect(loadRightPanelWidth(260)).toBe(260)
        expect(() => saveRightPanelWidth(300)).not.toThrow()
    })
})

describe('right panel width persistence', () => {
    it('falls back to the default when nothing is saved', async () => {
        const { loadRightPanelWidth } = await freshModule()
        expect(loadRightPanelWidth(260)).toBe(260)
    })

    it('saves and loads whole pixels', async () => {
        const { loadRightPanelWidth, saveRightPanelWidth } = await freshModule()
        saveRightPanelWidth(399.6)
        expect(localStorage.getItem('pascoal-right-panel-width')).toBe('400')
        expect(loadRightPanelWidth(260)).toBe(400)
    })

    it.each([NaN, Infinity, -Infinity, 0, -50])('does not save %s', async (value) => {
        const { saveRightPanelWidth } = await freshModule()
        saveRightPanelWidth(value)
        expect(localStorage.getItem('pascoal-right-panel-width')).toBeNull()
    })

    it.each(['abc', 'NaN', 'Infinity', '0', '-120', ''])(
        'ignores stored value %j',
        async (stored) => {
            localStorage.setItem('pascoal-right-panel-width', stored)
            const { loadRightPanelWidth } = await freshModule()
            expect(loadRightPanelWidth(260)).toBe(260)
        },
    )

    it('is independent from the sidebar width key', async () => {
        const { saveRightPanelWidth } = await freshModule()
        saveRightPanelWidth(320)
        expect(localStorage.getItem('pascoal-side-panel-width')).toBeNull()
    })
})
