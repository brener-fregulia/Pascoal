const { dialog, shell } = require('electron')
const { execSync }      = require('child_process')
const { FPC_URLS }      = require('./constants')
const { t }             = require('./i18n/index')

function isFpcInstalled() {
  try {
    const cmd = process.platform === 'win32' ? 'where fpc' : 'which fpc'
    execSync(cmd, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function getFpcVersion() {
  try {
    return execSync('fpc -iV', { encoding: 'utf-8' }).trim()
  } catch {
    return null
  }
}

async function promptInstallFpc(win) {
  const result = await dialog.showMessageBox(win, {
    type:      'question',
    title:     t('fpc.dialog.not_found.title'),
    message:   t('fpc.dialog.not_found.message'),
    detail:    t('fpc.dialog.not_found.detail'),
    buttons:   [t('fpc.dialog.not_found.btn_open'), t('fpc.dialog.not_found.btn_cancel')],
    defaultId: 0,
    cancelId:  1
  })

  if (result.response === 0) {
    const url = FPC_URLS[process.platform] ?? FPC_URLS.win32
    shell.openExternal(url)

    await dialog.showMessageBox(win, {
      type:    'info',
      title:   t('fpc.dialog.install.title'),
      message: t('fpc.dialog.install.message'),
      detail:  t('fpc.dialog.install.detail'),
      buttons: [t('fpc.dialog.install.btn_ok')]
    })
  }

  return false
}

module.exports = { isFpcInstalled, getFpcVersion, promptInstallFpc }