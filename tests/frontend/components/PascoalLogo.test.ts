import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import PascoalLogo from '../../../src/shared/PascoalLogo.svelte'
import { themeStore } from '../../../src/shared/theme'

afterEach(() => cleanup())

describe('PascoalLogo', () => {
    it('renders an image with the Pascoal alt text', () => {
        const { getByAltText } = render(PascoalLogo)
        expect(getByAltText('Pascoal')).toBeInTheDocument()
    })

    it('applies the default height when none is given', () => {
        const { getByAltText } = render(PascoalLogo)
        expect(getByAltText('Pascoal')).toHaveAttribute('height', '32')
    })

    it('applies a custom height when given', () => {
        const { getByAltText } = render(PascoalLogo, { props: { height: 48 } })
        expect(getByAltText('Pascoal')).toHaveAttribute('height', '48')
    })

    it('applies the dark filter class for the dark theme', () => {
        themeStore.apply('dark')
        const { getByAltText } = render(PascoalLogo)
        expect(getByAltText('Pascoal')).toHaveClass('dark')
    })

    it('applies the dark filter class for the charcoal theme too', () => {
        themeStore.apply('charcoal')
        const { getByAltText } = render(PascoalLogo)
        expect(getByAltText('Pascoal')).toHaveClass('dark')
    })

    it('does not apply the dark filter class for the light theme', () => {
        themeStore.apply('light')
        const { getByAltText } = render(PascoalLogo)
        expect(getByAltText('Pascoal')).not.toHaveClass('dark')
    })
})