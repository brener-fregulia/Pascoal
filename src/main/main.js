const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const { isFpcInstalled, getFpcVersion, promptInstallFpc } = require('./fpc')
let runningProcess = null

app.whenReady().then(async () => {
  createWindow()
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hidden',
    backgroundColor: '#0D0D0D',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadFile(path.join(__dirname, '../renderer/index.html'))
}

ipcMain.handle('check-fpc', async () => {
  const installed = isFpcInstalled()
  const version = installed ? getFpcVersion() : null
  return { installed, version }
})

ipcMain.handle('send-input', (_, data) => {
  if (runningProcess) {
    runningProcess.write(data + '\r')
  }
})

ipcMain.handle('get-activities', () => {
  const baseDir = path.join(__dirname, '../../atividades')
  const result = []

  if (!fs.existsSync(baseDir)) return result

  const disciplinas = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(d => d.isDirectory())

  for (const disciplina of disciplinas) {
    const disciplinaPath = path.join(baseDir, disciplina.name)
    const exercicios = findExercicios(disciplinaPath, disciplinaPath)
    result.push({ disciplina: disciplina.name, exercicios })
  }

  return result
})

function findExercicios(basePath, currentPath) {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true })
  const hasManifest = entries.some(e => e.name === 'manifest.json')

  // Esta pasta e um exercicio
  if (hasManifest) {
    const manifestPath = path.join(currentPath, 'manifest.json')
    const solucoesPath = path.join(currentPath, 'solucoes')
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

    let solucoes = []
    if (fs.existsSync(solucoesPath)) {
      solucoes = fs.readdirSync(solucoesPath)
        .filter(f => f.endsWith('.pas'))
        .map(f => f.replace('.pas', ''))
    }

    // Caminho relativo ao basePath para montar a categoria na sidebar
    const rel = path.relative(basePath, currentPath)
    const parts = rel.split(path.sep)
    const categoria = parts.length > 1 ? parts.slice(0, -1).join(' / ') : ''

    return [{
      id: path.basename(currentPath),
      path: currentPath,
      categoria,
      ...manifest,
      solucoes
    }]
  }

  // Nao e exercicio, desce recursivamente
  const subDirs = entries.filter(e => e.isDirectory())
  const exercicios = []
  for (const sub of subDirs) {
    const found = findExercicios(basePath, path.join(currentPath, sub.name))
    exercicios.push(...found)
  }
  return exercicios
}

ipcMain.handle('get-code', (_, exPath, aluno) => {
  const filePath = path.join(exPath, 'solucoes', `${aluno}.pas`)
  if (!fs.existsSync(filePath)) return ''
  return fs.readFileSync(filePath, 'utf-8')
})

ipcMain.handle('run-code', async (event, code) => {
  const win = BrowserWindow.getFocusedWindow()

  if (!isFpcInstalled()) {
    await promptInstallFpc(win)
    return { success: false, output: 'FPC nao encontrado. Instale o Free Pascal e tente novamente.' }
  }

  const tmpDir = path.join(app.getPath('userData'), 'bastos-tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

  const srcFile = path.join(tmpDir, 'programa.pas')
  const outFile = path.join(tmpDir, 'programa')
  const exeFile = process.platform === 'win32' ? outFile + '.exe' : outFile

  fs.writeFileSync(srcFile, code, 'utf-8')

  if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile)
  if (process.platform !== 'win32' && fs.existsSync(outFile + '.exe')) fs.unlinkSync(outFile + '.exe')

  return new Promise((resolve) => {
    const fpcBin = process.platform === 'win32' ? 'fpc.exe' : 'fpc'
    const compile = spawn(fpcBin, [srcFile, '-FE' + tmpDir, '-o' + exeFile], {
      cwd: tmpDir
    })

    let compileOutput = ''
    compile.stdout.on('data', d => compileOutput += d.toString())
    compile.stderr.on('data', d => compileOutput += d.toString())

    compile.on('close', (exitCode) => {
      if (exitCode !== 0 || !fs.existsSync(exeFile)) {
        resolve({ success: false, output: compileOutput })
        return
      }

      if (process.platform !== 'win32') {
        fs.chmodSync(exeFile, '755')
      }

      const pty = require('node-pty')

      runningProcess = pty.spawn(exeFile, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: tmpDir,
        env: process.env
      })

      if (process.platform !== 'win32') {
        console.log('[bastos.pas] processo iniciado, PID:', runningProcess.pid)
      }

      runningProcess.onData((data) => {
        event.sender.send('run-output', data)
      })

      runningProcess.onExit(({ exitCode }) => {
        runningProcess = null
        resolve({ success: true, output: '' })
      })
    })
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})