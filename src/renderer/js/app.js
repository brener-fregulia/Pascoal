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

  // Statusbar simples
  document.getElementById('statusbar-container').innerHTML = `
    <span>FPC — Free Pascal</span>
    <span>|</span>
    <span>Bastos.pas v0.1.0</span>
  `

  // Modal de boas-vindas
  const overlay = document.getElementById('modal-overlay')
  const closeBtn = document.getElementById('modal-close')

  closeBtn.addEventListener('click', () => {
    overlay.classList.add('hidden')
  })

  // Carrega atividades (só funciona no Electron, não no browser)
  if (window.api) {
    await loadActivities()
  } else {
    renderMockActivities()
  }

  // Inicializa editor e terminal
  initEditor()
  initTerminal()
}

async function loadActivities() {
  const activities = await window.api.getActivities()
  renderActivities(activities)
}

function renderMockActivities() {
  const mock = [
    {
      disciplina: 'Algoritmos1',
      exercicios: [
        { id: 'HelloWorld', titulo: 'Hello World', solucoes: ['exemplo'] }
      ]
    }
  ]
  renderActivities(mock)
}

function renderActivities(activities) {
  const tree = document.getElementById('activities-tree')
  tree.innerHTML = ''

  for (const { disciplina, exercicios } of activities) {
    const section = document.createElement('div')
    section.className = 'sidebar-section'

    const header = document.createElement('div')
    header.className = 'sidebar-disciplina'
    header.textContent = disciplina.replace(/([0-9]+)/, ' $1')

    const list = document.createElement('div')
    list.className = 'sidebar-exercicios'

    header.addEventListener('click', () => {
      header.classList.toggle('collapsed')
      list.classList.toggle('hidden')
    })

    for (const ex of exercicios) {
      const item = document.createElement('div')
      item.className = 'sidebar-item'
      item.textContent = ex.titulo || ex.id
      item.dataset.disciplina = disciplina
      item.dataset.exercicio = ex.id
      item.dataset.solucoes = JSON.stringify(ex.solucoes)
      item.dataset.enunciado = ex.enunciado || ''

      item.addEventListener('click', () => selectExercicio(item, ex))
      list.appendChild(item)
    }

    section.appendChild(header)
    section.appendChild(list)
    tree.appendChild(section)
  }
}

function selectExercicio(itemEl, ex) {
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'))
  itemEl.classList.add('active')

  document.getElementById('editor-title').textContent = ex.titulo || ex.id
  document.getElementById('enunciado-text').textContent = ex.enunciado || 'Sem enunciado.'

  const select = document.getElementById('aluno-select')
  select.innerHTML = '<option value="">— selecionar aluno —</option>'

  for (const aluno of ex.solucoes) {
    const opt = document.createElement('option')
    opt.value = aluno
    opt.textContent = aluno
    select.appendChild(opt)
  }

  select.dataset.disciplina = itemEl.dataset.disciplina
  select.dataset.exercicio = ex.id

  select.onchange = () => {
    if (select.value) loadCode(select.dataset.disciplina, select.dataset.exercicio, select.value)
  }

  // Carrega o primeiro aluno automaticamente
  if (ex.solucoes.length > 0) {
    select.value = ex.solucoes[0]
    loadCode(itemEl.dataset.disciplina, ex.id, ex.solucoes[0])
  }
}

async function loadCode(disciplina, exercicio, aluno) {
  if (window.api) {
    const code = await window.api.getCode(disciplina, exercicio, aluno)
    document.getElementById('code-input').value = code
  }
}

document.addEventListener('DOMContentLoaded', initApp)