const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const { isFpcInstalled, getFpcVersion, promptInstallFpc } = require('./fpc')
let runningProcess = null

// Verifica FPC ao iniciar
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

// Retorna status do FPC para o renderer
ipcMain.handle('check-fpc', async () => {
  const installed = isFpcInstalled()
  const version = installed ? getFpcVersion() : null
  return { installed, version }
})

ipcMain.handle('send-input', (_, data) => {
  if (runningProcess && runningProcess.stdin) {
    runningProcess.stdin.write(data + '\n')
  }
})

// Carrega a árvore de atividades
ipcMain.handle('get-activities', () => {
  const baseDir = path.join(__dirname, '../../atividades')
  const result = []

  if (!fs.existsSync(baseDir)) return result

  const disciplinas = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(d => d.isDirectory())

  for (const disciplina of disciplinas) {
    const disciplinaPath = path.join(baseDir, disciplina.name)
    const exercicios = fs.readdirSync(disciplinaPath, { withFileTypes: true })
      .filter(d => d.isDirectory())

    const exerciciosList = []

    for (const ex of exercicios) {
      const exPath = path.join(disciplinaPath, ex.name)
      const manifestPath = path.join(exPath, 'manifest.json')
      const solucoesPath = path.join(exPath, 'solucoes')

      let manifest = { titulo: ex.name, enunciado: '' }
      if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      }

      let solucoes = []
      if (fs.existsSync(solucoesPath)) {
        solucoes = fs.readdirSync(solucoesPath)
          .filter(f => f.endsWith('.pas'))
          .map(f => f.replace('.pas', ''))
      }

      exerciciosList.push({ id: ex.name, ...manifest, solucoes })
    }

    result.push({ disciplina: disciplina.name, exercicios: exerciciosList })
  }

  return result
})

// Carrega o código de um arquivo .pas
ipcMain.handle('get-code', (_, disciplina, exercicio, aluno) => {
  const filePath = path.join(
    __dirname, '../../atividades',
    disciplina, exercicio, 'solucoes',
    `${aluno}.pas`
  )
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
  const exeFile = outFile + '.exe'

  fs.writeFileSync(srcFile, code, 'utf-8')

  // Remove executavel anterior se existir
  if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile)
  if (fs.existsSync(outFile)) fs.unlinkSync(outFile)

  return new Promise((resolve) => {
    const compile = spawn('fpc.exe', [srcFile, '-FE' + tmpDir, '-o' + exeFile], {
      cwd: tmpDir,
      shell: true
    })

    let compileOutput = ''
    compile.stdout.on('data', d => compileOutput += d.toString())
    compile.stderr.on('data', d => compileOutput += d.toString())

    compile.on('close', (exitCode) => {
      if (exitCode !== 0 || !fs.existsSync(exeFile)) {
        resolve({ success: false, output: compileOutput })
        return
      }

      runningProcess = spawn(exeFile, [], { cwd: tmpDir })
      const run = runningProcess
      let runOutput = ''

      run.stdout.on('data', d => {
        runOutput += d.toString()
        event.sender.send('run-output', d.toString())
      })
      run.stderr.on('data', d => {
        runOutput += d.toString()
        event.sender.send('run-output', d.toString())
      })

      run.on('close', () => {
        runningProcess = null
        resolve({ success: true, output: runOutput })
      })
    })
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})