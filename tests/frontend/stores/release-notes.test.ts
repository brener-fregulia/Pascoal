import { describe, it, expect } from 'vitest'
import {
    loadReleaseNote,
    loadReleaseNoteHistory,
} from '../../../src/i18n/release-notes'
import en from '../../../src/i18n/release-notes/locales/en.json'

const LOCALES = ['en', 'pt-BR', 'es-419', 'pl'] as const
const KNOWN_VERSIONS = Object.keys(en)

describe('loadReleaseNote', () => {
    it('has at least one version documented', () => {
        expect(KNOWN_VERSIONS.length).toBeGreaterThan(0)
    })

    // This is the important one: it doesn't hardcode a version string, so
    // it automatically covers every future release too. If a new version
    // gets added to en.json but someone forgets to translate it in one of
    // the other locale files, this test catches it - instead of the gap
    // only showing up when a user on that locale opens the modal.
    it('has a translated entry in every locale for every version in en.json', async () => {
        for (const locale of LOCALES) {
            for (const version of KNOWN_VERSIONS) {
                const note = await loadReleaseNote(locale, version)
                expect(
                    note,
                    `missing "${version}" release note in locale "${locale}"`,
                ).toBeTruthy()
            }
        }
    })

    it('returns null for a version with no entry', async () => {
        const note = await loadReleaseNote('en', '1999.9.9')
        expect(note).toBeNull()
    })
})

describe('loadReleaseNoteHistory', () => {
    it('returns every version present in the locale file', async () => {
        const history = await loadReleaseNoteHistory('en')
        const versions = history.map((entry) => entry.version)
        expect(versions.sort()).toEqual(Object.keys(en).sort())
    })

    // Regression test for the exact bug this function was written to avoid:
    // a plain string sort would put "2026.10.0" before "2026.2.0".
    it('sorts newest version first, numerically not lexicographically', async () => {
        const history = await loadReleaseNoteHistory('en')
        for (let i = 1; i < history.length; i++) {
            const prev = history[i - 1].version.split('.').map(Number)
            const curr = history[i].version.split('.').map(Number)
            const prevValue = prev[0] * 1_000_000 + prev[1] * 1_000 + prev[2]
            const currValue = curr[0] * 1_000_000 + curr[1] * 1_000 + curr[2]
            expect(prevValue).toBeGreaterThanOrEqual(currValue)
        }
    })

    it('returns an empty array instead of throwing for an invalid locale', async () => {
        // @ts-expect-error - deliberately invalid locale to exercise the
        // fallback path (e.g. a corrupted localStorage value)
        const history = await loadReleaseNoteHistory('xx-invalid')
        expect(history).toEqual([])
    })
})