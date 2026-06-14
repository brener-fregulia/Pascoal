function initWelcome() {
  renderRecents([])

  document.getElementById('action-new-file')?.addEventListener('click', () => {
    console.log('new file')
  })

  document.getElementById('action-open-file')?.addEventListener('click', () => {
    console.log('open file')
  })

  document.getElementById('action-open-folder')?.addEventListener('click', () => {
    console.log('open folder')
  })

  document.getElementById('action-new-project')?.addEventListener('click', () => {
    console.log('new project + git')
  })

  document.getElementById('action-playground')?.addEventListener('click', () => {
    console.log('open playground')
  })

  document.getElementById('action-configure-git')?.addEventListener('click', () => {
    console.log('configure git')
  })
}

function renderRecents(recents) {
  const list = document.getElementById('recent-list')
  if (!list) return

  if (!recents || recents.length === 0) {
    list.innerHTML = '<div class="recent-empty">No recent projects.</div>'
    return
  }

  list.innerHTML = recents.map(r => `
    <div class="recent-item" data-path="${r.path}">
      <svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
      <span class="recent-name">${r.name}</span>
      <span class="recent-path">${r.path}</span>
    </div>
  `).join('')

  list.querySelectorAll('.recent-item').forEach(el => {
    el.addEventListener('click', () => {
      console.log('open recent:', el.dataset.path)
    })
  })
}
