const { APP_NAME, APP_VERSION, APP_DESCRIPTION } = require('../constants')
const { isFpcInstalled, getFpcVersion } = require('../fpc')

function register(ipcMain) {
  ipcMain.handle('get-app-info', () => {
    const fpcInstalled = isFpcInstalled()
    return {
      name: APP_NAME,
      version: APP_VERSION,
      description: APP_DESCRIPTION,
      fpc: {
        installed: fpcInstalled,
        version: fpcInstalled ? getFpcVersion() : null,
      }
    }
  })
}

module.exports = { register }