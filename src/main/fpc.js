const { dialog, shell } = require('electron')
const { execSync, spawn } = require('child_process')
const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')

const FPC_URLS = {
  win32: 'https://sourceforge.net/projects/freepascal/files/Win32/3.2.2/fpc-3.2.2.i386-win32.exe/download',
  linux: 'https://sourceforge.net/projects/freepascal/files/Linux/3.2.2/fpc-3.2.2.x86_64-linux.tar',
  darwin: 'https://sourceforge.net/projects/freepascal/files/Mac%20OS%20X/3.2.2/fpc-3.2.2.intel-macosx.dmg/download'
}

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
    const output = execSync('fpc -iV', { encoding: 'utf-8' })
    return output.trim()
  } catch {
    return null
  }
}

function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const follow = (currentUrl) => {
      https.get(currentUrl, (res) => {
        // Segue redirecionamentos (SourceForge redireciona muito)
        if (res.statusCode === 301 || res.statusCode === 302) {
          follow(res.headers.location)
          return
        }

        const total = parseInt(res.headers['content-length'] || '0', 10)
        let downloaded = 0
        const file = fs.createWriteStream(destPath)

        res.on('data', (chunk) => {
          downloaded += chunk.length
          file.write(chunk)
          if (total > 0 && onProgress) {
            onProgress(Math.round((downloaded / total) * 100))
          }
        })

        res.on('end', () => { file.end(); resolve() })
        res.on('error', reject)
      }).on('error', reject)
    }

    follow(url)
  })
}

async function promptInstallFpc(win) {
  const result = await dialog.showMessageBox(win, {
    type: 'question',
    title: 'Free Pascal nao encontrado',
    message: 'O compilador Free Pascal (FPC) nao foi encontrado na sua maquina.',
    detail: 'O FPC e necessario para compilar e executar os programas Pascal. Deseja abrir a pagina de download?',
    buttons: ['Abrir download', 'Cancelar'],
    defaultId: 0,
    cancelId: 1
  })

  if (result.response === 0) {
    const url = FPC_URLS[process.platform] || FPC_URLS.win32
    shell.openExternal(url)

    await dialog.showMessageBox(win, {
      type: 'info',
      title: 'Instrucoes de instalacao',
      message: 'Apos instalar o FPC:',
      detail: '1. Conclua a instalacao normalmente\n2. Reinicie o Bastos.pas\n3. Tente executar novamente',
      buttons: ['OK']
    })
  }

  return false
}

module.exports = { isFpcInstalled, getFpcVersion, promptInstallFpc }