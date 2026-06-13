async function loadPartial(containerId, partialPath) {
  const response = await fetch(partialPath)
  const html = await response.text()
  document.getElementById(containerId).innerHTML = html
}

async function initApp() {
  await loadPartial('sidebar-container', 'partials/sidebar.html')
  await loadPartial('editor-container', 'partials/editor.html')
  await loadPartial('terminal-container', 'partials/terminal.html')
  await loadPartial('modal-container', 'partials/modal-welcome.html')

  initEditor()
  initTerminal()
  initResize()

  // Modal de boas-vindas
  const overlay = document.getElementById('modal-overlay')
  const closeBtn = document.getElementById('modal-close')
  closeBtn.addEventListener('click', () => overlay.classList.add('hidden'))

  // Info do app vinda do main process (versão, FPC, etc)
  if (window.api) {
    const info = await window.api.getAppInfo()
    renderStatusbar(info)
    await loadActivities()
  } else {
    renderStatusbar({ name: 'Pascoal', version: '—', fpc: { installed: false, version: null } })
    renderMockActivities()
  }
}

function renderStatusbar(info) {
  const fpcLabel = info.fpc.installed
    ? `FPC ${info.fpc.version}`
    : 'FPC não encontrado'

  document.getElementById('statusbar-container').innerHTML = `
    <span>${fpcLabel}</span>
    <span>|</span>
    <span>${info.name} v${info.version}</span>
  `
}

async function loadActivities() {
  const activities = await window.api.getActivities()
  renderActivities(activities)

  const firstItem = document.querySelector('.sidebar-item')
  if (firstItem) firstItem.click()
}

function renderMockActivities() {
  renderActivities([{
    disciplina: 'Exemplos',
    exercicios: [
      { id: 'HelloWorld', titulo: 'Hello World', solucoes: ['exemplo'] }
    ]
  }])
}

function renderActivities(activities) {
  const tree = document.getElementById('activities-tree')
  tree.innerHTML = ''

  for (const { disciplina, exercicios } of activities) {
    const section = document.createElement('div')
    section.className = 'sidebar-section'

    const header = document.createElement('div')
    header.className = 'sidebar-disciplina collapsed'
    header.textContent = disciplina.replace(/([0-9]+)/, ' $1')

    const list = document.createElement('div')
    list.className = 'sidebar-exercicios hidden'

    header.addEventListener('click', () => {
      header.classList.toggle('collapsed')
      list.classList.toggle('hidden')
    })

    // Agrupa por categoria
    const categorias = {}
    for (const ex of exercicios) {
      const cat = ex.categoria || ''
      if (!categorias[cat]) categorias[cat] = []
      categorias[cat].push(ex)
    }

    for (const [cat, exList] of Object.entries(categorias)) {
      if (cat) {
        const catHeader = document.createElement('div')
        catHeader.className = 'sidebar-categoria collapsed'
        catHeader.textContent = cat.replace(/_/g, ' ')

        const catList = document.createElement('div')
        catList.className = 'sidebar-categoria-lista hidden'

        catHeader.addEventListener('click', () => {
          catHeader.classList.toggle('collapsed')
          catList.classList.toggle('hidden')
        })

        for (const ex of exList) catList.appendChild(makeSidebarItem(ex))

        list.appendChild(catHeader)
        list.appendChild(catList)
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
  item.textContent = ex.titulo || ex.id
  item.addEventListener('click', () => selectExercicio(item, ex))
  return item
}

function selectExercicio(itemEl, ex) {
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'))
  itemEl.classList.add('active')

  document.getElementById('editor-title').textContent = ex.titulo || ex.id
  document.getElementById('enunciado-text').textContent = ex.enunciado || 'Sem enunciado.'

  const select = document.getElementById('aluno-select')
  select.innerHTML = '<option value="">— selecionar —</option>'

  for (const aluno of ex.solucoes) {
    const opt = document.createElement('option')
    opt.value = aluno
    opt.textContent = aluno
    select.appendChild(opt)
  }

  select.onchange = () => {
    if (select.value) loadCode(ex.path, select.value)
  }

  if (ex.solucoes.length > 0) {
    select.value = ex.solucoes[0]
    loadCode(ex.path, ex.solucoes[0])
  }
}

async function loadCode(exPath, aluno) {
  if (!window.api) return
  const code = await window.api.getCode(exPath, aluno)
  setEditorCode(code)
}

document.addEventListener('DOMContentLoaded', initApp)