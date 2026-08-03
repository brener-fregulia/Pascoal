import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import LanguageSettings from '../../../src/settings/LanguageSettings.svelte'
import { localeStore } from '../../../src/i18n'

beforeEach(() => localeStore.set('en'))
afterEach(() => cleanup())

describe('LanguageSettings', () => {
    it('renders all locale options', () => {
        const { getByText } = render(LanguageSettings)
        expect(getByText('English')).toBeInTheDocument()
        expect(getByText('Português (Brasil)')).toBeInTheDocument()
        expect(getByText('Español (Latinoamérica)')).toBeInTheDocument()
        expect(getByText('Polski')).toBeInTheDocument()
    })

    it('marks the current locale as active', () => {
        localeStore.set('pl')
        const { getByText } = render(LanguageSettings)
        expect(getByText('Polski').closest('button')).toHaveClass('active')
    })

    it('changes locale when an option is clicked', async () => {
        const { getByText } = render(LanguageSettings)
        await fireEvent.click(getByText('Polski'))
        expect(get(localeStore)).toBe('pl')
    })
})