import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'
import { gitStore } from '../../../src/renderer/ide/src/stores/gitStore'
import { explorerStore } from '../../../src/renderer/ide/src/stores/explorerStore'

function state() {
    return get(gitStore)
}

const MOCK_FOLDER = { name: 'MyProject', path: 'C:\\Users\\test\\MyProject' }

function mockTauri(handlers: Record<string, (...args: any[]) => any>) {
    vi.stubGlobal('__TAURI__', {
        core: {
            invoke: vi.fn().mockImplementation((cmd: string, args: any) => {
                const handler = handlers[cmd]
                if (!handler) return Promise.reject(new Error(`no handler for ${cmd}`))
                return handler(args)
            }),
        },
    })
}

async function openMockFolder() {
    mockTauri({ open_folder: () => Promise.resolve({ folder: MOCK_FOLDER, files: [] }) })
    await explorerStore.openFolder()
}

describe('gitStore', () => {
    beforeEach(() => {
        gitStore.reset()
        explorerStore.reset()
        vi.unstubAllGlobals()
    })

    describe('initial state', () => {
        it('is not a repo', () => {
            expect(state().isRepo).toBe(false)
        })

        it('has empty staged and unstaged', () => {
            expect(state().staged).toHaveLength(0)
            expect(state().unstaged).toHaveLength(0)
        })

        it('has empty commit message', () => {
            expect(state().commitMessage).toBe('')
        })
    })

    describe('refresh', () => {
        it('does nothing without an open folder', async () => {
            await gitStore.refresh()
            expect(state().isRepo).toBe(false)
        })

        it('sets repo status and file lists', async () => {
            await openMockFolder()
            mockTauri({
                git_status: () => Promise.resolve({
                    isRepo: true,
                    branch: 'main',
                    staged: [{ path: 'main.pas', status: 'added' }],
                    unstaged: [{ path: 'utils.pas', status: 'modified' }],
                }),
            })

            await gitStore.refresh()

            expect(state().isRepo).toBe(true)
            expect(state().branch).toBe('main')
            expect(state().staged).toHaveLength(1)
            expect(state().unstaged).toHaveLength(1)
        })

        it('sets error on failure', async () => {
            await openMockFolder()
            mockTauri({ git_status: () => Promise.reject(new Error('git not found')) })

            await gitStore.refresh()

            expect(state().error).toBe('git not found')
        })
    })

    describe('stage / unstage', () => {
        it('calls refresh after staging', async () => {
            await openMockFolder()
            let statusCalls = 0
            mockTauri({
                git_stage: () => Promise.resolve(),
                git_status: () => {
                    statusCalls++
                    return Promise.resolve({ isRepo: true, branch: 'main', staged: [], unstaged: [] })
                },
            })

            await gitStore.stage('main.pas')

            expect(statusCalls).toBe(1)
        })

        it('calls refresh after unstaging', async () => {
            await openMockFolder()
            let statusCalls = 0
            mockTauri({
                git_unstage: () => Promise.resolve(),
                git_status: () => {
                    statusCalls++
                    return Promise.resolve({ isRepo: true, branch: 'main', staged: [], unstaged: [] })
                },
            })

            await gitStore.unstage('main.pas')

            expect(statusCalls).toBe(1)
        })
    })

    describe('commit', () => {
        it('does nothing with empty message', async () => {
            await openMockFolder()
            const result = await gitStore.commit()
            expect(result).toBe(false)
        })

        it('commits and clears message on success', async () => {
            await openMockFolder()
            gitStore.setCommitMessage('Initial commit')

            mockTauri({
                git_commit: () => Promise.resolve(),
                git_status: () => Promise.resolve({ isRepo: true, branch: 'main', staged: [], unstaged: [] }),
            })

            const result = await gitStore.commit()

            expect(result).toBe(true)
            expect(state().commitMessage).toBe('')
        })

        it('keeps message and sets error on failure', async () => {
            await openMockFolder()
            gitStore.setCommitMessage('Initial commit')

            mockTauri({ git_commit: () => Promise.reject(new Error('nothing to commit')) })

            const result = await gitStore.commit()

            expect(result).toBe(false)
            expect(state().error).toBe('nothing to commit')
            expect(state().commitMessage).toBe('Initial commit')
        })
    })

    describe('initRepo', () => {
        it('calls git_init then refreshes', async () => {
            await openMockFolder()
            let initCalled = false
            mockTauri({
                git_init: () => { initCalled = true; return Promise.resolve() },
                git_status: () => Promise.resolve({ isRepo: true, branch: 'main', staged: [], unstaged: [] }),
            })

            await gitStore.initRepo()

            expect(initCalled).toBe(true)
            expect(state().isRepo).toBe(true)
        })
    })

    describe('setCommitMessage', () => {
        it('updates the message', () => {
            gitStore.setCommitMessage('fix: bug')
            expect(state().commitMessage).toBe('fix: bug')
        })
    })

    describe('reset', () => {
        it('restores initial state', async () => {
            await openMockFolder()
            gitStore.setCommitMessage('something')
            gitStore.reset()

            expect(state().isRepo).toBe(false)
            expect(state().commitMessage).toBe('')
        })
    })
})