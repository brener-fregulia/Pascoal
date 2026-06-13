const { dialog, shell } = require('electron')
const { execSync } = require('child_process')
const { FPC_URLS } = require('./constants')

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
    type: 'question',
    title: 'Free Pascal não encontrado',
    message: 'O compilador Free Pascal (FPC) não foi encontrado na sua máquina.',
    detail: 'O FPC é necessário para compilar e executar programas Pascal. Deseja abrir a página de download?',
    buttons: ['Abrir download', 'Cancelar'],
    defaultId: 0,
    cancelId: 1
  })

  if (result.response === 0) {
    const url = FPC_URLS[process.platform] ?? FPC_URLS.win32
    shell.openExternal(url)

    await dialog.showMessageBox(win, {
      type: 'info',
      title: 'Instruções de instalação',
      message: 'Após instalar o FPC:',
      detail: '1. Conclua a instalação normalmente\n2. Reinicie o Bascalzin\n3. Tente executar novamente',
      buttons: ['OK']
    })
  }

  return false
}

module.exports = { isFpcInstalled, getFpcVersion, promptInstallFpc }