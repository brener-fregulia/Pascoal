let aceEditor = null
let currentFilePath = null

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

function openInEditor(filePath, content) {
  if (!aceEditor) initEditor()

  currentFilePath = filePath
  aceEditor.setValue(content, -1)
  aceEditor.resize()

  const fileName = filePath.split(/[\\/]/).pop()

  document.getElementById('welcome').classList.add('hidden')
  document.getElementById('editor-wrapper').classList.add('visible')

  updateEditorTab(fileName)
}

function updateEditorTab(fileName) {
  const tabBar = document.getElementById('tab-bar')

  const existing = tabBar.querySelector('.tab.file-tab')
  if (existing) existing.remove()

  const tab = document.createElement('div')
  tab.className = 'tab file-tab active'
  tab.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
    ${fileName}
  `

  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
    tab.classList.add('active')
    document.getElementById('welcome').classList.add('hidden')
    document.getElementById('editor-wrapper').classList.add('visible')
  })

  const welcomeTab = tabBar.querySelector('.tab:not(.file-tab)')
  if (welcomeTab) {
    welcomeTab.classList.remove('active')
    welcomeTab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
      welcomeTab.classList.add('active')
      document.getElementById('welcome').classList.remove('hidden')
      document.getElementById('editor-wrapper').classList.remove('visible')
    })
  }

  tabBar.appendChild(tab)
}

function getCurrentCode() {
  if (aceEditor) return aceEditor.getValue()
  return ''
}

function getCurrentFilePath() {
  return currentFilePath
}
