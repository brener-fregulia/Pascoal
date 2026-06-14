function initWelcome() {
  renderRecents([])

  document.getElementById('action-new-file')?.addEventListener('click', () => {
    console.log('new file — coming soon')
  })

  document.getElementById('action-open-file')?.addEventListener('click', handleOpenFile)

  document.getElementById('action-open-folder')?.addEventListener('click', () => {
    console.log('open folder — coming soon')
  })

  document.getElementById('action-new-project')?.addEventListener('click', () => {
    console.log('new project + git — coming soon')
  })

  document.getElementById('action-playground')?.addEventListener('click', () => {
    console.log('open playground — coming soon')
  })

  document.getElementById('action-configure-git')?.addEventListener('click', () => {
    console.log('configure git — coming soon')
  })
}

async function handleOpenFile() {
  if (!window.__TAURI__) return

  try {
    const result = await window.__TAURI__.core.invoke('open_file')
    if (result) {
      const [filePath, content] = result
      openInEditor(filePath, content)
    }
  } catch (e) {
    console.error('open_file failed:', e)
  }
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
