function initEditor() {
  const codeInput = document.getElementById('code-input')

  // Tab insere 2 espaços em vez de mudar o foco
  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = codeInput.selectionStart
      const end = codeInput.selectionEnd
      codeInput.value =
        codeInput.value.substring(0, start) + '  ' + codeInput.value.substring(end)
      codeInput.selectionStart = codeInput.selectionEnd = start + 2
    }
  })
}

function getCurrentCode() {
  return document.getElementById('code-input').value
}