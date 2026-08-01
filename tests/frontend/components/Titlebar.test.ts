import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import Titlebar from '../../../src/app/Titlebar.svelte'

afterEach(() => cleanup())

describe('Titlebar', () => {
    it('renders the File and Help menu triggers', () => {
        const { getByText } = render(Titlebar)
        expect(getByText('File')).toBeInTheDocument()
        expect(getByText('Help')).toBeInTheDocument()
    })

    it('does not show a dropdown before a menu is clicked', () => {
        const { queryByText } = render(Titlebar)
        expect(queryByText('New File')).not.toBeInTheDocument()
    })

    it('opens the File menu and shows its items', async () => {
        const { getByText } = render(Titlebar)
        await fireEvent.click(getByText('File'))
        expect(getByText('New File')).toBeInTheDocument()
        expect(getByText('Open File...')).toBeInTheDocument()
        expect(getByText('Save')).toBeInTheDocument()
    })

    it('toggles the menu closed when clicked again', async () => {
        const { getByText, queryByText } = render(Titlebar)
        await fireEvent.click(getByText('File'))
        await fireEvent.click(getByText('File'))
        expect(queryByText('New File')).not.toBeInTheDocument()
    })

    it('switches to the Help menu when clicked while File is open', async () => {
        const { getByText, queryByText } = render(Titlebar)
        await fireEvent.click(getByText('File'))
        await fireEvent.click(getByText('Help'))
        expect(queryByText('New File')).not.toBeInTheDocument()
        expect(getByText('About Pascoal')).toBeInTheDocument()
    })

    it('closes the menu on Escape', async () => {
        const { getByText, queryByText } = render(Titlebar)
        await fireEvent.click(getByText('File'))
        await fireEvent.keyDown(window, { key: 'Escape' })
        expect(queryByText('New File')).not.toBeInTheDocument()
    })

    it('closes the menu when an item is clicked', async () => {
        const { getByText, queryByText } = render(Titlebar)
        await fireEvent.click(getByText('File'))
        await fireEvent.click(getByText('New File'))
        expect(queryByText('New File')).not.toBeInTheDocument()
    })
})