import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import {
  localeStore,
  i18n,
  t,
  LOCALE_OPTIONS,
  type Locale,
} from '../../../src/renderer/ide/src/i18n'
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
    localStorage.setItem('pascoal-locale', 'pl')
    localeStore.set('pl')
    expect(get(localeStore)).toBe('pl')
  })

  it('LOCALE_OPTIONS contains all expected locales', () => {
    const values = LOCALE_OPTIONS.map((o) => o.value)
    expect(values).toContain('en')
    expect(values).toContain('pt-BR')
    expect(values).toContain('es-419')
    expect(values).toContain('pl')
  })
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

  it('returns es-419 string when locale is es-419', () => {
    localeStore.set('es-419')
    expect(t('editor.run')).toBe('Ejecutar')
  })

  it('returns pl string when locale is pl', () => {
    localeStore.set('pl')
    expect(t('editor.run')).toBe('Uruchom')
  })

  it('falls back to English when key is missing in locale', () => {
    localeStore.set('pl')
    expect(t('console.title')).toBe('Konsola')
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
