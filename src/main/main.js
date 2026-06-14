const { app, BrowserWindow, screen } = require('electron')
const path = require('path')
const {
  WIN_MIN_WIDTH,
  WIN_MIN_HEIGHT,
  WIN_DEFAULT_W,
  WIN_DEFAULT_H,
  WIN_BG_COLOR,
  IS_DEV,
} = require('./constants')

// Handlers
const appHandler      = require('./handlers/app')
const examplesHandler = require('./handlers/examples')
const compilerHandler = require('./handlers/compiler')
const windowHandler   = require('./handlers/window')

app.whenReady().then(() => {
  registerHandlers()
  createWindow()
})

function registerHandlers() {
  const { ipcMain } = require('electron')
  appHandler.register(ipcMain)
  examplesHandler.register(ipcMain)
  compilerHandler.register(ipcMain)
  windowHandler.register(ipcMain)
}

function createWindow() {
  const { width, height, x, y } = screen.getPrimaryDisplay().workArea
  const isSmallScreen = width <= 1920 && height <= 1080

  const win = new BrowserWindow({
    width:  isSmallScreen ? width  : WIN_DEFAULT_W,
    height: isSmallScreen ? height : WIN_DEFAULT_H,
    x:      isSmallScreen ? x      : undefined,
    y:      isSmallScreen ? y      : undefined,
    minWidth:        WIN_MIN_WIDTH,
    minHeight:       WIN_MIN_HEIGHT,
    titleBarStyle:   'hidden',
    backgroundColor: WIN_BG_COLOR,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false
    }
  })

  win.loadFile(path.join(__dirname, '../renderer/index.html'))

  if (IS_DEV) {
    win.webContents.on('did-finish-load', () => {
      win.webContents.openDevTools()
    })
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
