import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import Statusbar from '../../../src/app/Statusbar.svelte'
import { themeStore } from '../../../src/shared/theme'
import { fpcInstallStore } from '../../../src/toolchain/fpcInstall'

afterEach(() => cleanup())

describe('Statusbar', () => {
    beforeEach(() => {
        themeStore.apply('dark')
        fpcInstallStore.hide()
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
})