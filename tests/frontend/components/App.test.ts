import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import App from '../../../src/App.svelte'

beforeEach(() => {
    localStorage.clear()
})

afterEach(() => {
    cleanup()
    document.documentElement.removeAttribute('data-theme')
})

async function flushMount() {
    // onMount is async (themeStore.init -> appStore.init -> whatsNewStore.
    // checkAfterUpdate -> the isTauriAvailable() gate) - give it a chance
    // to settle before asserting on anything it sets up.
    await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('App', () => {
    it('renders the shell', () => {
        const { container } = render(App)
        expect(container.querySelector('#titlebar')).toBeInTheDocument()
        expect(container.querySelector('#activity-bar')).toBeInTheDocument()
        expect(container.querySelector('#statusbar')).toBeInTheDocument()
    })

    it('shows Welcome by default with no open tabs', () => {
        const { container } = render(App)
        expect(container.querySelector('#welcome')).toBeInTheDocument()
    })

    it('sets the data-theme attribute on the document root', async () => {
        render(App)
        await flushMount()
        expect(document.documentElement.getAttribute('data-theme')).toBeTruthy()
    })

    it('automatically shows the FPC-missing modal when FPC is not detected', async () => {
        const { findByText } = render(App)
        expect(
            await findByText(
                'No FPC installation was found on this machine. Would you like to install it now?',
            ),
        ).toBeInTheDocument()
    })
})