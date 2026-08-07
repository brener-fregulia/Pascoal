import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte'
import GitSettings from '../../../src/settings/GitSettings.svelte'
import { explorerStore } from '../../../src/project/explorerStore'

const MOCK_FOLDER = { name: 'MyProject', path: '/home/user/MyProject' }

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

beforeEach(() => {
    explorerStore.reset()
})

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})

describe('GitSettings', () => {
    it('shows the hint and no scope tabs when no folder is open', () => {
        const { getByText, queryByText } = render(GitSettings)
        expect(
            getByText('Open a project folder to set a project-specific identity.'),
        ).toBeInTheDocument()
        expect(queryByText('MyProject')).not.toBeInTheDocument()
    })

    it('shows User and the folder name as tabs when a folder is open', async () => {
        await openMockFolder()
        mockTauri({
            git_check_global_identity: () => Promise.resolve({ name: null, email: null }),
        })

        const { getByText } = render(GitSettings)

        expect(getByText('User')).toBeInTheDocument()
        expect(getByText('MyProject')).toBeInTheDocument()
    })

    it('loads the global identity into the fields on mount', async () => {
        mockTauri({
            git_check_global_identity: () =>
                Promise.resolve({ name: 'Test User', email: 'test@example.com' }),
        })

        const { getByLabelText } = render(GitSettings)

        await waitFor(() => {
            expect(getByLabelText('Name')).toHaveValue('Test User')
            expect(getByLabelText('Email')).toHaveValue('test@example.com')
        })
    })

    it('loads the local identity when switching to the workspace tab', async () => {
        await openMockFolder()
        mockTauri({
            git_check_global_identity: () =>
                Promise.resolve({ name: 'Global User', email: 'global@example.com' }),
            git_check_local_identity: () =>
                Promise.resolve({ name: 'Project User', email: 'project@example.com' }),
        })

        const { getByText, getByLabelText } = render(GitSettings)
        await waitFor(() => expect(getByLabelText('Name')).toHaveValue('Global User'))

        await fireEvent.click(getByText('MyProject'))

        await waitFor(() => {
            expect(getByLabelText('Name')).toHaveValue('Project User')
            expect(getByLabelText('Email')).toHaveValue('project@example.com')
        })
    })

    it('saves the global identity on blur', async () => {
        let saved: unknown = null
        mockTauri({
            git_check_global_identity: () => Promise.resolve({ name: null, email: null }),
            git_set_global_identity: (args: unknown) => {
                saved = args
                return Promise.resolve()
            },
        })

        const { getByLabelText } = render(GitSettings)
        await waitFor(() => expect(getByLabelText('Name')).toHaveValue(''))

        await fireEvent.input(getByLabelText('Name'), { target: { value: 'New Name' } })
        await fireEvent.blur(getByLabelText('Name'))

        await waitFor(() => {
            expect(saved).toEqual({ name: 'New Name', email: '' })
        })
    })

    it('saves the workspace identity on blur, scoped to the open folder', async () => {
        await openMockFolder()
        let saved: unknown = null
        mockTauri({
            git_check_global_identity: () => Promise.resolve({ name: null, email: null }),
            git_check_local_identity: () => Promise.resolve({ name: null, email: null }),
            git_set_identity: (args: unknown) => {
                saved = args
                return Promise.resolve()
            },
        })

        const { getByText, getByLabelText } = render(GitSettings)
        await waitFor(() => expect(getByLabelText('Name')).toHaveValue(''))

        await fireEvent.click(getByText('MyProject'))
        await waitFor(() => expect(getByLabelText('Name')).toHaveValue(''))

        await fireEvent.input(getByLabelText('Email'), {
            target: { value: 'new@example.com' },
        })
        await fireEvent.blur(getByLabelText('Email'))

        await waitFor(() => {
            expect(saved).toEqual({
                folderPath: MOCK_FOLDER.path,
                name: '',
                email: 'new@example.com',
                global: false,
            })
        })
    })

    it('shows an error message when saving fails', async () => {
        mockTauri({
            git_check_global_identity: () => Promise.resolve({ name: null, email: null }),
            git_set_global_identity: () => Promise.reject(new Error('config write failed')),
        })

        const { getByLabelText, findByText } = render(GitSettings)
        await waitFor(() => expect(getByLabelText('Name')).toHaveValue(''))

        await fireEvent.input(getByLabelText('Name'), { target: { value: 'X' } })
        await fireEvent.blur(getByLabelText('Name'))

        expect(await findByText('config write failed')).toBeInTheDocument()
    })
})