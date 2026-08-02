import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import ActivityBar from '../../../src/app/ActivityBar.svelte'

afterEach(() => cleanup())

describe('ActivityBar', () => {
    it('renders the Explorer and Search buttons', () => {
        const { getByLabelText } = render(ActivityBar, {
            props: { activePanel: null },
        })
        expect(getByLabelText('Explorer')).toBeInTheDocument()
        expect(getByLabelText('Search')).toBeInTheDocument()
    })

    it('marks the active panel button as active', () => {
        const { getByLabelText } = render(ActivityBar, {
            props: { activePanel: 'explorer' },
        })
        expect(getByLabelText('Explorer')).toHaveClass('active')
        expect(getByLabelText('Search')).not.toHaveClass('active')
    })

    it('does not mark any button active when activePanel is null', () => {
        const { getByLabelText } = render(ActivityBar, {
            props: { activePanel: null },
        })
        expect(getByLabelText('Explorer')).not.toHaveClass('active')
    })
})