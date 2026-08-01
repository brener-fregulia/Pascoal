import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import Tab from '../../../src/shared/Tab.svelte'

afterEach(() => cleanup())

describe('Tab', () => {
    it('renders the label', () => {
        const { getByText } = render(Tab, { props: { label: 'main.pas' } })
        expect(getByText('main.pas')).toBeInTheDocument()
    })

    it('prefixes the label with a dot when dirty', () => {
        const { getByText } = render(Tab, {
            props: { label: 'main.pas', isDirty: true },
        })
        expect(getByText('● main.pas')).toBeInTheDocument()
    })

    it('does not prefix the label when not dirty', () => {
        const { queryByText } = render(Tab, {
            props: { label: 'main.pas', isDirty: false },
        })
        expect(queryByText('● main.pas')).not.toBeInTheDocument()
    })

    it('applies the active class when active is true', () => {
        const { getByRole } = render(Tab, {
            props: { label: 'main.pas', active: true },
        })
        expect(getByRole('tab')).toHaveClass('active')
    })

    it('does not render a close button by default', () => {
        const { queryByLabelText } = render(Tab, { props: { label: 'main.pas' } })
        expect(queryByLabelText('Close main.pas')).not.toBeInTheDocument()
    })

    it('renders a close button when closable is true', () => {
        const { getByLabelText } = render(Tab, {
            props: { label: 'main.pas', closable: true },
        })
        expect(getByLabelText('Close main.pas')).toBeInTheDocument()
    })

    it('calls onClose when the close button is clicked', async () => {
        const onClose = vi.fn()
        const { getByLabelText } = render(Tab, {
            props: { label: 'main.pas', closable: true, onClose },
        })
        await fireEvent.click(getByLabelText('Close main.pas'))
        expect(onClose).toHaveBeenCalledTimes(1)
    })
})