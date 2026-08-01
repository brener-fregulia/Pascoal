import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import PanelHeader from '../../../src/shared/PanelHeader.svelte'

afterEach(() => cleanup())

describe('PanelHeader', () => {
    it('renders the given title', () => {
        const { getByText } = render(PanelHeader, {
            props: { title: 'Explorer' },
        })
        expect(getByText('Explorer')).toBeInTheDocument()
    })
})