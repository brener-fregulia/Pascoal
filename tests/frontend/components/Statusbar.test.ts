import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import Statusbar from '../../../src/app/Statusbar.svelte'
import { themeStore } from '../../../src/shared/theme'
import { fpcInstallStore } from '../../../src/toolchain/fpcInstall'
import { consoleStore } from '../../../src/toolchain/console'
import { get } from 'svelte/store'

afterEach(() => cleanup())

describe('Statusbar', () => {
    beforeEach(() => {
        themeStore.apply('dark')
        fpcInstallStore.hide()
        consoleStore.reset()
    })

    it('shows the FPC-not-found label when appStore has no info yet', () => {
        const { getByText } = render(Statusbar)
        expect(getByText('FPC not found')).toBeInTheDocument()
    })

    it('shows the current theme name, capitalized', () => {
        const { getByText } = render(Statusbar)
        expect(getByText('Dark')).toBeInTheDocument()
    })

    it('opens the FPC install modal when the FPC button is clicked', async () => {
        const { getByText } = render(Statusbar)
        await fireEvent.click(getByText('FPC not found'))
        expect(fpcInstallStore).toBeDefined()
    })

    it('opens the locale picker when the language button is clicked', async () => {
        const { getByTitle, getByRole } = render(Statusbar)
        await fireEvent.click(getByTitle('Language / Idioma'))
        expect(getByRole('listbox')).toBeInTheDocument()
    })

    it('closes the locale picker on Escape', async () => {
        const { getByTitle, queryByRole } = render(Statusbar)
        await fireEvent.click(getByTitle('Language / Idioma'))
        await fireEvent.keyDown(window, { key: 'Escape' })
        expect(queryByRole('listbox')).not.toBeInTheDocument()
    })

    describe('run status', () => {
        it('shows nothing when idle', () => {
            const { queryByRole } = render(Statusbar)
            expect(queryByRole('status')).toBeNull()
        })

        it('shows compiling while the build is in progress', () => {
            consoleStore.resetBuild()
            const { getByRole } = render(Statusbar)
            expect(getByRole('status')).toHaveTextContent('Compiling...')
        })

        it('shows running only once the program is running', () => {
            consoleStore.setBuildStatus('success')
            const { queryByRole, rerender } = render(Statusbar)
            expect(queryByRole('status')).toBeNull()
            consoleStore.setRunning(true)
            return rerender({}).then(() => {
                expect(queryByRole('status')).toHaveTextContent('Running')
            })
        })

        it('shows build failed after an error and hides when a finished run succeeded', async () => {
            consoleStore.setBuildStatus('error')
            const { getByRole, queryByRole } = render(Statusbar)
            expect(getByRole('status')).toHaveTextContent('Build failed')
            consoleStore.setBuildStatus('success')
            await Promise.resolve()
            expect(queryByRole('status')).toBeNull()
        })

        it('shows run failed when a successful build exits with a non-zero code', () => {
            consoleStore.setBuildStatus('success')
            consoleStore.setExitCode(1)
            const { getByRole } = render(Statusbar)
            expect(getByRole('status')).toHaveTextContent('Run failed')
        })

        it('shows nothing when the run exits with code 0', () => {
            consoleStore.setBuildStatus('success')
            consoleStore.setExitCode(0)
            const { queryByRole } = render(Statusbar)
            expect(queryByRole('status')).toBeNull()
        })

        it('clears run failed when a new compilation starts', async () => {
            consoleStore.setBuildStatus('success')
            consoleStore.setExitCode(1)
            const { getByRole } = render(Statusbar)
            consoleStore.resetBuild()
            await Promise.resolve()
            expect(getByRole('status')).toHaveTextContent('Compiling...')
        })

        it('opens the console when the indicator is clicked', async () => {
            consoleStore.setBuildStatus('error')
            const { getByRole } = render(Statusbar)
            await fireEvent.click(getByRole('button', { name: /Compiling|Build failed/ }))
            expect(get(consoleStore).visible).toBe(true)
        })
    })
})
