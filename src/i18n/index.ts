import { writable, derived, get } from 'svelte/store'

import enShell from './locales/en/shell.json'
import enEditor from './locales/en/editor.json'
import enExplorer from './locales/en/explorer.json'
import enSearch from './locales/en/search.json'
import enGit from './locales/en/git.json'
import enSettings from './locales/en/settings.json'
import enSystem from './locales/en/system.json'

import ptBRShell from './locales/pt-BR/shell.json'
import ptBREditor from './locales/pt-BR/editor.json'
import ptBRExplorer from './locales/pt-BR/explorer.json'
import ptBRSearch from './locales/pt-BR/search.json'
import ptBRGit from './locales/pt-BR/git.json'
import ptBRSettings from './locales/pt-BR/settings.json'
import ptBRSystem from './locales/pt-BR/system.json'

import es419Shell from './locales/es-419/shell.json'
import es419Editor from './locales/es-419/editor.json'
import es419Explorer from './locales/es-419/explorer.json'
import es419Search from './locales/es-419/search.json'
import es419Git from './locales/es-419/git.json'
import es419Settings from './locales/es-419/settings.json'
import es419System from './locales/es-419/system.json'

import plShell from './locales/pl/shell.json'
import plEditor from './locales/pl/editor.json'
import plExplorer from './locales/pl/explorer.json'
import plSearch from './locales/pl/search.json'
import plGit from './locales/pl/git.json'
import plSettings from './locales/pl/settings.json'
import plSystem from './locales/pl/system.json'

const en = {
  ...enShell,
  ...enEditor,
  ...enExplorer,
  ...enSearch,
  ...enGit,
  ...enSettings,
  ...enSystem,
}
const ptBR = {
  ...ptBRShell,
  ...ptBREditor,
  ...ptBRExplorer,
  ...ptBRSearch,
  ...ptBRGit,
  ...ptBRSettings,
  ...ptBRSystem,
}
const es419 = {
  ...es419Shell,
  ...es419Editor,
  ...es419Explorer,
  ...es419Search,
  ...es419Git,
  ...es419Settings,
  ...es419System,
}
const pl = {
  ...plShell,
  ...plEditor,
  ...plExplorer,
  ...plSearch,
  ...plGit,
  ...plSettings,
  ...plSystem,
}

export type Locale = 'en' | 'pt-BR' | 'es-419' | 'pl'

type LocaleData = typeof en

export const locales: Record<Locale, LocaleData> = {
  en: en,
  'pt-BR': ptBR,
  'es-419': es419,
  pl: pl,
}

export const LOCALE_OPTIONS: Array<{
  value: Locale
  label: string
  flag: string
}> = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { value: 'es-419', label: 'Español (Latinoamérica)', flag: '🌎' },
  { value: 'pl', label: 'Polski', flag: '🇵🇱' },
]

const SUPPORTED: Locale[] = LOCALE_OPTIONS.map((o) => o.value)
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
    const match = SUPPORTED.find((l) => l.startsWith(prefix))
    if (match) return match
  }

  return FALLBACK
}

function createLocaleStore() {
  const { subscribe, set } = writable<Locale>(detectLocale())

  function setLocale(locale: Locale) {
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* ignore */
    }
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
  return function translate(
    key: string,
    vars?: Record<string, unknown>,
  ): string {
    let str = resolve(data, key) ?? resolve(locales[FALLBACK], key) ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v))
      }
    }
    return str
  }
})
