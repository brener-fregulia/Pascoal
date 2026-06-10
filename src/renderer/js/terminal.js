function initTerminal() {
  const runBtn = document.getElementById('run-btn')
  const clearBtn = document.getElementById('clear-btn')

  runBtn.addEventListener('click', runCode)
  clearBtn.addEventListener('click', clearTerminal)
}

function printLine(text, type = '') {
  const output = document.getElementById('terminal-output')
  const line = document.createElement('div')
  line.textContent = text
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