import { writable, derived, get } from 'svelte/store'
import en from './locales/en.json'
import ptBR from './locales/pt-BR.json'

export type Locale = 'en' | 'pt-BR'

type LocaleData = typeof en

const locales: Record<Locale, LocaleData> = {
  'en': en,
  'pt-BR': ptBR,
}

const SUPPORTED: Locale[] = ['en', 'pt-BR']
const FALLBACK: Locale = 'en'

function detectLocale(): Locale {
  if (typeof window === 'undefined') return FALLBACK

  const candidates = navigator.languages?.length
    ? [...navigator.languages]
    : [navigator.language]

  for (const lang of candidates) {
    if (SUPPORTED.includes(lang as Locale)) return lang as Locale
    const prefix = lang.split('-')[0]
    const match = SUPPORTED.find(l => l.startsWith(prefix))
    if (match) return match
  }

  return FALLBACK
}

// Current locale store
export const localeStore = writable<Locale>(detectLocale())

// Resolve dot-path against locale data
function resolve(obj: any, path: string): string | undefined {
  const result = path.split('.').reduce((acc, key) => acc?.[key], obj)
  return typeof result === 'string' ? result : undefined
}

// Non-reactive t() — use in stores and .ts files
export function t(key: string, vars?: Record<string, string | number>): string {
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

// Reactive translation function — updates when locale changes
// Usage in components: const $t = useT()  then {$t('key')}
export const i18n = derived(localeStore, ($locale) => {
  const data = locales[$locale] ?? locales[FALLBACK]

  return function translate(key: string, vars?: Record<string, string | number>): string {
    let str = resolve(data, key) ?? resolve(locales[FALLBACK], key) ?? key

    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v))
      }
    }

    return str
  }
})
