import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import StageAllPromptModal from '../../../src/integrations/git/StageAllPromptModal.svelte'

afterEach(() => cleanup())

describe('StageAllPromptModal', () => {
    it('renders all four choices', () => {
        const { getByText } = render(StageAllPromptModal, { props: { onChoice: vi.fn() } })
        expect(getByText('Yes')).toBeInTheDocument()
        expect(getByText('Always')).toBeInTheDocument()
        expect(getByText('Never')).toBeInTheDocument()
        expect(getByText('Cancel')).toBeInTheDocument()
    })

    it('calls onChoice with "yes" when Yes is clicked', async () => {
        const onChoice = vi.fn()
        const { getByText } = render(StageAllPromptModal, { props: { onChoice } })
        await fireEvent.click(getByText('Yes'))
        expect(onChoice).toHaveBeenCalledWith('yes')
    })

    it('calls onChoice with "always" when Always is clicked', async () => {
        const onChoice = vi.fn()
        const { getByText } = render(StageAllPromptModal, { props: { onChoice } })
        await fireEvent.click(getByText('Always'))
        expect(onChoice).toHaveBeenCalledWith('always')
    })

    it('calls onChoice with "never" when Never is clicked', async () => {
        const onChoice = vi.fn()
        const { getByText } = render(StageAllPromptModal, { props: { onChoice } })
        await fireEvent.click(getByText('Never'))
        expect(onChoice).toHaveBeenCalledWith('never')
    })

    it('calls onChoice with "cancel" when clicking outside the modal', async () => {
        const onChoice = vi.fn()
        const { container } = render(StageAllPromptModal, { props: { onChoice } })
        const backdrop = container.querySelector('.backdrop')
        if (backdrop) await fireEvent.click(backdrop)
        expect(onChoice).toHaveBeenCalledWith('cancel')
    })
})