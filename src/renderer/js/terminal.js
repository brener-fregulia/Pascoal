function initTerminal() {
  const runBtn   = document.getElementById('run-btn')
  const clearBtn = document.getElementById('clear-btn')
  const input    = document.getElementById('terminal-input')

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
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1b\][^\x07]*\x07/g, '')
    .replace(/\x1b[()][A-Z0-9]/g, '')
    .replace(/\x1b[@-Z\\-_]/g, '')
    .replace(/\x1b\[\?[0-9;]*[a-zA-Z]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/\x1b\[2J/g, '')
    .replace(/\x1b\[m/g, '')
    .replace(/\x1b\[H/g, '')
}

function printLine(text, type = '') {
  const output = document.getElementById('terminal-output')
  const clean  = stripAnsi(text)
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
    printLine(t('terminal.no_code'), 'error')
    return
  }

  const runBtn = document.getElementById('run-btn')
  runBtn.disabled  = true
  runBtn.textContent = t('terminal.btn_running')

  clearTerminal()
  printLine(t('terminal.compiling'), 'info')

  if (window.api) {
    window.api.removeOutput()
    window.api.onOutput((data) => printLine(data))

    const result = await window.api.runCode(code)

    if (!result.success) {
      printLine(t('terminal.compile_error'), 'error')
      printLine(result.output, 'error')
    } else {
      printLine(t('terminal.run_success'), 'success')
    }
  } else {
    printLine(t('terminal.no_electron'),  'dim')
    printLine(t('terminal.no_electron2'), 'dim')
  }

  runBtn.disabled    = false
  runBtn.textContent = `\u25B6 ${t('terminal.btn_run')}`
}
