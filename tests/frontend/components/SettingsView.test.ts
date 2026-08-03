import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import SettingsView from '../../../src/settings/SettingsView.svelte'

afterEach(() => cleanup())

describe('SettingsView', () => {
    it('shows the Themes content by default', () => {
        const { container } = render(SettingsView, { props: { onClose: vi.fn() } })
        expect(container.querySelector('#settings-content')?.textContent).toContain('Themes')
    })

    it('groups Themes and Language under General in the sidebar', () => {
        const { container } = render(SettingsView, { props: { onClose: vi.fn() } })
        const nav = container.querySelector('#settings-nav')
        expect(nav?.textContent).toContain('General')
        expect(nav?.textContent).toContain('Themes')
        expect(nav?.textContent).toContain('Language')
    })

    it('renders Git and Toolchain as standalone items in the sidebar', () => {
        const { container } = render(SettingsView, { props: { onClose: vi.fn() } })
        const nav = container.querySelector('#settings-nav')
        expect(nav?.textContent).toContain('Git')
        expect(nav?.textContent).toContain('Toolchain')
    })

    it('switches to the Language page when clicked', async () => {
        const { container, getByText } = render(SettingsView, { props: { onClose: vi.fn() } })
        await fireEvent.click(getByText('Language'))
        expect(container.querySelector('#settings-content')?.textContent).toContain('English')
    })

    it('switches to the Git page when clicked', async () => {
        const { container, getByText } = render(SettingsView, { props: { onClose: vi.fn() } })
        await fireEvent.click(getByText('Git'))
        expect(container.querySelector('#settings-content')?.textContent).toContain(
            'Open a project folder',
        )
    })

    it('switches to the Toolchain page when clicked', async () => {
        vi.stubGlobal('__TAURI__', {
            core: {
                invoke: vi.fn().mockResolvedValue({
                    fpc: { installed: true, version: '3.2.2', path: '/usr/bin/fpc' },
                    git: { installed: true, version: '2.43.0', path: '/usr/bin/git' },
                }),
            },
        })

        const { container, getByText, findByText } = render(SettingsView, {
            props: { onClose: vi.fn() },
        })
        await fireEvent.click(getByText('Toolchain'))
        await findByText('Free Pascal Compiler')

        expect(container.querySelector('#settings-content')?.textContent).toContain(
            'Free Pascal Compiler',
        )

        vi.unstubAllGlobals()
    })

    it('calls onClose when the close button is clicked', async () => {
        const onClose = vi.fn()
        const { getByLabelText } = render(SettingsView, { props: { onClose } })
        await fireEvent.click(getByLabelText('Close'))
        expect(onClose).toHaveBeenCalled()
    })
})