import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

const { mockFpcState, mockHide, mockInstall } = vi.hoisted(() => ({
    mockFpcState: {
        visible: false,
        status: 'idle' as string,
        output: '',
        packageManager: null as string | null,
    },
    mockHide: vi.fn(),
    mockInstall: vi.fn(),
}))

vi.mock('../../../src/toolchain/fpcInstall', () => ({
    fpcInstallStore: {
        subscribe: (fn: (v: typeof mockFpcState) => void) => {
            fn(mockFpcState)
            return () => { }
        },
        hide: mockHide,
        install: mockInstall,
    },
}))

import FpcMissingModal from '../../../src/app/FpcMissingModal.svelte'

afterEach(() => {
    cleanup()
    mockFpcState.visible = false
    mockFpcState.status = 'idle'
    mockFpcState.output = ''
    mockFpcState.packageManager = null
    vi.clearAllMocks()
})

describe('FpcMissingModal', () => {
    it('renders nothing when the store is not visible', () => {
        const { container } = render(FpcMissingModal)
        expect(container.querySelector('.fpc-modal')).toBeNull()
    })

    it('renders the dialog when the store is visible', () => {
        mockFpcState.visible = true
        const { container } = render(FpcMissingModal)
        expect(container.querySelector('.fpc-modal')).toBeInTheDocument()
    })

    it('shows the install message in the idle state', () => {
        mockFpcState.visible = true
        const { getByText } = render(FpcMissingModal)
        expect(
            getByText(
                'No FPC installation was found on this machine. Would you like to install it now?',
            ),
        ).toBeInTheDocument()
    })

    it('shows the success message and no install button after success', () => {
        mockFpcState.visible = true
        mockFpcState.status = 'success'
        const { getByText, queryByText } = render(FpcMissingModal)
        expect(
            getByText('Free Pascal was installed successfully.'),
        ).toBeInTheDocument()
        expect(queryByText('Install')).not.toBeInTheDocument()
    })

    it('shows the error message after a failed install', () => {
        mockFpcState.visible = true
        mockFpcState.status = 'error'
        const { getByText } = render(FpcMissingModal)
        expect(
            getByText(
                'Installation failed. You can try again or install it manually.',
            ),
        ).toBeInTheDocument()
    })

    it('hides the close button while installing', () => {
        mockFpcState.visible = true
        mockFpcState.status = 'installing'
        const { queryByLabelText } = render(FpcMissingModal)
        expect(queryByLabelText('Close')).not.toBeInTheDocument()
    })

    it('calls install when the install button is clicked', async () => {
        mockFpcState.visible = true
        mockFpcState.packageManager = 'winget'
        const { getByText } = render(FpcMissingModal)
        await fireEvent.click(getByText('Install'))
        expect(mockInstall).toHaveBeenCalled()
    })

    it('closes when the close button is clicked in the idle state', async () => {
        mockFpcState.visible = true
        const { container } = render(FpcMissingModal)
        const closeBtn = container.querySelector('.fpc-close') as HTMLElement
        await fireEvent.click(closeBtn)
        expect(mockHide).toHaveBeenCalled()
    })

    it('closes on Escape key', async () => {
        mockFpcState.visible = true
        render(FpcMissingModal)
        await fireEvent.keyDown(window, { key: 'Escape' })
        expect(mockHide).toHaveBeenCalled()
    })
})