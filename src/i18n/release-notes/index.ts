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

// Naive string sort would put "2026.10.0" before "2026.2.0" (lexicographic,
// not numeric), so versions are compared segment by segment as numbers.
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)
  const length = Math.max(partsA.length, partsB.length)

  for (let i = 0; i < length; i++) {
    const diff = (partsB[i] ?? 0) - (partsA[i] ?? 0)
    if (diff !== 0) return diff
  }

  return 0
}

export interface ReleaseNoteEntry {
  version: string
  note: string
}

export async function loadReleaseNoteHistory(
  locale: Locale,
): Promise<ReleaseNoteEntry[]> {
  try {
    const notes = await loadLocaleFile(locale)
    return Object.entries(notes)
      .map(([version, note]) => ({ version, note }))
      .sort((a, b) => compareVersions(a.version, b.version))
  } catch {
    return []
  }
}