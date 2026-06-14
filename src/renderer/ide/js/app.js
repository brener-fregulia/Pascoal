async function initApp() {
  initTheme()
  initWelcome()

  document.getElementById('theme-toggle')?.addEventListener('click', cycleTheme)

  try {
    if (window.__TAURI__) {
      const info = await window.__TAURI__.core.invoke('get_app_info')

      initTitlebar(info.platform)
      window.__documentsDir = info.documents_dir

      const fpcLabel = info.fpc_installed
        ? `FPC ${info.fpc_version}`
        : 'FPC not found'

      document.getElementById('statusbar-fpc').textContent = fpcLabel
      document.getElementById('statusbar-version').textContent = `${info.name} v${info.version}`
    } else {
      initTitlebar('linux')
    }
  } catch (e) {
    console.error('get_app_info failed:', e)
    initTitlebar('linux')
  }
}

document.addEventListener('DOMContentLoaded', initApp)
