import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { get } from 'svelte/store'
import {
  localeStore,
  i18n,
  t,
  LOCALE_OPTIONS,
  type Locale,
} from '../../../src/i18n'
describe('localeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    localeStore.set('en')
  })

  it('starts with a supported locale', () => {
    const locale: Locale = get(localeStore)
    const supported = LOCALE_OPTIONS.map((o) => o.value)
    expect(supported).toContain(locale)
  })

  it('persists locale to localStorage when set', () => {
    localeStore.set('pt-BR')
    expect(localStorage.getItem('pascoal-locale')).toBe('pt-BR')
  })

  it('restores locale from localStorage', () => {
    localStorage.setItem('pascoal-locale', 'pt-BR')
    localeStore.set('pt-BR')
    expect(get(localeStore)).toBe('pt-BR')
  })

  it('LOCALE_OPTIONS contains exactly the supported locales', () => {
    expect(LOCALE_OPTIONS.map((o) => o.value)).toEqual(['en', 'pt-BR'])
  })
})

describe('locale detection on startup', () => {
  async function freshStore() {
    vi.resetModules()
    return (await import('../../../src/i18n')).localeStore
  }

  function setSystemLanguages(languages: string[]) {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages)
  }

  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it.each(['es-419', 'pl'])(
    'migrates a saved retired locale (%s) to en, ignoring the system language',
    async (retired) => {
      localStorage.setItem('pascoal-locale', retired)
      setSystemLanguages(['pt-BR'])
      const store = await freshStore()
      expect(get(store)).toBe('en')
      expect(localStorage.getItem('pascoal-locale')).toBe('en')
    },
  )

  it.each(['en', 'pt-BR'] as const)('keeps a saved %s preference', async (saved) => {
    localStorage.setItem('pascoal-locale', saved)
    setSystemLanguages(saved === 'en' ? ['pt-BR'] : ['en-US'])
    const store = await freshStore()
    expect(get(store)).toBe(saved)
  })

  it('selects pt-BR for a Portuguese system language', async () => {
    setSystemLanguages(['pt-PT'])
    expect(get(await freshStore())).toBe('pt-BR')
  })

  it.each([['en-GB'], ['es-MX'], ['pl-PL']])(
    'falls back to en for system language %s',
    async (lang) => {
      setSystemLanguages([lang])
      expect(get(await freshStore())).toBe('en')
    },
  )
})

describe('t() non-reactive translation function', () => {
  beforeEach(() => {
    localeStore.set('en')
  })

  it('returns English string for a known key', () => {
    expect(t('editor.run')).toBe('Run')
  })

  it('falls back to the key itself for unknown keys', () => {
    expect(t('does.not.exist')).toBe('does.not.exist')
  })

  it('interpolates variables', () => {
    expect(t('console.exit_failure', { code: 1 })).toBe(
      'Process finished with exit code 1',
    )
  })

  it('returns pt-BR string when locale is pt-BR', () => {
    localeStore.set('pt-BR')
    expect(t('editor.run')).toBe('Executar')
  })

  it('returns the key itself when it exists in no locale', () => {
    localeStore.set('pt-BR')
    expect(t('does.not.exist')).toBe('does.not.exist')
  })
})

describe('i18n derived store', () => {
  beforeEach(() => {
    localeStore.set('en')
  })

  it('returns a function', () => {
    expect(typeof get(i18n)).toBe('function')
  })

  it('translates a known key in English', () => {
    const translate = get(i18n) as (
      key: string,
      vars?: Record<string, unknown>,
    ) => string
    expect(translate('editor.run')).toBe('Run')
  })

  it('updates when locale changes', () => {
    localeStore.set('pt-BR')
    const translate = get(i18n) as (
      key: string,
      vars?: Record<string, unknown>,
    ) => string
    expect(translate('editor.run')).toBe('Executar')
  })

  it('interpolates variables', () => {
    const translate = get(i18n) as (
      key: string,
      vars?: Record<string, unknown>,
    ) => string
    expect(translate('console.exit_failure', { code: 42 })).toBe(
      'Process finished with exit code 42',
    )
  })

  it('returns key when translation is missing everywhere', () => {
    const translate = get(i18n) as (
      key: string,
      vars?: Record<string, unknown>,
    ) => string
    expect(translate('totally.missing.key')).toBe('totally.missing.key')
  })
})
