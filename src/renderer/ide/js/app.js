function initApp() {
  initTheme()
  initTitlebar()
  initWelcome()

  document.getElementById('theme-toggle')?.addEventListener('click', cycleTheme)
}

document.addEventListener('DOMContentLoaded', initApp)
