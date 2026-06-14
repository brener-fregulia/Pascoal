const path = require('path')
const fs   = require('fs')
const { EXAMPLES_DIR, SOLUTIONS_DIR } = require('../constants')

function register(ipcMain) {
  ipcMain.handle('get-examples', () => {
    const baseDir = path.join(__dirname, '../../../', EXAMPLES_DIR)
    const result  = []

    if (!fs.existsSync(baseDir)) return result

    const categories = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .sort((a, b) => {
        if (a.name === 'HelloWorld') return -1
        if (b.name === 'HelloWorld') return 1
        return a.name.localeCompare(b.name)
      })

    for (const category of categories) {
      const categoryPath = path.join(baseDir, category.name)
      const examples     = findExamples(categoryPath, categoryPath)
      result.push({ category: category.name, examples })
    }

    return result
  })

  ipcMain.handle('get-code', (_, exPath, solution) => {
    const filePath = path.join(exPath, SOLUTIONS_DIR, `${solution}.pas`)
    if (!fs.existsSync(filePath)) return ''
    return fs.readFileSync(filePath, 'utf-8')
  })
}

function findExamples(basePath, currentPath) {
  const entries     = fs.readdirSync(currentPath, { withFileTypes: true })
  const hasManifest = entries.some(e => e.name === 'manifest.json')

  if (hasManifest) {
    const manifestPath = path.join(currentPath, 'manifest.json')
    const solutionsPath = path.join(currentPath, SOLUTIONS_DIR)
    const manifest     = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

    let solutions = []
    if (fs.existsSync(solutionsPath)) {
      solutions = fs.readdirSync(solutionsPath)
        .filter(f => f.endsWith('.pas'))
        .map(f => f.replace('.pas', ''))
    }

    const rel      = path.relative(basePath, currentPath)
    const parts    = rel.split(path.sep)
    const group    = parts.length > 1 ? parts.slice(0, -1).join(' / ') : ''

    return [{
      id: path.basename(currentPath),
      path: currentPath,
      group,
      ...manifest,
      solutions
    }]
  }

  // Not an example folder, recurse into subdirectories
  const subDirs  = entries.filter(e => e.isDirectory())
  const examples = []
  for (const sub of subDirs) {
    const found = findExamples(basePath, path.join(currentPath, sub.name))
    examples.push(...found)
  }
  return examples
}

module.exports = { register }
