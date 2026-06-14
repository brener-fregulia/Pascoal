const path = require('path')
const fs   = require('fs')
const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const { isFpcInstalled, getFpcVersion, promptInstallFpc } = require('../fpc')
const {
  TMP_DIR_NAME,
  SRC_FILENAME,
  EXE_FILENAME,
  FPC_BIN_WIN,
  FPC_BIN_UNIX,
  PTY_TERM,
  PTY_COLS,
  PTY_ROWS,
  RUN_EXIT_DELAY_MS,
} = require('../constants')

let runningProcess = null

function register(ipcMain) {
  ipcMain.handle('check-fpc', () => {
    const installed = isFpcInstalled()
    return { installed, version: installed ? getFpcVersion() : null }
  })

  ipcMain.handle('send-input', (_, data) => {
    if (runningProcess) runningProcess.write(data + '\r')
  })

  ipcMain.handle('run-code', async (event, code) => {
    const win = BrowserWindow.getFocusedWindow()

    if (!isFpcInstalled()) {
      if (win) await promptInstallFpc(win)
      return { success: false, output: 'FPC not found. Install Free Pascal and try again.' }
    }

    const tmpDir  = path.join(app.getPath('userData'), TMP_DIR_NAME)
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

    const srcFile = path.join(tmpDir, SRC_FILENAME)
    const outFile = path.join(tmpDir, EXE_FILENAME)
    const exeFile = process.platform === 'win32' ? outFile + '.exe' : outFile

    fs.writeFileSync(srcFile, code, 'utf-8')
    if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile)

    return new Promise((resolve) => {
      const fpcBin  = process.platform === 'win32' ? FPC_BIN_WIN : FPC_BIN_UNIX
      const compile = spawn(fpcBin, [srcFile, '-FE' + tmpDir, '-o' + exeFile], { cwd: tmpDir })

      let compileOutput = ''
      compile.stdout.on('data', d => compileOutput += d.toString())
      compile.stderr.on('data', d => compileOutput += d.toString())

      compile.on('close', (exitCode) => {
        if (exitCode !== 0 || !fs.existsSync(exeFile)) {
          resolve({ success: false, output: compileOutput })
          return
        }

        if (process.platform !== 'win32') fs.chmodSync(exeFile, '755')

        const pty = require('node-pty')
        runningProcess = pty.spawn(exeFile, [], {
          name: PTY_TERM,
          cols: PTY_COLS,
          rows: PTY_ROWS,
          cwd:  tmpDir,
          env:  process.env
        })

        runningProcess.onData((data) => {
          event.sender.send('run-output', data)
        })

        runningProcess.onExit(() => {
          runningProcess = null
          setTimeout(() => resolve({ success: true, output: '' }), RUN_EXIT_DELAY_MS)
        })
      })
    })
  })
}

module.exports = { register }
