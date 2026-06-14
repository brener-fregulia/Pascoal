const THEMES = ['dark', 'light', 'charcoal']
const STORAGE_KEY = 'pascoal-theme'

function detectSystemTheme() {
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEY) || null
}

function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = 'dark'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)

  const label = document.getElementById('statusbar-theme')
  if (label) {
    const labels = { dark: 'Dark', light: 'Light', charcoal: 'Charcoal' }
    label.textContent = labels[theme]
  }
}

function initTheme() {
  const saved = getSavedTheme()
  const theme = saved || detectSystemTheme()
  applyTheme(theme)

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!getSavedTheme()) {
      applyTheme(e.matches ? 'light' : 'dark')
    }
  })
}

function cycleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark'
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]
  applyTheme(next)
}
