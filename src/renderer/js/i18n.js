const SUPPORTED_LOCALES = ['pt-BR', 'en-US']
const DEFAULT_LOCALE    = 'pt-BR'

let _strings = {}

async function initI18n() {
  const preferred = navigator.language || DEFAULT_LOCALE

  // Tenta match exato primeiro, depois pelo prefixo (ex: "pt" → "pt-BR")
  const locale =
    SUPPORTED_LOCALES.find(l => l === preferred) ??
    SUPPORTED_LOCALES.find(l => l.startsWith(preferred.split('-')[0])) ??
    DEFAULT_LOCALE

  const response = await fetch(`i18n/${locale}.json`)
  _strings = await response.json()
}

function t(key) {
  return _strings[key] ?? key
}

function getAll() {
  const result = {}
  for (const [key, val] of Object.entries(_strings)) {
    const parts = key.split('.')
    let cur = result
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] ??= {}
      cur = cur[parts[i]]
    }
    cur[parts.at(-1)] = val
  }
  return result
}