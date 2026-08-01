import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

const { mockWhatsNewState, mockDismiss } = vi.hoisted(() => ({
    mockWhatsNewState: {
        show: false,
        version: null as string | null,
        note: null as string | null,
    },
    mockDismiss: vi.fn(),
}))

vi.mock('../../../src/app/whatsNew', () => ({
    whatsNewStore: {
        subscribe: (fn: (v: typeof mockWhatsNewState) => void) => {
            fn(mockWhatsNewState)
            return () => { }
        },
        dismiss: mockDismiss,
    },
}))

import WhatsNewModal from '../../../src/app/WhatsNewModal.svelte'

afterEach(() => {
    cleanup()
    mockWhatsNewState.show = false
    mockWhatsNewState.version = null
    mockWhatsNewState.note = null
    vi.clearAllMocks()
})

describe('WhatsNewModal', () => {
    it('renders nothing when show is false', () => {
        const onViewHistory = vi.fn()
        const { container } = render(WhatsNewModal, { props: { onViewHistory } })
        expect(container.querySelector('.wn-modal')).toBeNull()
    })

    it('shows the version and note when show is true', () => {
        mockWhatsNewState.show = true
        mockWhatsNewState.version = '2026.2.1'
        mockWhatsNewState.note = 'A nice friendly summary.'
        const onViewHistory = vi.fn()
        const { getByText } = render(WhatsNewModal, { props: { onViewHistory } })
        expect(getByText("What's new — 2026.2.1")).toBeInTheDocument()
        expect(getByText('A nice friendly summary.')).toBeInTheDocument()
    })

    it('calls dismiss when the primary close button is clicked', async () => {
        mockWhatsNewState.show = true
        const onViewHistory = vi.fn()
        const { getByText } = render(WhatsNewModal, { props: { onViewHistory } })
        await fireEvent.click(getByText('Got it'))
        expect(mockDismiss).toHaveBeenCalled()
    })

    it('calls dismiss and onViewHistory when "Version history" is clicked', async () => {
        mockWhatsNewState.show = true
        const onViewHistory = vi.fn()
        const { getByText } = render(WhatsNewModal, { props: { onViewHistory } })
        await fireEvent.click(getByText('Version history'))
        expect(mockDismiss).toHaveBeenCalled()
        expect(onViewHistory).toHaveBeenCalled()
    })
})