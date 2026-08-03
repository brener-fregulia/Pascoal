import { describe, it, expect, afterEach } from 'vitest'
import { get } from 'svelte/store'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import ThemesSettings from '../../../src/settings/ThemesSettings.svelte'
import { themeStore } from '../../../src/shared/theme'

afterEach(() => cleanup())

describe('ThemesSettings', () => {
    it('renders all three theme options', () => {
        const { getByText } = render(ThemesSettings)
        expect(getByText('Dark')).toBeInTheDocument()
        expect(getByText('Light')).toBeInTheDocument()
        expect(getByText('Charcoal')).toBeInTheDocument()
    })

    it('marks the current theme as active', () => {
        themeStore.apply('light')
        const { getByText } = render(ThemesSettings)
        expect(getByText('Light').closest('button')).toHaveClass('active')
    })

    it('applies the theme when an option is clicked', async () => {
        themeStore.apply('dark')
        const { getByText } = render(ThemesSettings)
        await fireEvent.click(getByText('Charcoal'))
        expect(get(themeStore).current).toBe('charcoal')
    })
})