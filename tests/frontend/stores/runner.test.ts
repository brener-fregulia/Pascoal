import { describe, it, expect, beforeEach, vi } from 'vitest'

const {
    mockSettings,
    mockGetActive,
    mockMarkClean,
    mockShow,
    mockSetRunning,
    mockResetBuild,
    mockSetBuildStatus,
    mockClearUpdate,
} = vi.hoisted(() => ({
    mockSettings: { autoSaveBeforeRun: true },
    mockGetActive: vi.fn(),
    mockMarkClean: vi.fn(),
    mockShow: vi.fn(),
    mockSetRunning: vi.fn(),
    mockResetBuild: vi.fn(),
    mockSetBuildStatus: vi.fn(),
    mockClearUpdate: vi.fn(),
}))

vi.mock('../../../src/editor/tabs', () => ({
    tabStore: {
        getActive: mockGetActive,
        markClean: mockMarkClean,
    },
}))

vi.mock('../../../src/toolchain/console', () => ({
    consoleStore: {
        show: mockShow,
        setRunning: mockSetRunning,
        resetBuild: mockResetBuild,
        setBuildStatus: mockSetBuildStatus,
    },
    clearConsoleSignal: { update: mockClearUpdate },
}))

vi.mock('../../../src/app/settings', () => ({
    settingsStore: {
        subscribe: (fn: (v: typeof mockSettings) => void) => {
            fn(mockSettings)
            return () => { }
        },
    },
}))

import { runActiveFile } from '../../../src/toolchain/runner'

function makeTab(
    overrides: Partial<{ id: string; filePath: string | null; doc: string }> = {},
) {
    return {
        id: overrides.id ?? 'tab-1',
        // 'filePath' in overrides (not ??) - null is a deliberate, valid
        // value here (unsaved file), and ?? would silently replace it
        // with the default since it treats null and undefined the same.
        filePath: 'filePath' in overrides ? overrides.filePath : '/tmp/main.pas',
        state: { doc: { toString: () => overrides.doc ?? 'program Test;' } },
    }
}

describe('runActiveFile', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockSettings.autoSaveBeforeRun = true
    })

    it('does nothing outside a Tauri context', async () => {
        vi.stubGlobal('__TAURI__', undefined)
        await runActiveFile()
        expect(mockShow).not.toHaveBeenCalled()
    })

    it('shows the console and returns early when there is no active tab', async () => {
        vi.stubGlobal('__TAURI__', { core: { invoke: vi.fn() } })
        mockGetActive.mockReturnValue(undefined)

        await runActiveFile()

        expect(mockShow).toHaveBeenCalledTimes(1)
    })

    it('shows the console and returns early for an unsaved file with auto-save on', async () => {
        vi.stubGlobal('__TAURI__', { core: { invoke: vi.fn() } })
        mockGetActive.mockReturnValue(makeTab({ filePath: null }))

        await runActiveFile()

        expect(mockShow).toHaveBeenCalledTimes(1)
        expect(mockResetBuild).not.toHaveBeenCalled()
    })

    it('stops and does not run if the auto-save fails', async () => {
        const invokeMock = vi.fn().mockRejectedValue(new Error('disk full'))
        vi.stubGlobal('__TAURI__', { core: { invoke: invokeMock } })
        mockGetActive.mockReturnValue(makeTab())

        await runActiveFile()

        expect(invokeMock).toHaveBeenCalledWith(
            'save_file',
            expect.objectContaining({ filePath: '/tmp/main.pas' }),
        )
        expect(mockMarkClean).not.toHaveBeenCalled()
        expect(mockResetBuild).not.toHaveBeenCalled()
    })

    it('saves, marks clean, and runs compile_and_run on the happy path', async () => {
        const invokeMock = vi.fn().mockResolvedValue(undefined)
        vi.stubGlobal('__TAURI__', { core: { invoke: invokeMock } })
        mockGetActive.mockReturnValue(makeTab({ id: 'tab-42', doc: 'program X;' }))

        await runActiveFile()

        expect(invokeMock).toHaveBeenCalledWith(
            'save_file',
            expect.objectContaining({
                content: 'program X;',
                filePath: '/tmp/main.pas',
            }),
        )
        expect(mockMarkClean).toHaveBeenCalledWith('tab-42')
        expect(mockResetBuild).toHaveBeenCalled()
        expect(invokeMock).toHaveBeenCalledWith('compile_and_run', {
            code: 'program X;',
        })
    })

    it('sets an error build status when compile_and_run fails', async () => {
        const invokeMock = vi.fn((cmd: string) => {
            if (cmd === 'save_file') return Promise.resolve(undefined)
            if (cmd === 'compile_and_run')
                return Promise.reject(new Error('compile failed'))
            return Promise.resolve(undefined)
        })
        vi.stubGlobal('__TAURI__', { core: { invoke: invokeMock } })
        mockGetActive.mockReturnValue(makeTab())

        await runActiveFile()

        expect(mockSetBuildStatus).toHaveBeenCalledWith('error')
        expect(mockSetRunning).toHaveBeenCalledWith(false)
    })
})