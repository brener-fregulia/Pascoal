import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import IconButton from '../../../src/shared/IconButton.svelte'

afterEach(() => cleanup())

describe('IconButton', () => {
    it('renders with an accessible label', () => {
        const { getByLabelText } = render(IconButton, {
            props: { label: 'Save' },
        })
        expect(getByLabelText('Save')).toBeInTheDocument()
    })

    it('applies the active class when active is true', () => {
        const { getByLabelText } = render(IconButton, {
            props: { label: 'Save', active: true },
        })
        expect(getByLabelText('Save')).toHaveClass('active')
    })

    it('does not apply the active class by default', () => {
        const { getByLabelText } = render(IconButton, {
            props: { label: 'Save' },
        })
        expect(getByLabelText('Save')).not.toHaveClass('active')
    })

    it('applies the requested variant class', () => {
        const { getByLabelText } = render(IconButton, {
            props: { label: 'New file', variant: 'welcome' },
        })
        expect(getByLabelText('New file')).toHaveClass('welcome')
    })

    it('shows the label text only in the welcome variant', () => {
        const { getByText } = render(IconButton, {
            props: { label: 'New file', variant: 'welcome' },
        })
        expect(getByText('New file')).toBeInTheDocument()
    })

    it('does not show label text in the activity variant', () => {
        const { queryByText } = render(IconButton, {
            props: { label: 'New file', variant: 'activity' },
        })
        expect(queryByText('New file')).not.toBeInTheDocument()
    })
})