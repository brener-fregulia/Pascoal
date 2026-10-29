import { describe, it, expect, afterEach, vi } from 'vitest'
import { locales, type Locale } from '../../../src/i18n'

const { mockEmit } = vi.hoisted(() => ({ mockEmit: vi.fn() }))

vi.mock('@tauri-apps/api/event', () => ({
    emit: mockEmit,
}))

import {
    commands,
    availableCommands,
    executeCommand,
    filterCommands,
    normalizeSearchText,
    type Command,
} from '../../../src/app/commands'

function resolve(locale: Locale, key: string): unknown {
    return key
        .split('.')
        .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], locales[locale])
}

function translator(locale: Locale) {
    return (key: string) => String(resolve(locale, key))
}

afterEach(() => {
    vi.clearAllMocks()
        ; (window as any).__TAURI__ = undefined
})

describe('command catalog', () => {
    it('has unique ids', () => {
        const ids = commands.map((c) => c.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it('uses label keys that exist in every locale', () => {
        for (const locale of Object.keys(locales) as Locale[]) {
            for (const command of commands) {
                expect(typeof resolve(locale, command.labelKey), `${locale}:${command.labelKey}`).toBe('string')
            }
        }
    })

    it('keeps a stable order', () => {
        expect(commands.map((c) => c.id)).toEqual([
            'file.new',
            'file.open',
            'workspace.open',
            'search.findInFiles',
        ])
    })

    it('hides every event-based command without the Tauri runtime', () => {
        expect(availableCommands()).toEqual([])
    })

    it('lists every command in catalog order with the Tauri runtime', () => {
        ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
        expect(availableCommands().map((c) => c.id)).toEqual(commands.map((c) => c.id))
    })
})

describe('executeCommand', () => {
    it.each([
        ['file.new', 'menu-new-file'],
        ['file.open', 'menu-open-file'],
        ['workspace.open', 'menu-open-folder'],
        ['search.findInFiles', 'menu-find-in-files'],
    ])('runs %s by emitting the existing %s event', async (id, event) => {
        ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
        const command = commands.find((c) => c.id === id)!
        expect(await executeCommand(command)).toBe(true)
        expect(mockEmit).toHaveBeenCalledTimes(1)
        expect(mockEmit).toHaveBeenCalledWith(event)
    })

    it('does not run anything without the Tauri runtime', async () => {
        for (const command of commands) {
            expect(await executeCommand(command)).toBe(false)
        }
        expect(mockEmit).not.toHaveBeenCalled()
    })

    it('checks availability again right before running', async () => {
        ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
        const [listed] = availableCommands()
            ; (window as any).__TAURI__ = undefined

        expect(await executeCommand(listed)).toBe(false)
        expect(mockEmit).not.toHaveBeenCalled()
    })

    it('logs failures instead of rejecting', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => { })
        const failing: Command = {
            id: 'file.new',
            labelKey: 'menu.new_file',
            isAvailable: () => true,
            run: () => Promise.reject(new Error('boom')),
        }
        await expect(executeCommand(failing)).resolves.toBe(true)
        expect(error).toHaveBeenCalled()
        error.mockRestore()
    })
})

describe('command search', () => {
    const en = translator('en')
    const ptBR = translator('pt-BR')

    function ids(list: Command[]) {
        return list.map((c) => c.id)
    }

    it('returns the whole list in catalog order for an empty query', () => {
        expect(ids(filterCommands(commands, '   ', en))).toEqual(ids([...commands]))
    })

    it('matches partial text', () => {
        expect(ids(filterCommands(commands, 'fold', en))).toEqual(['workspace.open'])
    })

    it('keeps catalog order among matches', () => {
        expect(ids(filterCommands(commands, 'open', en))).toEqual(['file.open', 'workspace.open'])
    })

    it('ignores case', () => {
        expect(ids(filterCommands(commands, 'FIND IN', en))).toEqual(['search.findInFiles'])
    })

    it('ignores diacritics in the query and in the labels', () => {
        expect(ids(filterCommands(commands, 'pásta', ptBR))).toEqual(['workspace.open'])
        expect(normalizeSearchText('Comentário de Linha')).toBe('comentario de linha')
    })

    it('searches only the labels of the selected locale', () => {
        expect(ids(filterCommands(commands, 'abrir', ptBR))).toEqual(['file.open', 'workspace.open'])
        expect(ids(filterCommands(commands, 'abrir', en))).toEqual([])
        expect(ids(filterCommands(commands, 'localizar', ptBR))).toEqual(['search.findInFiles'])
    })

    it('returns no results when nothing matches', () => {
        expect(filterCommands(commands, 'zzz', en)).toEqual([])
    })
})
