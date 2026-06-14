let aceEditor = null
let currentFilePath = null
let isDirty = false

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

  aceEditor.session.on('change', () => {
    if (!isDirty) {
      isDirty = true
      markTabDirty()
    }
  })

  // Ctrl+S / Cmd+S
  document.addEventListener('keydown', async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      await handleSave()
    }
  })
}

function openInEditor(filePath, content) {
  if (!aceEditor) initEditor()

  currentFilePath = filePath
  isDirty = false
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
    <span class="tab-name">${fileName}</span>
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

function markTabDirty() {
  const tab = document.querySelector('.tab.file-tab .tab-name')
  if (tab && !tab.textContent.startsWith('●')) {
    tab.textContent = '● ' + tab.textContent
  }
}

function markTabClean() {
  const tab = document.querySelector('.tab.file-tab .tab-name')
  if (tab) {
    tab.textContent = tab.textContent.replace('● ', '')
  }
}

async function handleSave() {
  if (!aceEditor || !window.__TAURI__) return

  const content = aceEditor.getValue()

  if (currentFilePath) {
    try {
      await window.__TAURI__.core.invoke('save_file', {
        content,
        filePath: currentFilePath
      })
      isDirty = false
      markTabClean()
    } catch (e) {
      console.error('save_file failed:', e)
    }
  } else {
    await handleSaveAs()
  }
}

async function handleSaveAs() {
  if (!aceEditor || !window.__TAURI__) return

  const content = aceEditor.getValue()

  try {
    const result = await window.__TAURI__.core.invoke('save_file_as', { content })
    if (result) {
      currentFilePath = result.path
      isDirty = false
      const fileName = result.path.split(/[\\/]/).pop()
      updateEditorTab(fileName)
    }
  } catch (e) {
    console.error('save_file_as failed:', e)
  }
}

function getCurrentCode() {
  if (aceEditor) return aceEditor.getValue()
  return ''
}

function getCurrentFilePath() {
  return currentFilePath
}
