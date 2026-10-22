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
    })

    it('offers only English and Português (Brasil)', () => {
        const { getAllByRole, queryByText } = render(LanguageSettings)
        expect(getAllByRole('button')).toHaveLength(2)
        expect(queryByText('Español (Latinoamérica)')).toBeNull()
        expect(queryByText('Polski')).toBeNull()
    })

    it('marks the current locale as active', () => {
        localeStore.set('pt-BR')
        const { getByText } = render(LanguageSettings)
        expect(getByText('Português (Brasil)').closest('button')).toHaveClass('active')
    })

    it('changes locale when an option is clicked', async () => {
        const { getByText } = render(LanguageSettings)
        await fireEvent.click(getByText('Português (Brasil)'))
        expect(get(localeStore)).toBe('pt-BR')
    })
})