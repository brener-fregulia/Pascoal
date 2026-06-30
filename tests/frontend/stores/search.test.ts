import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'
import { searchStore } from '../../../src/renderer/ide/src/stores/searchStore'
import { explorerStore } from '../../../src/renderer/ide/src/stores/explorerStore'

function state() {
    return get(searchStore)
}

const MOCK_FOLDER = { name: 'MyProject', path: 'C:\\Users\\test\\MyProject' }
const MOCK_RESULTS = [
    { filePath: 'C:\\...\\main.pas', fileName: 'main.pas', lineNumber: 3, lineText: 'writeln(x);', column: 2 },
    { filePath: 'C:\\...\\utils.pas', fileName: 'utils.pas', lineNumber: 7, lineText: 'writeln(y);', column: 2 },
]

function mockTauri(invokeImpl: (...args: any[]) => any) {
    vi.stubGlobal('__TAURI__', {
        core: { invoke: vi.fn().mockImplementation(invokeImpl) },
    })
}

describe('searchStore', () => {
    beforeEach(() => {
        searchStore.reset()
        explorerStore.reset()
        vi.unstubAllGlobals()
    })

    describe('initial state', () => {
        it('has empty query', () => {
            expect(state().query).toBe('')
        })

        it('has empty results', () => {
            expect(state().results).toHaveLength(0)
        })

        it('is not loading', () => {
            expect(state().loading).toBe(false)
        })

        it('case sensitivity defaults to false', () => {
            expect(state().caseSensitive).toBe(false)
        })
    })

    describe('search', () => {
        it('clears results for empty query', async () => {
            await searchStore.search('')
            expect(state().results).toHaveLength(0)
        })

        it('clears results when no folder is open', async () => {
            mockTauri(() => Promise.resolve(MOCK_RESULTS))
            await searchStore.search('writeln')
            expect(state().results).toHaveLength(0)
        })

        it('sets results when folder is open and search succeeds', async () => {
            mockTauri((cmd: string) => {
                if (cmd === 'open_folder') return Promise.resolve({ folder: MOCK_FOLDER, files: [] })
                if (cmd === 'search_in_folder') return Promise.resolve(MOCK_RESULTS)
            })

            await explorerStore.openFolder()
            await searchStore.search('writeln')

            expect(state().results).toHaveLength(2)
            expect(state().query).toBe('writeln')
        })

        it('clears loading state after search', async () => {
            mockTauri((cmd: string) => {
                if (cmd === 'open_folder') return Promise.resolve({ folder: MOCK_FOLDER, files: [] })
                if (cmd === 'search_in_folder') return Promise.resolve(MOCK_RESULTS)
            })

            await explorerStore.openFolder()
            await searchStore.search('writeln')

            expect(state().loading).toBe(false)
        })

        it('handles search failure gracefully', async () => {
            mockTauri((cmd: string) => {
                if (cmd === 'open_folder') return Promise.resolve({ folder: MOCK_FOLDER, files: [] })
                if (cmd === 'search_in_folder') return Promise.reject(new Error('search failed'))
            })

            await explorerStore.openFolder()
            await searchStore.search('writeln')

            expect(state().results).toHaveLength(0)
            expect(state().loading).toBe(false)
        })
    })

    describe('toggleCaseSensitive', () => {
        it('flips the flag', () => {
            searchStore.toggleCaseSensitive()
            expect(state().caseSensitive).toBe(true)
            searchStore.toggleCaseSensitive()
            expect(state().caseSensitive).toBe(false)
        })
    })

    describe('clear / reset', () => {
        it('restores initial state', async () => {
            mockTauri((cmd: string) => {
                if (cmd === 'open_folder') return Promise.resolve({ folder: MOCK_FOLDER, files: [] })
                if (cmd === 'search_in_folder') return Promise.resolve(MOCK_RESULTS)
            })

            await explorerStore.openFolder()
            await searchStore.search('writeln')
            searchStore.reset()

            expect(state().query).toBe('')
            expect(state().results).toHaveLength(0)
        })
    })
})