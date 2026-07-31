import type { Locale } from '../index'

// Each branch is a separate static import() call (not a template-string
// path) so Vite can code-split each locale into its own chunk and only
// fetch the one actually needed, instead of bundling every language's
// release notes into the main app chunk.
function loadLocaleFile(locale: Locale): Promise<Record<string, string>> {
  switch (locale) {
    case 'en':
      return import('./locales/en.json').then((m) => m.default)
    case 'pt-BR':
      return import('./locales/pt-BR.json').then((m) => m.default)
    case 'es-419':
      return import('./locales/es-419.json').then((m) => m.default)
    case 'pl':
      return import('./locales/pl.json').then((m) => m.default)
  }
}

export async function loadReleaseNote(
  locale: Locale,
  version: string,
): Promise<string | null> {
  try {
    const notes = await loadLocaleFile(locale)
    return notes[version] ?? null
  } catch {
    return null
  }
}