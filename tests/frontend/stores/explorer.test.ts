import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'
import { explorerStore } from '../../../src/renderer/ide/src/stores/explorerStore'

function state() {
    return get(explorerStore)
}

const MOCK_FOLDER = { name: 'MyProject', path: 'C:\\Users\\test\\MyProject' }
const MOCK_TREE = [
    {
        name: 'src',
        path: 'C:\\Users\\test\\MyProject\\src',
        relativePath: 'src',
        isDirectory: true,
        children: [
            {
                name: 'main.pas',
                path: 'C:\\Users\\test\\MyProject\\src\\main.pas',
                relativePath: 'src\\main.pas',
                isDirectory: false,
                children: null,
            },
        ],
    },
    {
        name: '.gitignore',
        path: 'C:\\Users\\test\\MyProject\\.gitignore',
        relativePath: '.gitignore',
        isDirectory: false,
        children: null,
    },
]

function mockTauri(invokeImpl: (...args: any[]) => any) {
    vi.stubGlobal('__TAURI__', {
        core: { invoke: vi.fn().mockImplementation(invokeImpl) },
    })
}

describe('explorerStore', () => {
    beforeEach(() => {
        explorerStore.reset()
        vi.unstubAllGlobals()
    })

    describe('initial state', () => {
        it('has no folder open', () => {
            expect(state().folder).toBeNull()
        })

        it('has empty tree', () => {
            expect(state().tree).toHaveLength(0)
        })

        it('is not loading', () => {
            expect(state().loading).toBe(false)
        })

        it('has no error', () => {
            expect(state().error).toBeNull()
        })
    })

    describe('openFolder', () => {
        it('returns false when not in Tauri context', async () => {
            vi.stubGlobal('__TAURI__', undefined)
            const result = await explorerStore.openFolder()
            expect(result).toBe(false)
        })

        it('returns false when user cancels dialog', async () => {
            mockTauri(() => Promise.resolve(null))
            const result = await explorerStore.openFolder()
            expect(result).toBe(false)
            expect(state().folder).toBeNull()
            expect(state().loading).toBe(false)
        })

        it('sets folder and tree on success', async () => {
            mockTauri(() => Promise.resolve({ folder: MOCK_FOLDER, tree: MOCK_TREE }))
            const result = await explorerStore.openFolder()
            expect(result).toBe(true)
            expect(state().folder).toEqual(MOCK_FOLDER)
            expect(state().tree).toHaveLength(2)
        })

        it('preserves nested children in the tree', async () => {
            mockTauri(() => Promise.resolve({ folder: MOCK_FOLDER, tree: MOCK_TREE }))
            await explorerStore.openFolder()
            const srcNode = state().tree.find(n => n.name === 'src')
            expect(srcNode?.isDirectory).toBe(true)
            expect(srcNode?.children).toHaveLength(1)
            expect(srcNode?.children?.[0].name).toBe('main.pas')
        })

        it('sets error on failure', async () => {
            mockTauri(() => Promise.reject(new Error('permission denied')))
            const result = await explorerStore.openFolder()
            expect(result).toBe(false)
            expect(state().error).toBe('permission denied')
            expect(state().loading).toBe(false)
        })
    })

    describe('closeFolder', () => {
        it('clears folder and tree', async () => {
            mockTauri(() => Promise.resolve({ folder: MOCK_FOLDER, tree: MOCK_TREE }))
            await explorerStore.openFolder()
            explorerStore.closeFolder()
            expect(state().folder).toBeNull()
            expect(state().tree).toHaveLength(0)
        })
    })

    describe('refresh', () => {
        it('does nothing when no folder is open', async () => {
            await explorerStore.refresh()
            expect(state().loading).toBe(false)
        })

        it('does nothing outside Tauri context', async () => {
            vi.stubGlobal('__TAURI__', undefined)
            await explorerStore.refresh()
            expect(state().tree).toHaveLength(0)
        })
    })

    describe('reset', () => {
        it('restores initial state', async () => {
            mockTauri(() => Promise.resolve({ folder: MOCK_FOLDER, tree: MOCK_TREE }))
            await explorerStore.openFolder()
            explorerStore.reset()
            expect(state().folder).toBeNull()
            expect(state().tree).toHaveLength(0)
            expect(state().error).toBeNull()
        })
    })
})