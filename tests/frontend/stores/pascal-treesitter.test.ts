import { describe, it, expect } from 'vitest'
import { buildDecorations } from '../../../src/language/pascal/pascal-treesitter'

describe('buildDecorations', () => {
    it('creates a decoration for a span with a known kind', () => {
        const decorations = buildDecorations(20, [
            { start: 0, end: 7, kind: 'keyword' },
        ])
        const iter = decorations.iter()
        expect(iter.value?.spec.class).toBe('cm-ts-keyword')
        expect(iter.from).toBe(0)
        expect(iter.to).toBe(7)
    })

    it('skips spans with an unknown kind (e.g. "identifier")', () => {
        const decorations = buildDecorations(20, [
            { start: 0, end: 4, kind: 'identifier' },
        ])
        expect(decorations.size).toBe(0)
    })

    it('skips spans where end <= start', () => {
        const decorations = buildDecorations(20, [
            { start: 5, end: 5, kind: 'keyword' },
        ])
        expect(decorations.size).toBe(0)
    })

    it('skips spans that extend past the document length', () => {
        const decorations = buildDecorations(10, [
            { start: 5, end: 20, kind: 'keyword' },
        ])
        expect(decorations.size).toBe(0)
    })

    it('includes valid spans regardless of input order', () => {
        const decorations = buildDecorations(20, [
            { start: 10, end: 15, kind: 'string' },
            { start: 0, end: 7, kind: 'keyword' },
        ])
        expect(decorations.size).toBe(2)
    })

    it('reuses the same mark instance for repeated kinds (caching)', () => {
        const decorations = buildDecorations(20, [
            { start: 0, end: 3, kind: 'keyword' },
            { start: 5, end: 8, kind: 'keyword' },
        ])
        const specs: unknown[] = []
        decorations.between(0, 20, (_from, _to, deco) => {
            specs.push(deco.spec)
        })
        expect(specs.length).toBe(2)
        expect(specs[0]).toBe(specs[1])
    })
})