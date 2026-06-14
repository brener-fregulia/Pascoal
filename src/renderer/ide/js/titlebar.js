function initTitlebar(platform) {
  const osMap = { windows: 'win32', macos: 'darwin', linux: 'linux' }
  const os = osMap[platform] || 'linux'

  document.body.classList.add(`platform-${os}`)

  const isMac = os === 'macos'

  const closeBtn = document.getElementById(isMac ? 'wc-close' : 'wc-close-win')
  const minimizeBtn = document.getElementById(isMac ? 'wc-minimize' : 'wc-minimize-win')
  const maximizeBtn = document.getElementById(isMac ? 'wc-maximize' : 'wc-maximize-win')

  closeBtn?.addEventListener('click', () => {
    window.__TAURI__.window.getCurrentWindow().close()
  })

  minimizeBtn?.addEventListener('click', () => {
    window.__TAURI__.window.getCurrentWindow().minimize()
  })

  maximizeBtn?.addEventListener('click', async () => {
    const win = window.__TAURI__.window.getCurrentWindow()
    const isMax = await win.isMaximized()
    isMax ? win.unmaximize() : win.maximize()
  })
}
