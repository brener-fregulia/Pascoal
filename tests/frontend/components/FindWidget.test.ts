import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { search } from '@codemirror/search'
import FindWidget from '../../../src/editor/FindWidget.svelte'

function makeView(doc: string): EditorView {
    return new EditorView({
        state: EditorState.create({ doc, extensions: [search()] }),
    })
}

afterEach(() => cleanup())

describe('FindWidget', () => {
    it('renders nothing when open is false', () => {
        const view = makeView('hello world')
        const { container } = render(FindWidget, {
            props: { view, open: false },
        })
        expect(container.querySelector('.find-widget')).toBeNull()
    })

    it('renders the search input when open is true', () => {
        const view = makeView('hello world')
        const { getByPlaceholderText } = render(FindWidget, {
            props: { view, open: true },
        })
        expect(getByPlaceholderText('Find')).toBeInTheDocument()
    })

    it('shows the match count as the query is typed', async () => {
        const view = makeView('hello hello world')
        const { getByPlaceholderText, getByText } = render(FindWidget, {
            props: { view, open: true },
        })
        const input = getByPlaceholderText('Find')
        await fireEvent.input(input, { target: { value: 'hello' } })
        expect(getByText('1 of 2')).toBeInTheDocument()
    })

    it('shows "No results" when the query has no matches', async () => {
        const view = makeView('hello world')
        const { getByPlaceholderText, getByText } = render(FindWidget, {
            props: { view, open: true },
        })
        const input = getByPlaceholderText('Find')
        await fireEvent.input(input, { target: { value: 'xyz' } })
        expect(getByText('No results')).toBeInTheDocument()
    })

    it('disables the navigation buttons when there are no matches', () => {
        const view = makeView('hello world')
        const { getByTitle } = render(FindWidget, {
            props: { view, open: true },
        })
        expect(getByTitle('Next Match')).toBeDisabled()
        expect(getByTitle('Previous Match')).toBeDisabled()
    })

    it('shows the replace row when the expand button is clicked', async () => {
        const view = makeView('hello world')
        const { getByTitle, getByPlaceholderText } = render(FindWidget, {
            props: { view, open: true },
        })
        await fireEvent.click(getByTitle('Toggle Replace'))
        expect(getByPlaceholderText('Replace')).toBeInTheDocument()
    })

    it('closes when the close button is clicked', async () => {
        const view = makeView('hello world')
        const { getByTitle, container } = render(FindWidget, {
            props: { view, open: true },
        })
        await fireEvent.click(getByTitle('Close'))
        expect(container.querySelector('.find-widget')).toBeNull()
    })

    it('toggles the case-sensitive option', async () => {
        const view = makeView('hello world')
        const { getByTitle } = render(FindWidget, {
            props: { view, open: true },
        })
        const caseBtn = getByTitle('Match Case')
        expect(caseBtn).not.toHaveClass('active')
        await fireEvent.click(caseBtn)
        expect(caseBtn).toHaveClass('active')
    })
})