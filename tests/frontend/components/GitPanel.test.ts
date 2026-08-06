import { describe, it, expect, afterEach, vi } from 'vitest'
import { get } from 'svelte/store'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

const {
    mockGitState,
    mockExplorerState,
    mockRefresh,
    mockStage,
    mockUnstage,
    mockStageAll,
    mockUnstageAll,
    mockCommit,
    mockSetCommitMessage,
    mockInitRepo,
    mockConfigureIdentity,
    mockSetRemote,
    mockDiscard,
    mockPush,
    mockPull,
    mockSync,
} = vi.hoisted(() => ({
    mockGitState: {
        isRepo: false,
        branch: null as string | null,
        staged: [] as Array<{ path: string; status: string }>,
        unstaged: [] as Array<{ path: string; status: string }>,
        loading: false,
        error: null as string | null,
        commitMessage: '',
        needsIdentity: false,
        notice: null as { type: 'success' | 'error'; message: string } | null,
        remoteUrl: null as string | null,
        ahead: 0,
        behind: 0,
    },
    mockExplorerState: {
        folder: null as { name: string; path: string } | null,
    },
    mockRefresh: vi.fn(),
    mockStage: vi.fn(),
    mockUnstage: vi.fn(),
    mockStageAll: vi.fn(),
    mockUnstageAll: vi.fn(),
    mockCommit: vi.fn(),
    mockSetCommitMessage: vi.fn(),
    mockInitRepo: vi.fn(),
    mockConfigureIdentity: vi.fn(),
    mockSetRemote: vi.fn().mockResolvedValue(true),
    mockDiscard: vi.fn(),
    mockPush: vi.fn(),
    mockPull: vi.fn(),
    mockSync: vi.fn(),
}))

vi.mock('../../../src/integrations/git/gitStore', () => ({
    gitStore: {
        subscribe: (fn: (v: typeof mockGitState) => void) => {
            fn(mockGitState)
            return () => { }
        },
        refresh: mockRefresh,
        stage: mockStage,
        unstage: mockUnstage,
        stageAll: mockStageAll,
        unstageAll: mockUnstageAll,
        commit: mockCommit,
        setCommitMessage: mockSetCommitMessage,
        initRepo: mockInitRepo,
        configureIdentity: mockConfigureIdentity,
        setRemote: mockSetRemote,
        discard: mockDiscard,
        push: mockPush,
        pull: mockPull,
        sync: mockSync,
    },
}))

vi.mock('../../../src/project/explorerStore', () => ({
    explorerStore: {
        subscribe: (fn: (v: typeof mockExplorerState) => void) => {
            fn(mockExplorerState)
            return () => { }
        },
    },
}))

import GitPanel from '../../../src/integrations/git/GitPanel.svelte'
import { settingsStore } from '../../../src/settings/settingsStore'
import { diffTabStore } from '../../../src/editor/diffTabs'

afterEach(() => {
    cleanup()
    mockGitState.isRepo = false
    mockGitState.branch = null
    mockGitState.staged = []
    mockGitState.unstaged = []
    mockGitState.loading = false
    mockGitState.error = null
    mockGitState.commitMessage = ''
    mockGitState.needsIdentity = false
    mockGitState.notice = null
    mockGitState.remoteUrl = null
    mockGitState.ahead = 0
    mockGitState.behind = 0
    mockExplorerState.folder = null
    settingsStore.updateSetting('gitAutoStageOnCommit', 'ask')
    diffTabStore.reset()
    vi.clearAllMocks()
})

describe('GitPanel', () => {
    it('calls gitStore.refresh on mount', () => {
        render(GitPanel)
        expect(mockRefresh).toHaveBeenCalled()
    })

    it('shows the no-folder message when no folder is open', () => {
        const { getByText } = render(GitPanel)
        expect(getByText('Open a folder to use Git.')).toBeInTheDocument()
    })

    it('shows the not-a-repo state with an init button', async () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        const { getByText } = render(GitPanel)
        expect(
            getByText('This folder is not a Git repository.'),
        ).toBeInTheDocument()
        await fireEvent.click(getByText('Initialize Repository'))
        expect(mockInitRepo).toHaveBeenCalled()
    })

    it('shows the branch name and file lists for a repo', () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        mockGitState.isRepo = true
        mockGitState.branch = 'main'
        mockGitState.staged = [{ path: 'main.pas', status: 'added' }]
        mockGitState.unstaged = [{ path: 'utils.pas', status: 'modified' }]
        const { getByText } = render(GitPanel)
        expect(getByText('main')).toBeInTheDocument()
        expect(getByText('main.pas')).toBeInTheDocument()
        expect(getByText('utils.pas')).toBeInTheDocument()
    })

    it('shows the clean message when there are no changes', () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        mockGitState.isRepo = true
        const { getByText } = render(GitPanel)
        expect(getByText('No changes.')).toBeInTheDocument()
    })

    it('stages a file when its + button is clicked', async () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        mockGitState.isRepo = true
        mockGitState.unstaged = [{ path: 'utils.pas', status: 'modified' }]
        const { getByTitle } = render(GitPanel)
        await fireEvent.click(getByTitle('Stage'))
        expect(mockStage).toHaveBeenCalledWith('utils.pas')
    })

    it('unstages a file when its − button is clicked', async () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        mockGitState.isRepo = true
        mockGitState.staged = [{ path: 'main.pas', status: 'added' }]
        const { getByTitle } = render(GitPanel)
        await fireEvent.click(getByTitle('Unstage'))
        expect(mockUnstage).toHaveBeenCalledWith('main.pas')
    })

    it('stages all when "Stage All" is clicked', async () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        mockGitState.isRepo = true
        mockGitState.unstaged = [{ path: 'utils.pas', status: 'modified' }]
        const { getByTitle } = render(GitPanel)
        await fireEvent.click(getByTitle('Stage All'))
        expect(mockStageAll).toHaveBeenCalled()
    })

    it('disables the commit button when there is nothing staged or unstaged', () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        mockGitState.isRepo = true
        const { getByText } = render(GitPanel)
        expect(getByText('Commit')).toBeDisabled()
    })

    it('enables and calls commit directly when staged files and a message are present', async () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        mockGitState.isRepo = true
        mockGitState.staged = [{ path: 'main.pas', status: 'added' }]
        mockGitState.commitMessage = 'Initial commit'
        const { getByText } = render(GitPanel)
        const commitBtn = getByText('Commit')
        expect(commitBtn).not.toBeDisabled()
        await fireEvent.click(commitBtn)
        expect(mockCommit).toHaveBeenCalled()
    })

    it('shows the identity form instead of the commit button when needed', () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        mockGitState.isRepo = true
        mockGitState.needsIdentity = true
        const { getByText, queryByText } = render(GitPanel)
        expect(getByText('Save and Commit')).toBeInTheDocument()
        expect(queryByText('Commit')).not.toBeInTheDocument()
    })

    it('shows a notice when present', () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        mockGitState.isRepo = true
        mockGitState.notice = {
            type: 'success',
            message: 'Commit created successfully.',
        }
        const { getByText } = render(GitPanel)
        expect(getByText('Commit created successfully.')).toBeInTheDocument()
    })

    describe('discard', () => {
        it('discards a file when its discard button is clicked and confirmed', async () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.unstaged = [{ path: 'utils.pas', status: 'modified' }]
            vi.spyOn(window, 'confirm').mockReturnValue(true)
            const { getByTitle } = render(GitPanel)
            await fireEvent.click(getByTitle('Discard changes'))
            expect(mockDiscard).toHaveBeenCalledWith('utils.pas', false)
        })

        it('does not discard when the confirmation is declined', async () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.unstaged = [{ path: 'utils.pas', status: 'modified' }]
            vi.spyOn(window, 'confirm').mockReturnValue(false)
            const { getByTitle } = render(GitPanel)
            await fireEvent.click(getByTitle('Discard changes'))
            expect(mockDiscard).not.toHaveBeenCalled()
        })

        it('passes isUntracked true for untracked files', async () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.unstaged = [{ path: 'new.pas', status: 'untracked' }]
            vi.spyOn(window, 'confirm').mockReturnValue(true)
            const { getByTitle } = render(GitPanel)
            await fireEvent.click(getByTitle('Discard changes'))
            expect(mockDiscard).toHaveBeenCalledWith('new.pas', true)
        })
    })

    describe('remote', () => {
        it('shows the missing-remote message and a link form when there is no remote', () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            const { getByText, getByPlaceholderText } = render(GitPanel)
            expect(getByText('Not linked to a remote repository')).toBeInTheDocument()
            expect(
                getByPlaceholderText('https://github.com/user/repo.git'),
            ).toBeInTheDocument()
        })

        it('shows the remote url when linked', () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.remoteUrl = 'https://github.com/user/repo.git'
            const { getByText, queryByText } = render(GitPanel)
            expect(getByText('https://github.com/user/repo.git')).toBeInTheDocument()
            expect(
                queryByText('Not linked to a remote repository'),
            ).not.toBeInTheDocument()
        })

        it('calls gitStore.setRemote with the typed url when Link is clicked', async () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            const { getByPlaceholderText, getByText } = render(GitPanel)
            const input = getByPlaceholderText('https://github.com/user/repo.git')
            await fireEvent.input(input, {
                target: { value: 'https://github.com/user/repo.git' },
            })
            await fireEvent.click(getByText('Link'))
            expect(mockSetRemote).toHaveBeenCalledWith(
                'https://github.com/user/repo.git',
            )
        })
    })

    describe('ahead/behind badges', () => {
        it('does not show badges when ahead and behind are zero', () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.remoteUrl = 'https://github.com/user/repo.git'
            const { queryByText } = render(GitPanel)
            expect(queryByText(/↓\d/)).not.toBeInTheDocument()
            expect(queryByText(/↑\d/)).not.toBeInTheDocument()
        })

        it('shows the behind badge', () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.behind = 2
            const { getByText } = render(GitPanel)
            expect(getByText('↓2')).toBeInTheDocument()
        })

        it('shows the ahead badge', () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.ahead = 3
            const { getByText } = render(GitPanel)
            expect(getByText('↑3')).toBeInTheDocument()
        })
    })

    describe('pull / push / sync', () => {
        it('disables pull, push, and sync when there is no remote', () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            const { getByTitle } = render(GitPanel)
            expect(getByTitle('Pull')).toBeDisabled()
            expect(getByTitle('Push')).toBeDisabled()
            expect(getByTitle('Sync')).toBeDisabled()
        })

        it('calls gitStore.pull/push/sync when their buttons are clicked', async () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.remoteUrl = 'https://github.com/user/repo.git'
            const { getByTitle } = render(GitPanel)

            await fireEvent.click(getByTitle('Pull'))
            expect(mockPull).toHaveBeenCalled()

            await fireEvent.click(getByTitle('Push'))
            expect(mockPush).toHaveBeenCalled()

            await fireEvent.click(getByTitle('Sync'))
            expect(mockSync).toHaveBeenCalled()
        })
    })

    describe('auto-stage prompt on commit', () => {
        it('shows the prompt when nothing is staged and mode is "ask" (default)', async () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.unstaged = [{ path: 'utils.pas', status: 'modified' }]
            mockGitState.commitMessage = 'fix: bug'
            const { getByText } = render(GitPanel)
            await fireEvent.click(getByText('Commit'))
            expect(
                getByText('Nothing is staged. Stage all changes and commit?'),
            ).toBeInTheDocument()
            expect(mockCommit).not.toHaveBeenCalled()
        })

        it('stages all and commits directly when mode is "always"', async () => {
            settingsStore.updateSetting('gitAutoStageOnCommit', 'always')
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.unstaged = [{ path: 'utils.pas', status: 'modified' }]
            mockGitState.commitMessage = 'fix: bug'
            const { getByText, queryByText } = render(GitPanel)
            await fireEvent.click(getByText('Commit'))
            expect(mockStageAll).toHaveBeenCalled()
            expect(mockCommit).toHaveBeenCalled()
            expect(
                queryByText('Nothing is staged. Stage all changes and commit?'),
            ).not.toBeInTheDocument()
        })

        it('does nothing when mode is "never"', async () => {
            settingsStore.updateSetting('gitAutoStageOnCommit', 'never')
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.unstaged = [{ path: 'utils.pas', status: 'modified' }]
            mockGitState.commitMessage = 'fix: bug'
            const { getByText } = render(GitPanel)
            await fireEvent.click(getByText('Commit'))
            expect(mockStageAll).not.toHaveBeenCalled()
            expect(mockCommit).not.toHaveBeenCalled()
        })

        it('choosing "Always" in the prompt stages, commits, and persists the setting', async () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.unstaged = [{ path: 'utils.pas', status: 'modified' }]
            mockGitState.commitMessage = 'fix: bug'
            const { getByText } = render(GitPanel)
            await fireEvent.click(getByText('Commit'))
            await fireEvent.click(getByText('Always'))

            expect(mockStageAll).toHaveBeenCalled()
            expect(mockCommit).toHaveBeenCalled()
            expect(get(settingsStore).gitAutoStageOnCommit).toBe('always')
        })

        it('choosing "Cancel" in the prompt does nothing', async () => {
            mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
            mockGitState.isRepo = true
            mockGitState.unstaged = [{ path: 'utils.pas', status: 'modified' }]
            mockGitState.commitMessage = 'fix: bug'
            const { getByText, queryByText } = render(GitPanel)
            await fireEvent.click(getByText('Commit'))
            await fireEvent.click(getByText('Cancel'))

            expect(mockStageAll).not.toHaveBeenCalled()
            expect(mockCommit).not.toHaveBeenCalled()
            expect(
                queryByText('Nothing is staged. Stage all changes and commit?'),
            ).not.toBeInTheDocument()
        })
    })
})