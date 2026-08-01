import { describe, it, expect, afterEach, vi } from 'vitest'
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
    mockExplorerState.folder = null
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

    it('disables the commit button when there is nothing staged', () => {
        mockExplorerState.folder = { name: 'MyProject', path: '/tmp' }
        mockGitState.isRepo = true
        const { getByText } = render(GitPanel)
        expect(getByText('Commit')).toBeDisabled()
    })

    it('enables and calls commit when staged files and a message are present', async () => {
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
})