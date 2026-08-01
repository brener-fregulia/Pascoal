import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import AboutModal from '../../../src/app/AboutModal.svelte'

afterEach(() => cleanup())

describe('AboutModal', () => {
    it('renders nothing when open is false', () => {
        const { container } = render(AboutModal, { props: { open: false } })
        expect(container.querySelector('.about-modal')).toBeNull()
    })

    it('renders the dialog when open is true', () => {
        const { container } = render(AboutModal, { props: { open: true } })
        expect(container.querySelector('.about-modal')).toBeInTheDocument()
    })

    it('closes when the close button is clicked', async () => {
        const { container } = render(AboutModal, { props: { open: true } })
        const closeBtn = container.querySelector('.about-close') as HTMLElement
        await fireEvent.click(closeBtn)
        expect(container.querySelector('.about-modal')).toBeNull()
    })

    it('closes when clicking the backdrop', async () => {
        const { container } = render(AboutModal, { props: { open: true } })
        const backdrop = container.querySelector('.about-backdrop') as HTMLElement
        await fireEvent.click(backdrop)
        expect(container.querySelector('.about-modal')).toBeNull()
    })

    it('does not close when clicking inside the modal itself', async () => {
        const { container } = render(AboutModal, { props: { open: true } })
        const modal = container.querySelector('.about-modal') as HTMLElement
        await fireEvent.click(modal)
        expect(container.querySelector('.about-modal')).toBeInTheDocument()
    })

    it('closes on Escape key', async () => {
        const { container } = render(AboutModal, { props: { open: true } })
        await fireEvent.keyDown(window, { key: 'Escape' })
        expect(container.querySelector('.about-modal')).toBeNull()
    })

    it('shows a fallback dash for platform when appStore has no info yet', () => {
        const { getByText } = render(AboutModal, { props: { open: true } })
        expect(getByText('—')).toBeInTheDocument()
    })
})