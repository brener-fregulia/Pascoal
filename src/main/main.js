const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

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

// Compila e executa o código Pascal
ipcMain.handle('run-code', async (event, code) => {
  const tmpDir = path.join(app.getPath('temp'), 'bastos-pas')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

  const srcFile = path.join(tmpDir, 'programa.pas')
  const outFile = path.join(tmpDir, 'programa')

  fs.writeFileSync(srcFile, code, 'utf-8')

  return new Promise((resolve) => {
    // Tenta encontrar o fpc no PATH
    const fpc = process.platform === 'win32' ? 'fpc.exe' : 'fpc'

    const compile = spawn(fpc, ['-o' + outFile, srcFile])
    let compileOutput = ''

    compile.stdout.on('data', d => compileOutput += d.toString())
    compile.stderr.on('data', d => compileOutput += d.toString())

    compile.on('close', (code) => {
      if (code !== 0) {
        resolve({ success: false, output: compileOutput })
        return
      }

      const exe = process.platform === 'win32' ? outFile + '.exe' : outFile
      const run = spawn(exe, [], { cwd: tmpDir })
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
        resolve({ success: true, output: runOutput })
      })
    })
  })
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})