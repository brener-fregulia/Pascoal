import { writable, derived, get } from 'svelte/store'

import en from './locales/en.json'
import ptBR from './locales/pt-BR.json'
import es419 from './locales/es-419.json'
import pl from './locales/pl.json'

export type Locale = 'en' | 'pt-BR' | 'es-419' | 'pl'

type LocaleData = typeof en

const locales: Record<Locale, LocaleData> = {
  'en': en,
  'pt-BR': ptBR,
  'es-419': es419,
  'pl': pl,
}

export const LOCALE_OPTIONS: Array<{ value: Locale; label: string; flag: string }> = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { value: 'es-419', label: 'Español (Latinoamérica)', flag: '🌎' },
  { value: 'pl', label: 'Polski', flag: '🇵🇱' },
]

const SUPPORTED: Locale[] = LOCALE_OPTIONS.map(o => o.value)
const FALLBACK: Locale = 'en'
const STORAGE_KEY = 'pascoal-locale'

function getSavedLocale(): Locale | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return SUPPORTED.includes(saved as Locale) ? (saved as Locale) : null
  } catch {
    return null
  }
}

function detectLocale(): Locale {
  const saved = getSavedLocale()
  if (saved) return saved

  if (typeof window === 'undefined') return FALLBACK

  const candidates = navigator.languages?.length
    ? [...navigator.languages]
    : [navigator.language]

  for (const lang of candidates) {
    if (SUPPORTED.includes(lang as Locale)) return lang as Locale
    const normalized = lang.toLowerCase()
    if (normalized.startsWith('es')) return 'es-419'
    const prefix = lang.split('-')[0]
    const match = SUPPORTED.find(l => l.startsWith(prefix))
    if (match) return match
  }

  return FALLBACK
}

function createLocaleStore() {
  const { subscribe, set } = writable<Locale>(detectLocale())

  function setLocale(locale: Locale) {
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch { /* ignore */ }
    set(locale)
  }

  return { subscribe, set: setLocale }
}

export const localeStore = createLocaleStore()

function resolve(obj: any, path: string): string | undefined {
  const result = path.split('.').reduce((acc, key) => acc?.[key], obj)
  return typeof result === 'string' ? result : undefined
}

export function t(key: string, vars?: Record<string, unknown>): string {
  const locale = get(localeStore)
  const data = locales[locale] ?? locales[FALLBACK]
  let str = resolve(data, key) ?? resolve(locales[FALLBACK], key) ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v))
    }
  }
  return str
}

export const i18n = derived(localeStore, ($locale) => {
  const data = locales[$locale] ?? locales[FALLBACK]
  return function translate(key: string, vars?: Record<string, unknown>): string {
    let str = resolve(data, key) ?? resolve(locales[FALLBACK], key) ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v))
      }
    }
    return str
  }
})