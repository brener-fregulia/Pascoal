import { writable, derived, get } from 'svelte/store'

import enShell from './locales/en/shell.json'
import enEditor from './locales/en/editor.json'
import enExplorer from './locales/en/explorer.json'
import enSearch from './locales/en/search.json'
import enGit from './locales/en/git.json'
import enSettings from './locales/en/settings.json'
import enSystem from './locales/en/system.json'
import enWorkspace from './locales/en/workspace.json'

import ptBRShell from './locales/pt-BR/shell.json'
import ptBREditor from './locales/pt-BR/editor.json'
import ptBRExplorer from './locales/pt-BR/explorer.json'
import ptBRSearch from './locales/pt-BR/search.json'
import ptBRGit from './locales/pt-BR/git.json'
import ptBRSettings from './locales/pt-BR/settings.json'
import ptBRSystem from './locales/pt-BR/system.json'
import ptBRWorkspace from './locales/pt-BR/workspace.json'

const en = {
  ...enShell,
  ...enEditor,
  ...enExplorer,
  ...enSearch,
  ...enGit,
  ...enSettings,
  ...enSystem,
  ...enWorkspace,
}
const ptBR = {
  ...ptBRShell,
  ...ptBREditor,
  ...ptBRExplorer,
  ...ptBRSearch,
  ...ptBRGit,
  ...ptBRSettings,
  ...ptBRSystem,
  ...ptBRWorkspace,
}

export type Locale = 'en' | 'pt-BR'

type LocaleData = typeof en

export const locales: Record<Locale, LocaleData> = {
  en: en,
  'pt-BR': ptBR,
}

export const LOCALE_OPTIONS: Array<{
  value: Locale
  label: string
  flag: string
}> = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
]

const SUPPORTED: Locale[] = LOCALE_OPTIONS.map((o) => o.value)
const FALLBACK: Locale = 'en'
const STORAGE_KEY = 'pascoal-locale'
// Locales that were selectable in earlier versions. A saved preference for
// one of them resolves to the fallback instead of the system language.
const RETIRED = ['es-419', 'pl']

function getSavedLocale(): Locale | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && RETIRED.includes(saved)) {
      localStorage.setItem(STORAGE_KEY, FALLBACK)
      return FALLBACK
    }
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
