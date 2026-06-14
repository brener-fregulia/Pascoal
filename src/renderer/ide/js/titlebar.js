function initTitlebar() {
  const platform = window.__TAURI__ ? window.__TAURI_INTERNALS__?.metadata?.currentWindow : null
  const os = navigator.userAgent.toLowerCase().includes('win') ? 'win32'
    : navigator.userAgent.toLowerCase().includes('mac') ? 'darwin'
    : 'linux'

  document.body.classList.add(`platform-${os}`)

  const isMac = os === 'darwin'

  const closeBtn    = document.getElementById(isMac ? 'wc-close'     : 'wc-close-win')
  const minimizeBtn = document.getElementById(isMac ? 'wc-minimize'  : 'wc-minimize-win')
  const maximizeBtn = document.getElementById(isMac ? 'wc-maximize'  : 'wc-maximize-win')

  closeBtn?.addEventListener('click', async () => {
    if (window.__TAURI__) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      getCurrentWindow().close()
    }
  })

  minimizeBtn?.addEventListener('click', async () => {
    if (window.__TAURI__) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      getCurrentWindow().minimize()
    }
  })

  maximizeBtn?.addEventListener('click', async () => {
    if (window.__TAURI__) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()
      const isMax = await win.isMaximized()
      isMax ? win.unmaximize() : win.maximize()
    }
  })
}
