let aceEditor = null
const tabs = []
let activeTabId = null

// ─── Tab model ───────────────────────────────────────────────────────────────

async function createTab(filePath, content) {
  const id = `tab-${Date.now()}`

  let fileName
  if (filePath) {
    fileName = filePath.split(/[\\/]/).pop()
  } else {
    const existingNames = tabs.map(t => t.fileName)
    let candidate = 'untitled.pas'
    let n = 1

    while (
      existingNames.includes(candidate) ||
      (window.__TAURI__ && await window.__TAURI__.core.invoke('file_exists', {
        path: `${window.__documentsDir}/${candidate}`
      }))
    ) {
      n++
      candidate = `untitled-${n}.pas`
    }
    fileName = candidate
  }

  const session = ace.createEditSession(content, 'ace/mode/pascal')
  session.setTabSize(2)
  session.setUseSoftTabs(true)

  let initialized = false
  session.on('change', () => {
    if (!initialized) {
      initialized = true
      return
    }
    markTabDirty(id)
  })

  const tab = { id, filePath, fileName, isDirty: false, session }
  tabs.push(tab)
  return tab
}

function getTab(id) {
  return tabs.find(t => t.id === id)
}

function getActiveTab() {
  return getTab(activeTabId)
}
// ─── Editor init ─────────────────────────────────────────────────────────────

function initEditor() {
  aceEditor = ace.edit('ace-editor')
  aceEditor.setTheme('ace/theme/tomorrow_night')
  aceEditor.setOptions({
    fontSize: '13px',
    showPrintMargin: false,
    highlightActiveLine: true,
    wrap: false
  })
  aceEditor.renderer.setScrollMargin(16, 16, 0, 20)

  document.addEventListener('keydown', async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      await handleSave()
    }
  })
}

// ─── Open / New ──────────────────────────────────────────────────────────────

async function openInEditor(filePath, content) {
  if (!aceEditor) initEditor()

  if (filePath) {
    const existing = tabs.find(t => t.filePath === filePath)
    if (existing) {
      activateTab(existing.id)
      return
    }
  }

  const tab = await createTab(filePath, content)
  renderTab(tab)
  activateTab(tab.id)
}

// ─── Tab rendering ───────────────────────────────────────────────────────────

function renderTab(tab) {
  const tabBar = document.getElementById('tab-bar')

  // Configura o Welcome tab uma única vez
  const welcomeTab = tabBar.querySelector('.tab:not(.file-tab)')
  if (welcomeTab && !welcomeTab.dataset.listenerSet) {
    welcomeTab.dataset.listenerSet = 'true'
    welcomeTab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
      welcomeTab.classList.add('active')
      document.getElementById('welcome').classList.remove('hidden')
      document.getElementById('editor-wrapper').classList.remove('visible')
    })
  }

  const el = document.createElement('div')
  el.className = 'tab file-tab'
  el.dataset.tabId = tab.id
  el.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
    <span class="tab-name">${tab.fileName}</span>
    <button class="tab-close" aria-label="Close tab">
      <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <line x1="2" y1="2" x2="8" y2="8"/>
        <line x1="8" y1="2" x2="2" y2="8"/>
      </svg>
    </button>
  `

  el.addEventListener('click', (e) => {
    if (e.target.closest('.tab-close')) return
    activateTab(tab.id)
  })

  el.querySelector('.tab-close').addEventListener('click', (e) => {
    e.stopPropagation()
    closeTab(tab.id)
  })

  tabBar.appendChild(el)
}

function activateTab(id) {
  activeTabId = id
  const tab = getTab(id)
  if (!tab) return

  aceEditor.setSession(tab.session)
  aceEditor.resize()
  aceEditor.focus()

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
  const el = document.querySelector(`.tab[data-tab-id="${id}"]`)
  if (el) el.classList.add('active')

  document.getElementById('welcome').classList.add('hidden')
  document.getElementById('editor-wrapper').classList.add('visible')
}

async function closeTab(id) {
  const tab = getTab(id)
  if (!tab) return

  if (tab.isDirty) {
    const confirmed = confirm(`"${tab.fileName}" has unsaved changes. Close anyway?`)
    if (!confirmed) return
  }

  const index = tabs.findIndex(t => t.id === id)
  tabs.splice(index, 1)

  const el = document.querySelector(`.tab[data-tab-id="${id}"]`)
  if (el) el.remove()

  if (activeTabId === id) {
    if (tabs.length > 0) {
      const next = tabs[Math.min(index, tabs.length - 1)]
      activateTab(next.id)
    } else {
      activeTabId = null
      document.getElementById('welcome').classList.remove('hidden')
      document.getElementById('editor-wrapper').classList.remove('visible')

      const welcomeTab = document.querySelector('.tab:not(.file-tab)')
      if (welcomeTab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
        welcomeTab.classList.add('active')
      }
    }
  }
}

// ─── Dirty state ─────────────────────────────────────────────────────────────

function markTabDirty(id) {
  const tab = getTab(id)
  if (!tab || tab.isDirty) return
  tab.isDirty = true

  const el = document.querySelector(`.tab[data-tab-id="${id}"] .tab-name`)
  if (el && !el.textContent.startsWith('●')) {
    el.textContent = '● ' + el.textContent
  }
}

function markTabClean(id) {
  const tab = getTab(id)
  if (!tab) return
  tab.isDirty = false

  const el = document.querySelector(`.tab[data-tab-id="${id}"] .tab-name`)
  if (el) el.textContent = el.textContent.replace('● ', '')
}

// ─── Save ────────────────────────────────────────────────────────────────────

async function handleSave() {
  const tab = getActiveTab()
  if (!tab || !window.__TAURI__) return

  const content = tab.session.getValue()

  if (tab.filePath) {
    try {
      await window.__TAURI__.core.invoke('save_file', {
        content,
        filePath: tab.filePath
      })
      markTabClean(tab.id)
    } catch (e) {
      console.error('save_file failed:', e)
    }
  } else {
    await handleSaveAs()
  }
}

async function handleSaveAs() {
  const tab = getActiveTab()
  if (!tab || !window.__TAURI__) return

  const content = tab.session.getValue()

  try {
    const result = await window.__TAURI__.core.invoke('save_file_as', {
      content,
      suggestedName: tab.fileName
    })
    if (result) {
      tab.filePath = result.path
      tab.fileName = result.path.split(/[\\/]/).pop()
      markTabClean(tab.id)

      const nameEl = document.querySelector(`.tab[data-tab-id="${tab.id}"] .tab-name`)
      if (nameEl) nameEl.textContent = tab.fileName
    }
  } catch (e) {
    console.error('save_file_as failed:', e)
  }
}

// ─── Public ──────────────────────────────────────────────────────────────────

function getCurrentCode() {
  const tab = getActiveTab()
  return tab ? tab.session.getValue() : ''
}

function getCurrentFilePath() {
  return getActiveTab()?.filePath ?? null
}