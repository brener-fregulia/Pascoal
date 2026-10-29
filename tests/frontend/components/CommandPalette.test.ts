import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import { tick } from 'svelte'
import { localeStore } from '../../../src/i18n'

const { mockEmit } = vi.hoisted(() => ({ mockEmit: vi.fn() }))

vi.mock('@tauri-apps/api/event', () => ({
    emit: mockEmit,
}))

import CommandPalette from '../../../src/app/CommandPalette.svelte'

let outside: HTMLButtonElement

beforeEach(() => {
    ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
    localeStore.set('en')
    outside = document.createElement('button')
    outside.textContent = 'outside'
    document.body.appendChild(outside)
    outside.focus()
})

afterEach(() => {
    cleanup()
    outside.remove()
    vi.clearAllMocks()
    localeStore.set('en')
        ; (window as any).__TAURI__ = undefined
})

function renderPalette() {
    const onClose = vi.fn()
    const utils = render(CommandPalette, { onClose })
    const input = utils.getByRole('combobox') as HTMLInputElement
    return { ...utils, input, onClose }
}

function activeLabel(input: HTMLInputElement) {
    const id = input.getAttribute('aria-activedescendant')
    return id ? document.getElementById(id)?.textContent?.trim() : undefined
}

describe('CommandPalette', () => {
    it('focuses the search input when it opens', () => {
        const { input } = renderPalette()
        expect(document.activeElement).toBe(input)
    })

    it('exposes a dialog with a combobox controlling a listbox', () => {
        const { getByRole, input } = renderPalette()
        expect(getByRole('dialog', { name: 'Command Palette' })).toBeInTheDocument()
        const listbox = getByRole('listbox')
        expect(input).toHaveAttribute('aria-controls', listbox.id)
        expect(input).toHaveAttribute('aria-expanded', 'true')
        expect(input).toHaveAttribute('placeholder', 'Type a command name')
    })

    it('lists the available commands in catalog order with the first one active', () => {
        const { getAllByRole, input } = renderPalette()
        const options = getAllByRole('option').map((o) => o.textContent?.trim())
        expect(options).toEqual(['New File', 'Open File...', 'Open Folder...', 'Find in Files'])
        expect(activeLabel(input)).toBe('New File')
        expect(getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
    })

    it('moves the active option with the arrow keys and wraps around', async () => {
        const { input } = renderPalette()
        await fireEvent.keyDown(input, { key: 'ArrowDown' })
        expect(activeLabel(input)).toBe('Open File...')
        await fireEvent.keyDown(input, { key: 'ArrowUp' })
        await fireEvent.keyDown(input, { key: 'ArrowUp' })
        expect(activeLabel(input)).toBe('Find in Files')
        await fireEvent.keyDown(input, { key: 'ArrowDown' })
        expect(activeLabel(input)).toBe('New File')
    })

    it('filters by the typed text and resets the selection', async () => {
        const { getAllByRole, input } = renderPalette()
        await fireEvent.keyDown(input, { key: 'ArrowDown' })
        await fireEvent.input(input, { target: { value: 'folder' } })
        expect(getAllByRole('option').map((o) => o.textContent?.trim())).toEqual(['Open Folder...'])
        expect(activeLabel(input)).toBe('Open Folder...')
    })

    it('runs the active command on Enter after closing and restoring focus', async () => {
        let focusedWhenRun: Element | null = null
        mockEmit.mockImplementation(() => {
            focusedWhenRun = document.activeElement
        })
        const { input, onClose } = renderPalette()
        await fireEvent.keyDown(input, { key: 'ArrowDown' })
        await fireEvent.keyDown(input, { key: 'ArrowDown' })
        await fireEvent.keyDown(input, { key: 'Enter' })
        await vi.waitFor(() => expect(mockEmit).toHaveBeenCalledWith('menu-open-folder'))
        expect(mockEmit).toHaveBeenCalledTimes(1)
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(focusedWhenRun).toBe(outside)
    })

    it('runs a command clicked with the mouse', async () => {
        const { getByRole, onClose } = renderPalette()
        await fireEvent.click(getByRole('option', { name: 'Find in Files' }))
        await vi.waitFor(() => expect(mockEmit).toHaveBeenCalledWith('menu-find-in-files'))
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('closes on Escape without running and restores the previous focus', async () => {
        const { input, onClose } = renderPalette()
        await fireEvent.keyDown(input, { key: 'Escape' })
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(document.activeElement).toBe(outside)
        await tick()
        expect(mockEmit).not.toHaveBeenCalled()
    })

    it('closes on a click outside without running', async () => {
        const { container, onClose } = renderPalette()
        await fireEvent.click(container.querySelector('.cp-backdrop')!)
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(document.activeElement).toBe(outside)
        expect(mockEmit).not.toHaveBeenCalled()
    })

    it('stays open on a click inside the dialog', async () => {
        const { getByRole, onClose } = renderPalette()
        await fireEvent.click(getByRole('dialog'))
        expect(onClose).not.toHaveBeenCalled()
    })

    it('does not let handled or typed keys reach document and window listeners', async () => {
        const onDocument = vi.fn()
        const onWindow = vi.fn()
        document.addEventListener('keydown', onDocument)
        window.addEventListener('keydown', onWindow)
        const { input } = renderPalette()
        for (const init of [
            { key: 'a' },
            { key: 'ArrowDown' },
            { key: 's', ctrlKey: true },
            { key: 'f', ctrlKey: true },
            { key: 'F5' },
            { key: 'P', ctrlKey: true, shiftKey: true },
            { key: 'Enter' },
        ]) {
            await fireEvent.keyDown(input, init)
        }
        // Enter ran the active command; wait for it so it cannot leak.
        await vi.waitFor(() => expect(mockEmit).toHaveBeenCalledWith('menu-open-file'))
        document.removeEventListener('keydown', onDocument)
        window.removeEventListener('keydown', onWindow)
        expect(onDocument).not.toHaveBeenCalled()
        expect(onWindow).not.toHaveBeenCalled()
    })

    it('shows a localized empty state when nothing matches', async () => {
        const { getByRole, queryAllByRole, input } = renderPalette()
        await fireEvent.input(input, { target: { value: 'zzz' } })
        expect(queryAllByRole('option')).toHaveLength(0)
        expect(getByRole('status')).toHaveTextContent('No matching commands')
        expect(input).toHaveAttribute('aria-expanded', 'false')
        expect(input).not.toHaveAttribute('aria-activedescendant')

        await fireEvent.keyDown(input, { key: 'Enter' })
        expect(mockEmit).not.toHaveBeenCalled()

        localeStore.set('pt-BR')
        await tick()
        expect(getByRole('status')).toHaveTextContent('Nenhum comando encontrado')
    })

    it('searches the labels of the locale selected while it is open', async () => {
        const { getAllByRole, input } = renderPalette()
        localeStore.set('pt-BR')
        await tick()
        await fireEvent.input(input, { target: { value: 'pasta' } })
        expect(getAllByRole('option').map((o) => o.textContent?.trim())).toEqual(['Abrir Pasta...'])
    })

    it('lists nothing and runs nothing without the Tauri runtime', async () => {
        ; (window as any).__TAURI__ = undefined
        const { queryAllByRole, getByRole, input } = renderPalette()
        expect(queryAllByRole('option')).toHaveLength(0)
        expect(getByRole('status')).toBeInTheDocument()
        await fireEvent.keyDown(input, { key: 'Enter' })
        expect(mockEmit).not.toHaveBeenCalled()
    })

    it('does not run a listed command that became unavailable', async () => {
        const { getByRole, onClose } = renderPalette()
            ; (window as any).__TAURI__ = undefined
        await fireEvent.click(getByRole('option', { name: 'New File' }))
        await tick()
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(mockEmit).not.toHaveBeenCalled()
    })
})
