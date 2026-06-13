const path = require('path')
const fs = require('fs')
const { ACTIVITIES_DIR, SOLUTIONS_DIR } = require('../constants')

function register(ipcMain) {
  ipcMain.handle('get-activities', () => {
    const baseDir = path.join(__dirname, '../../../', ACTIVITIES_DIR)
    const result = []

    if (!fs.existsSync(baseDir)) return result

    const disciplinas = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .sort((a, b) => {
        if (a.name === 'HelloWorld') return -1
        if (b.name === 'HelloWorld') return 1
        return a.name.localeCompare(b.name)
      })

    for (const disciplina of disciplinas) {
      const disciplinaPath = path.join(baseDir, disciplina.name)
      const exercicios = findExercicios(disciplinaPath, disciplinaPath)
      result.push({ disciplina: disciplina.name, exercicios })
    }

    return result
  })

  ipcMain.handle('get-code', (_, exPath, aluno) => {
    const filePath = path.join(exPath, SOLUTIONS_DIR, `${aluno}.pas`)
    if (!fs.existsSync(filePath)) return ''
    return fs.readFileSync(filePath, 'utf-8')
  })
}

function findExercicios(basePath, currentPath) {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true })
  const hasManifest = entries.some(e => e.name === 'manifest.json')

  if (hasManifest) {
    const manifestPath = path.join(currentPath, 'manifest.json')
    const solucoesPath = path.join(currentPath, SOLUTIONS_DIR)
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

    let solucoes = []
    if (fs.existsSync(solucoesPath)) {
      solucoes = fs.readdirSync(solucoesPath)
        .filter(f => f.endsWith('.pas'))
        .map(f => f.replace('.pas', ''))
    }

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

  const subDirs = entries.filter(e => e.isDirectory())
  const exercicios = []
  for (const sub of subDirs) {
    const found = findExercicios(basePath, path.join(currentPath, sub.name))
    exercicios.push(...found)
  }
  return exercicios
}

module.exports = { register }