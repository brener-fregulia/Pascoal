function initResize() {
  const handle    = document.getElementById('resize-handle')
  const editor    = document.getElementById('editor-container')
  const terminal  = document.getElementById('terminal-container')
  const workspace = document.getElementById('workspace')

  let dragging        = false
  let startX          = 0
  let startEditorWidth = 0

  handle.addEventListener('mousedown', (e) => {
    dragging         = true
    startX           = e.clientX
    startEditorWidth = editor.getBoundingClientRect().width
    handle.classList.add('dragging')
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'
  })

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return
    const totalWidth   = workspace.getBoundingClientRect().width
    const delta        = e.clientX - startX
    let newEditorWidth = startEditorWidth + delta

    // Min/max limits
    const min = 200
    const max = totalWidth - 200 - 5
    newEditorWidth = Math.max(min, Math.min(max, newEditorWidth))

    editor.style.flex  = 'none'
    editor.style.width = newEditorWidth + 'px'
    terminal.style.flex = '1'
  })

  document.addEventListener('mouseup', () => {
    if (!dragging) return
    dragging = false
    handle.classList.remove('dragging')
    document.body.style.cursor     = ''
    document.body.style.userSelect = ''
  })
}
