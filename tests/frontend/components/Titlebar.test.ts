import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'

const { mockAppState } = vi.hoisted(() => ({
    mockAppState: {
        info: { platform: 'linux' } as { platform: string } | null,
        loading: false,
    },
}))

vi.mock('../../../src/app/app', () => ({
    appStore: {
        subscribe: (fn: (v: typeof mockAppState) => void) => {
            fn(mockAppState)
            return () => { }
        },
        init: vi.fn(),
    },
}))

vi.mock('../../../src/project/recentWorkspaces', () => ({
    recentWorkspacesStore: {
        subscribe: (fn: (v: never[]) => void) => {
            fn([])
            return () => { }
        },
    },
}))

import Titlebar from '../../../src/app/Titlebar.svelte'

afterEach(() => {
    cleanup()
    mockAppState.info = { platform: 'linux' }
    vi.clearAllMocks()
        ; (window as any).__TAURI__ = undefined
})

describe('Titlebar', () => {
    it('renders the Menu bar', () => {
        const { getByText } = render(Titlebar)
        expect(getByText('File')).toBeInTheDocument()
        expect(getByText('Edit')).toBeInTheDocument()
        expect(getByText('Help')).toBeInTheDocument()
    })

    describe('on a non-macOS platform', () => {
        it('shows the Windows/Linux window controls, not the mac traffic lights', () => {
            mockAppState.info = { platform: 'windows' }
            const { container } = render(Titlebar)
            expect(container.querySelector('.win-group')).toBeInTheDocument()
            expect(container.querySelector('.mac-group')).not.toBeInTheDocument()
        })

        it('does not add the mac class to the titlebar', () => {
            mockAppState.info = { platform: 'windows' }
            const { container } = render(Titlebar)
            expect(container.querySelector('#titlebar')).not.toHaveClass('mac')
        })
    })

    describe('on macOS', () => {
        it('shows the mac traffic-light controls, not the Windows/Linux window group', () => {
            mockAppState.info = { platform: 'macos' }
            const { container } = render(Titlebar)
            expect(container.querySelector('.mac-group')).toBeInTheDocument()
            expect(container.querySelector('.win-group')).not.toBeInTheDocument()
        })

        it('adds the mac class to the titlebar', () => {
            mockAppState.info = { platform: 'macos' }
            const { container } = render(Titlebar)
            expect(container.querySelector('#titlebar')).toHaveClass('mac')
        })
    })
})
