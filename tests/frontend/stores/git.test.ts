import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'
import { gitStore } from '../../../src/integrations/git/gitStore'
import { explorerStore } from "../../../src/project/explorerStore";

function state() {
    return get(gitStore)
}

const MOCK_FOLDER = { name: 'MyProject', path: 'C:\\Users\\test\\MyProject' }
const CONFIGURED_IDENTITY = { name: 'Test User', email: 'test@example.com' }

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
    mockTauri({ open_workspace: () => Promise.resolve({ folder: MOCK_FOLDER, tree: [] }) })
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

        it('does not need identity', () => {
            expect(state().needsIdentity).toBe(false)
        })

        it('has no notice', () => {
            expect(state().notice).toBeNull()
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
                git_check_identity: () => Promise.resolve(CONFIGURED_IDENTITY),
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

            mockTauri({
                git_check_identity: () => Promise.resolve(CONFIGURED_IDENTITY),
                git_commit: () => Promise.reject(new Error('nothing to commit')),
            })

            const result = await gitStore.commit()

            expect(result).toBe(false)
            expect(state().error).toBe('nothing to commit')
            expect(state().commitMessage).toBe('Initial commit')
        })

        it('sets needsIdentity when name is missing and does not attempt commit', async () => {
            await openMockFolder()
            gitStore.setCommitMessage('Initial commit')

            let commitCalled = false
            mockTauri({
                git_check_identity: () => Promise.resolve({ name: null, email: 'test@example.com' }),
                git_commit: () => { commitCalled = true; return Promise.resolve() },
            })

            const result = await gitStore.commit()

            expect(result).toBe(false)
            expect(state().needsIdentity).toBe(true)
            expect(commitCalled).toBe(false)
        })

        it('sets needsIdentity when email is missing', async () => {
            await openMockFolder()
            gitStore.setCommitMessage('Initial commit')

            mockTauri({
                git_check_identity: () => Promise.resolve({ name: 'Test User', email: null }),
            })

            const result = await gitStore.commit()

            expect(result).toBe(false)
            expect(state().needsIdentity).toBe(true)
        })

        it('sets a success notice after committing', async () => {
            await openMockFolder()
            gitStore.setCommitMessage('Initial commit')

            mockTauri({
                git_check_identity: () => Promise.resolve(CONFIGURED_IDENTITY),
                git_commit: () => Promise.resolve(),
                git_status: () => Promise.resolve({ isRepo: true, branch: 'main', staged: [], unstaged: [] }),
            })

            await gitStore.commit()

            expect(state().notice?.type).toBe('success')
        })

        it('sets an error notice on commit failure', async () => {
            await openMockFolder()
            gitStore.setCommitMessage('Initial commit')

            mockTauri({
                git_check_identity: () => Promise.resolve(CONFIGURED_IDENTITY),
                git_commit: () => Promise.reject(new Error('nothing to commit')),
            })

            await gitStore.commit()

            expect(state().notice?.type).toBe('error')
        })
    })

    describe('configureIdentity', () => {
        it('sets identity then retries commit successfully', async () => {
            await openMockFolder()
            gitStore.setCommitMessage('Initial commit')

            let setIdentityCalled = false
            mockTauri({
                git_set_identity: () => { setIdentityCalled = true; return Promise.resolve() },
                git_check_identity: () => Promise.resolve(CONFIGURED_IDENTITY),
                git_commit: () => Promise.resolve(),
                git_status: () => Promise.resolve({ isRepo: true, branch: 'main', staged: [], unstaged: [] }),
            })

            const result = await gitStore.configureIdentity('Test User', 'test@example.com', true)

            expect(setIdentityCalled).toBe(true)
            expect(result).toBe(true)
            expect(state().needsIdentity).toBe(false)
        })

        it('sets error if git_set_identity fails', async () => {
            await openMockFolder()

            mockTauri({
                git_set_identity: () => Promise.reject(new Error('config write failed')),
            })

            const result = await gitStore.configureIdentity('Test User', 'test@example.com', true)

            expect(result).toBe(false)
            expect(state().error).toBe('config write failed')
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
            expect(state().needsIdentity).toBe(false)
            expect(state().notice).toBeNull()
        })
    })

    describe('discard', () => {
        it('deletes untracked files instead of restoring them', async () => {
            await openMockFolder()
            let deleteCalled = false
            mockTauri({
                delete_file: () => { deleteCalled = true; return Promise.resolve() },
                git_status: () => Promise.resolve({ isRepo: true, branch: 'main', staged: [], unstaged: [] }),
            })

            await gitStore.discard('new.pas', true)

            expect(deleteCalled).toBe(true)
        })

        it('restores tracked files via git_discard', async () => {
            await openMockFolder()
            let discardCalled = false
            mockTauri({
                git_discard: () => { discardCalled = true; return Promise.resolve() },
                git_status: () => Promise.resolve({ isRepo: true, branch: 'main', staged: [], unstaged: [] }),
            })

            await gitStore.discard('main.pas', false)

            expect(discardCalled).toBe(true)
        })

        it('sets an error notice on failure', async () => {
            await openMockFolder()
            mockTauri({ git_discard: () => Promise.reject(new Error('cannot restore')) })

            await gitStore.discard('main.pas', false)

            expect(state().error).toBe('cannot restore')
            expect(state().notice?.type).toBe('error')
        })
    })

    describe('checkRemote', () => {
        it('sets remoteUrl and ahead/behind when a remote is configured', async () => {
            await openMockFolder()
            mockTauri({
                git_get_remote: () => Promise.resolve('https://github.com/user/repo.git'),
                git_ahead_behind: () => Promise.resolve([2, 1]),
            })

            await gitStore.checkRemote()

            expect(state().remoteUrl).toBe('https://github.com/user/repo.git')
            expect(state().ahead).toBe(2)
            expect(state().behind).toBe(1)
        })

        it('leaves ahead/behind at zero when there is no remote', async () => {
            await openMockFolder()
            mockTauri({ git_get_remote: () => Promise.resolve(null) })

            await gitStore.checkRemote()

            expect(state().remoteUrl).toBeNull()
            expect(state().ahead).toBe(0)
            expect(state().behind).toBe(0)
        })
    })

    describe('setRemote', () => {
        it('sets the remote and refreshes remote status', async () => {
            await openMockFolder()
            mockTauri({
                git_set_remote: () => Promise.resolve(),
                git_get_remote: () => Promise.resolve('https://github.com/user/repo.git'),
                git_ahead_behind: () => Promise.resolve([0, 0]),
            })

            const result = await gitStore.setRemote('https://github.com/user/repo.git')

            expect(result).toBe(true)
            expect(state().remoteUrl).toBe('https://github.com/user/repo.git')
            expect(state().notice?.type).toBe('success')
        })

        it('sets an error notice on failure', async () => {
            await openMockFolder()
            mockTauri({ git_set_remote: () => Promise.reject(new Error('invalid url')) })

            const result = await gitStore.setRemote('not-a-url')

            expect(result).toBe(false)
            expect(state().error).toBe('invalid url')
            expect(state().notice?.type).toBe('error')
        })
    })

    describe('push / pull / sync', () => {
        async function withBranch() {
            await openMockFolder()
            mockTauri({
                git_status: () => Promise.resolve({ isRepo: true, branch: 'main', staged: [], unstaged: [] }),
            })
            await gitStore.refresh()
        }

        it('push does nothing without a known branch', async () => {
            await openMockFolder()
            const result = await gitStore.push()
            expect(result).toBe(false)
        })

        it('push succeeds and refreshes remote status', async () => {
            await withBranch()
            mockTauri({
                git_push: () => Promise.resolve(),
                git_get_remote: () => Promise.resolve('https://github.com/user/repo.git'),
                git_ahead_behind: () => Promise.resolve([0, 0]),
            })

            const result = await gitStore.push()

            expect(result).toBe(true)
            expect(state().notice?.type).toBe('success')
        })

        it('push sets an error notice on failure', async () => {
            await withBranch()
            mockTauri({ git_push: () => Promise.reject(new Error('rejected')) })

            const result = await gitStore.push()

            expect(result).toBe(false)
            expect(state().notice?.type).toBe('error')
        })

        it('pull succeeds and does a full refresh', async () => {
            await withBranch()
            mockTauri({
                git_pull: () => Promise.resolve(),
                git_status: () => Promise.resolve({ isRepo: true, branch: 'main', staged: [], unstaged: [] }),
            })

            const result = await gitStore.pull()

            expect(result).toBe(true)
            expect(state().notice?.type).toBe('success')
        })

        it('sync stops after a failed pull without attempting push', async () => {
            await withBranch()
            let pushCalled = false
            mockTauri({
                git_pull: () => Promise.reject(new Error('conflict')),
                git_push: () => { pushCalled = true; return Promise.resolve() },
            })

            const result = await gitStore.sync()

            expect(result).toBe(false)
            expect(pushCalled).toBe(false)
        })

        it('sync pulls then pushes on success', async () => {
            await withBranch()
            let pullCalled = false
            let pushCalled = false
            mockTauri({
                git_pull: () => { pullCalled = true; return Promise.resolve() },
                git_status: () => Promise.resolve({ isRepo: true, branch: 'main', staged: [], unstaged: [] }),
                git_push: () => { pushCalled = true; return Promise.resolve() },
                git_get_remote: () => Promise.resolve('https://github.com/user/repo.git'),
                git_ahead_behind: () => Promise.resolve([0, 0]),
            })

            const result = await gitStore.sync()

            expect(result).toBe(true)
            expect(pullCalled).toBe(true)
            expect(pushCalled).toBe(true)
        })
    })

    describe('watchFolder', () => {
        it('refreshes git status when the open folder changes', async () => {
            let statusCalls = 0
            mockTauri({
                open_workspace: () => Promise.resolve({ folder: MOCK_FOLDER, tree: [] }),
                git_status: () => {
                    statusCalls++
                    return Promise.resolve({ isRepo: true, branch: 'main', staged: [], unstaged: [] })
                },
            })

            gitStore.watchFolder()
            await explorerStore.openFolder()
            await new Promise((resolve) => setTimeout(resolve, 0))

            expect(statusCalls).toBeGreaterThan(0)
        })
    })
})