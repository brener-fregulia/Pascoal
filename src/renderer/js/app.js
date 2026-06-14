async function loadPartial(containerId, partialPath) {
  const response = await fetch(partialPath)
  const template = await response.text()
  const html     = Mustache.render(template, getAll())
  document.getElementById(containerId).innerHTML = html
}

async function initApp() {
  await initI18n()

  await loadPartial('titlebar',          'partials/titlebar.html')
  await loadPartial('sidebar-container', 'partials/sidebar.html')
  await loadPartial('editor-container',  'partials/editor.html')
  await loadPartial('terminal-container','partials/terminal.html')
  await loadPartial('modal-container',   'partials/modal-welcome.html')

  initTitlebar()
  initEditor()
  initTerminal()
  initResize()

  const overlay  = document.getElementById('modal-overlay')
  const closeBtn = document.getElementById('modal-close')
  closeBtn.addEventListener('click', () => overlay.classList.add('hidden'))

  if (window.api) {
    const info = await window.api.getAppInfo()
    renderStatusbar(info)
    await loadExamples()
  } else {
    renderStatusbar({ name: t('app.name'), version: '-', fpc: { installed: false, version: null } })
    renderMockExamples()
  }
}

function renderStatusbar(info) {
  const fpcLabel = info.fpc.installed
    ? `FPC ${info.fpc.version}`
    : t('statusbar.fpc_not_found')

  document.getElementById('statusbar-container').innerHTML = `
    <span>${fpcLabel}</span>
    <span>${t('statusbar.separator')}</span>
    <span>${info.name} v${info.version}</span>
  `
}

async function loadExamples() {
  const examples = await window.api.getExamples()
  renderExamples(examples)

  const firstItem = document.querySelector('.sidebar-item')
  if (firstItem) firstItem.click()
}

function renderMockExamples() {
  renderExamples([{
    category: 'Examples',
    examples: [{ id: 'HelloWorld', title: 'Hello World', solutions: ['example'] }]
  }])
}

function renderExamples(data) {
  const tree = document.getElementById('examples-tree')
  tree.innerHTML = ''

  for (const { category, examples } of data) {
    const section = document.createElement('div')
    section.className = 'sidebar-section'

    const header = document.createElement('div')
    header.className = 'sidebar-category-header collapsed'
    header.textContent = category.replace(/([0-9]+)/, ' $1')

    const list = document.createElement('div')
    list.className = 'sidebar-examples hidden'

    header.addEventListener('click', () => {
      header.classList.toggle('collapsed')
      list.classList.toggle('hidden')
    })

    // Group by group field
    const groups = {}
    for (const ex of examples) {
      const g = ex.group || ''
      if (!groups[g]) groups[g] = []
      groups[g].push(ex)
    }

    for (const [group, exList] of Object.entries(groups)) {
      if (group) {
        const groupHeader = document.createElement('div')
        groupHeader.className = 'sidebar-group collapsed'
        groupHeader.textContent = group.replace(/_/g, ' ')

        const groupList = document.createElement('div')
        groupList.className = 'sidebar-group-list hidden'

        groupHeader.addEventListener('click', () => {
          groupHeader.classList.toggle('collapsed')
          groupList.classList.toggle('hidden')
        })

        for (const ex of exList) groupList.appendChild(makeSidebarItem(ex))

        list.appendChild(groupHeader)
        list.appendChild(groupList)
      } else {
        for (const ex of exList) list.appendChild(makeSidebarItem(ex))
      }
    }

    section.appendChild(header)
    section.appendChild(list)
    tree.appendChild(section)
  }
}

function makeSidebarItem(ex) {
  const item = document.createElement('div')
  item.className = 'sidebar-item'
  item.textContent = ex.title || ex.id
  item.addEventListener('click', () => selectExample(item, ex))
  return item
}

function selectExample(itemEl, ex) {
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'))
  itemEl.classList.add('active')

  document.getElementById('editor-title').textContent    = ex.title || ex.id
  document.getElementById('description-text').textContent = ex.description || t('editor.no_enunciado')

  const select = document.getElementById('solution-select')
  select.innerHTML = `<option value="">${t('sidebar.select_placeholder')}</option>`

  for (const solution of ex.solutions) {
    const opt = document.createElement('option')
    opt.value       = solution
    opt.textContent = solution
    select.appendChild(opt)
  }

  select.onchange = () => {
    if (select.value) loadCode(ex.path, select.value)
  }

  if (ex.solutions.length > 0) {
    select.value = ex.solutions[0]
    loadCode(ex.path, ex.solutions[0])
  }
}

async function loadCode(exPath, solution) {
  if (!window.api) return
  const code = await window.api.getCode(exPath, solution)
  setEditorCode(code)
}

document.addEventListener('DOMContentLoaded', initApp)
