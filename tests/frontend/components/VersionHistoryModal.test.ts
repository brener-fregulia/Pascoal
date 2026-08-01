import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

vi.mock('../../../src/i18n/release-notes', () => ({
    loadReleaseNoteHistory: vi.fn(),
}))

import VersionHistoryModal from '../../../src/app/VersionHistoryModal.svelte'
import { loadReleaseNoteHistory } from '../../../src/i18n/release-notes'

afterEach(() => cleanup())

describe('VersionHistoryModal', () => {
    it('renders nothing when open is false', () => {
        const { container } = render(VersionHistoryModal, {
            props: { open: false },
        })
        expect(container.querySelector('.vh-modal')).toBeNull()
    })

    it('shows a loading state before entries resolve', () => {
        vi.mocked(loadReleaseNoteHistory).mockReturnValue(new Promise(() => { }))
        const { getByText } = render(VersionHistoryModal, {
            props: { open: true },
        })
        expect(getByText('Loading…')).toBeInTheDocument()
    })

    it('shows the resolved entries', async () => {
        vi.mocked(loadReleaseNoteHistory).mockResolvedValue([
            { version: '2026.2.1', note: 'Latest note.' },
            { version: '2026.1.1', note: 'Older note.' },
        ])
        const { findByText } = render(VersionHistoryModal, {
            props: { open: true },
        })
        expect(await findByText('2026.2.1')).toBeInTheDocument()
        expect(await findByText('Latest note.')).toBeInTheDocument()
        expect(await findByText('2026.1.1')).toBeInTheDocument()
    })

    it('shows an empty state when there are no entries', async () => {
        vi.mocked(loadReleaseNoteHistory).mockResolvedValue([])
        const { findByText } = render(VersionHistoryModal, {
            props: { open: true },
        })
        expect(await findByText('No release notes yet.')).toBeInTheDocument()
    })

    it('closes when the close button is clicked', async () => {
        vi.mocked(loadReleaseNoteHistory).mockResolvedValue([])
        const { container, findByText } = render(VersionHistoryModal, {
            props: { open: true },
        })
        await findByText('No release notes yet.')
        const closeBtn = container.querySelector('.vh-close') as HTMLElement
        await fireEvent.click(closeBtn)
        expect(container.querySelector('.vh-modal')).toBeNull()
    })
})