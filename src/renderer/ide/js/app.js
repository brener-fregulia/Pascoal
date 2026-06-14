async function initApp() {
  initTheme()
  initTitlebar()
  initWelcome()

  document.getElementById('theme-toggle')?.addEventListener('click', cycleTheme)

  try {
    if (window.__TAURI__) {
      const info = await window.__TAURI__.core.invoke('get_app_info')
      const fpcLabel = info.fpc_installed
        ? `FPC ${info.fpc_version}`
        : 'FPC not found'
      document.getElementById('statusbar-fpc').textContent = fpcLabel
      document.getElementById('statusbar-version').textContent = `${info.name} v${info.version}`
    }
  } catch (e) {
    console.error('get_app_info failed:', e)
  }
}

document.addEventListener('DOMContentLoaded', initApp)