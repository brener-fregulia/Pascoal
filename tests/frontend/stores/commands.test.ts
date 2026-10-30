import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { locales, type Locale } from '../../../src/i18n'
import { tabStore } from '../../../src/editor/tabs'

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
    type CommandContext,
} from '../../../src/app/commands'

const ctx: CommandContext = { activePanel: null }

const EDITOR_COMMANDS = [
    'file.save',
    'file.saveAs',
    'edit.find',
    'edit.replace',
    'edit.toggleLineComment',
]

function enableTauri() {
    ; (window as any).__TAURI__ = { core: { invoke: vi.fn() } }
}

async function openEditorTab() {
    const tab = await tabStore.newTab('program Test;\nbegin\nend.\n')
    tabStore.activate(tab.id)
}

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
    tabStore.reset()
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
            'file.save',
            'file.saveAs',
            'edit.find',
            'edit.replace',
            'search.findInFiles',
            'edit.toggleLineComment',
        ])
    })

    it('hides every event-based command without the Tauri runtime', () => {
        expect(availableCommands(ctx)).toEqual([])
    })

    it('lists only the workspace-level commands without an editor tab', () => {
        enableTauri()
        expect(availableCommands(ctx).map((c) => c.id)).toEqual([
            'file.new',
            'file.open',
            'workspace.open',
            'search.findInFiles',
        ])
    })

    it('lists every command in catalog order with an active editor tab', async () => {
        enableTauri()
        await openEditorTab()
        expect(availableCommands(ctx).map((c) => c.id)).toEqual(commands.map((c) => c.id))
        expect(availableCommands({ activePanel: 'explorer' })).toHaveLength(commands.length)
    })
})

describe('editor command availability', () => {
    function editorIds(context: CommandContext = ctx) {
        return availableCommands(context)
            .map((c) => c.id)
            .filter((id) => EDITOR_COMMANDS.includes(id))
    }

    beforeEach(() => {
        enableTauri()
        tabStore.reset()
    })

    it('requires an active editor tab', async () => {
        expect(editorIds()).toEqual([])
        await openEditorTab()
        expect(editorIds()).toEqual(EDITOR_COMMANDS)
    })

    it('hides editor commands in the Settings view, where the editor is not rendered', async () => {
        await openEditorTab()
        expect(editorIds({ activePanel: 'settings' })).toEqual([])
    })

    it('hides editor commands while the Welcome view is shown', async () => {
        await openEditorTab()
        tabStore.showWelcome()
        expect(editorIds()).toEqual([])
    })

    it('hides editor commands while a diff tab is shown', async () => {
        await openEditorTab()
        tabStore.activateDiff('diff:src/main.pas')
        expect(editorIds()).toEqual([])
    })

    it('hides editor commands without the Tauri runtime', async () => {
        await openEditorTab()
            ; (window as any).__TAURI__ = undefined
        expect(editorIds()).toEqual([])
    })
})

describe('executeCommand', () => {
    it.each([
        ['file.new', 'menu-new-file'],
        ['file.open', 'menu-open-file'],
        ['workspace.open', 'menu-open-folder'],
        ['search.findInFiles', 'menu-find-in-files'],
        ['file.save', 'menu-save-file'],
        ['file.saveAs', 'menu-save-file-as'],
        ['edit.find', 'menu-find'],
        ['edit.replace', 'menu-replace'],
        ['edit.toggleLineComment', 'menu-toggle-comment'],
    ])('runs %s by emitting the existing %s event', async (id, event) => {
        enableTauri()
        await openEditorTab()
        const command = commands.find((c) => c.id === id)!
        expect(await executeCommand(command, ctx)).toBe(true)
        expect(mockEmit).toHaveBeenCalledTimes(1)
        expect(mockEmit).toHaveBeenCalledWith(event)
    })

    it('does not run anything without the Tauri runtime', async () => {
        for (const command of commands) {
            expect(await executeCommand(command, ctx)).toBe(false)
        }
        expect(mockEmit).not.toHaveBeenCalled()
    })

    it('checks availability again right before running', async () => {
        enableTauri()
        const [listed] = availableCommands(ctx)
            ; (window as any).__TAURI__ = undefined

        expect(await executeCommand(listed, ctx)).toBe(false)
        expect(mockEmit).not.toHaveBeenCalled()
    })

    it('does not run an editor command once the editor is no longer usable', async () => {
        enableTauri()
        await openEditorTab()
        const save = availableCommands(ctx).find((c) => c.id === 'file.save')!

        expect(await executeCommand(save, { activePanel: 'settings' })).toBe(false)
        tabStore.showWelcome()
        expect(await executeCommand(save, ctx)).toBe(false)
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
        await expect(executeCommand(failing, ctx)).resolves.toBe(true)
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
        expect(ids(filterCommands(commands, 'comentario', ptBR))).toEqual(['edit.toggleLineComment'])
        expect(normalizeSearchText('Comentário de Linha')).toBe('comentario de linha')
    })

    it('searches only the labels of the selected locale', () => {
        expect(ids(filterCommands(commands, 'abrir', ptBR))).toEqual(['file.open', 'workspace.open'])
        expect(ids(filterCommands(commands, 'abrir', en))).toEqual([])
        expect(ids(filterCommands(commands, 'localizar', ptBR))).toEqual(['edit.find', 'search.findInFiles'])
    })

    it('returns no results when nothing matches', () => {
        expect(filterCommands(commands, 'zzz', en)).toEqual([])
    })
})
