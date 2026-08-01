import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

const { mockUpdateState, mockDismiss, mockInstallUpdate } = vi.hoisted(() => ({
    mockUpdateState: {
        status: 'idle' as string,
        version: null as string | null,
        notes: null as string | null,
        progress: 0,
        error: null as string | null,
    },
    mockDismiss: vi.fn(),
    mockInstallUpdate: vi.fn(),
}))

vi.mock('../../../src/integrations/updater/updateStore', () => ({
    updateStore: {
        subscribe: (fn: (v: typeof mockUpdateState) => void) => {
            fn(mockUpdateState)
            return () => { }
        },
        dismiss: mockDismiss,
        installUpdate: mockInstallUpdate,
    },
}))

import UpdateAvailableModal from '../../../src/app/UpdateAvailableModal.svelte'

afterEach(() => {
    cleanup()
    mockUpdateState.status = 'idle'
    mockUpdateState.version = null
    mockUpdateState.notes = null
    mockUpdateState.progress = 0
    vi.clearAllMocks()
})

describe('UpdateAvailableModal', () => {
    it('renders nothing when status is idle', () => {
        const { container } = render(UpdateAvailableModal)
        expect(container.querySelector('.upd-modal')).toBeNull()
    })

    it('shows the available message with the version when a new version is found', () => {
        mockUpdateState.status = 'available'
        mockUpdateState.version = '2026.3.0'
        const { getByText } = render(UpdateAvailableModal)
        expect(
            getByText('A new version (2026.3.0) is available. Would you like to update now?'),
        ).toBeInTheDocument()
    })

    it('shows the translated notes when present', () => {
        mockUpdateState.status = 'available'
        mockUpdateState.version = '2026.3.0'
        mockUpdateState.notes = 'A nice friendly summary.'
        const { getByText } = render(UpdateAvailableModal)
        expect(getByText('A nice friendly summary.')).toBeInTheDocument()
    })

    it('shows a progress bar while downloading and hides the close button', () => {
        mockUpdateState.status = 'downloading'
        mockUpdateState.progress = 42
        const { getByText, queryByLabelText } = render(UpdateAvailableModal)
        expect(getByText('Downloading update…')).toBeInTheDocument()
        expect(queryByLabelText('Close')).not.toBeInTheDocument()
    })

    it('shows the error message and retry/download actions on error', () => {
        mockUpdateState.status = 'error'
        const { getByText } = render(UpdateAvailableModal)
        expect(
            getByText('Update failed. You can retry or download it manually.'),
        ).toBeInTheDocument()
        expect(getByText('Retry')).toBeInTheDocument()
        expect(getByText('Download manually')).toBeInTheDocument()
    })

    it('calls installUpdate when "Update now" is clicked', async () => {
        mockUpdateState.status = 'available'
        mockUpdateState.version = '2026.3.0'
        const { getByText } = render(UpdateAvailableModal)
        await fireEvent.click(getByText('Update now'))
        expect(mockInstallUpdate).toHaveBeenCalled()
    })

    it('calls dismiss when "Later" is clicked', async () => {
        mockUpdateState.status = 'available'
        mockUpdateState.version = '2026.3.0'
        const { getByText } = render(UpdateAvailableModal)
        await fireEvent.click(getByText('Later'))
        expect(mockDismiss).toHaveBeenCalled()
    })

    it('does not dismiss when downloading and the close attempt happens via Escape', async () => {
        mockUpdateState.status = 'downloading'
        render(UpdateAvailableModal)
        await fireEvent.keyDown(window, { key: 'Escape' })
        expect(mockDismiss).not.toHaveBeenCalled()
    })
})