import { describe, it, expect } from 'vitest'
import { loadReleaseNote } from '../../../src/i18n/release-notes'
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