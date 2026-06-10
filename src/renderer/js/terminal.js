function initTerminal() {
  const runBtn = document.getElementById('run-btn')
  const clearBtn = document.getElementById('clear-btn')
  const input = document.getElementById('terminal-input')

  runBtn.addEventListener('click', runCode)
  clearBtn.addEventListener('click', clearTerminal)

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const val = input.value
      printLine('> ' + val, 'dim')
      input.value = ''
      if (window.api) await window.api.sendInput(val)
    }
  })
}

function stripAnsi(str) {
  return str
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')        // ESC[ sequencias CSI
    .replace(/\x1b\][^\x07]*\x07/g, '')             // ESC] OSC sequences
    .replace(/\x1b[()][A-Z0-9]/g, '')               // ESC( charset
    .replace(/\x1b[@-Z\\-_]/g, '')                  // ESC de dois chars
    .replace(/\[\?[0-9;]*[a-zA-Z]/g, '')            // [? sequencias sem ESC
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')  // outros controles
    .replace(/\[2J/g, '')                            // clear screen
    .replace(/\[m/g, '')                             // reset color
    .replace(/\[H/g, '')                             // cursor home
}

function printLine(text, type = '') {
  const output = document.getElementById('terminal-output')
  const clean = stripAnsi(text)
  if (!clean) return
  const line = document.createElement('div')
  line.textContent = clean
  if (type) line.classList.add(`line-${type}`)
  output.appendChild(line)
  output.scrollTop = output.scrollHeight
}

function clearTerminal() {
  document.getElementById('terminal-output').innerHTML = ''
}

async function runCode() {
  const code = getCurrentCode()

  if (!code.trim()) {
    printLine('Nenhum codigo para executar.', 'error')
    return
  }

  const runBtn = document.getElementById('run-btn')
  runBtn.disabled = true
  runBtn.textContent = 'Compilando...'

  clearTerminal()
  printLine('Compilando...', 'info')

  if (window.api) {
    // Remove listener anterior antes de adicionar novo
    window.api.removeOutput()

    window.api.onOutput((data) => {
      printLine(data)
    })

    const result = await window.api.runCode(code)

    if (!result.success) {
      printLine('Erro de compilacao:', 'error')
      printLine(result.output, 'error')
    } else {
      printLine('Executado com sucesso.', 'success')
    }
  } else {
    printLine('Execute dentro do Electron para compilar Pascal.', 'dim')
    printLine('No navegador, apenas a interface esta disponivel.', 'dim')
  }

  runBtn.disabled = false
  runBtn.textContent = 'Executar'
}