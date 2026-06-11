let aceEditor = null

function initEditor() {
  aceEditor = ace.edit('ace-editor')
  aceEditor.setTheme('ace/theme/tomorrow_night')
  aceEditor.session.setMode('ace/mode/pascal')
  aceEditor.setOptions({
    fontSize: '13px',
    showPrintMargin: false,
    highlightActiveLine: true,
    tabSize: 2,
    useSoftTabs: true,
    wrap: false
  })
  aceEditor.renderer.setScrollMargin(16, 16, 0, 20)
}

function getCurrentCode() {
  if (aceEditor) return aceEditor.getValue()
  return ''
}

function setEditorCode(code) {
  if (aceEditor) {
    aceEditor.setValue(code, -1)
  }
}