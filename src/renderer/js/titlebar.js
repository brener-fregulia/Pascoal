function initTitlebar() {
  const platform = window.api.platform

  document.body.classList.add(`platform-${platform}`)

  const isMac = platform === 'darwin'

  const closeBtn    = document.getElementById(isMac ? 'wc-close'     : 'wc-close-win')
  const minimizeBtn = document.getElementById(isMac ? 'wc-minimize'  : 'wc-minimize-win')
  const maximizeBtn = document.getElementById(isMac ? 'wc-maximize'  : 'wc-maximize-win')

  closeBtn?.addEventListener('click',    () => window.api.windowClose())
  minimizeBtn?.addEventListener('click', () => window.api.windowMinimize())
  maximizeBtn?.addEventListener('click', () => window.api.windowMaximize())
}
