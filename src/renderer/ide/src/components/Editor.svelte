<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import { EditorView } from '@codemirror/view'
  import { tabStore } from '../stores/tabs'
  import { themeStore } from '../stores/theme'
  import { explorerStore } from '../stores/explorerStore'
  import { runActiveFile } from '../stores/runner'
  import { themeCompartment } from '../stores/editor-extensions'
  import { buildPascoalTheme } from '../stores/editor-theme'
  import { i18n } from '../i18n'
  import IconButton from './IconButton.svelte'
  import Play from '../icons/Play.svelte'

  let editorEl: HTMLDivElement
  let view: EditorView | null = null
  let currentTabId: string | null = null

  $effect(() => {
    const activeTab =
      $tabStore.tabs.find((t) => t.id === $tabStore.activeTabId) ?? null
    if (!view || !activeTab) return
    if (activeTab.id === currentTabId) return
    view.setState(activeTab.state)
    currentTabId = activeTab.id
    view.focus()
  })

  $effect(() => {
    const _theme = $themeStore.current
    if (!view) return
    Promise.resolve().then(() => {
      view?.dispatch({
        effects: themeCompartment.reconfigure(buildPascoalTheme()),
      })
    })
  })

  onMount(() => {
    const activeTab =
      $tabStore.tabs.find((t) => t.id === $tabStore.activeTabId) ?? null

    view = new EditorView({
      state: activeTab?.state,
      parent: editorEl,
      dispatch(tr) {
        if (!view) return
        view.update([tr])
        const tabId = currentTabId
        if (tabId && tr.docChanged) {
          tabStore.updateEditorState(tabId, view.state)
        }
      },
    })

    currentTabId = activeTab?.id ?? null
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  })

  onDestroy(() => {
    view?.destroy()
  })

  async function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault()
      await saveAs()
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      await save()
    }
    if (e.key === 'F5') {
      e.preventDefault()
      await runActiveFile()
    }
  }

  function getContent(): string {
    return view?.state.doc.toString() ?? ''
  }

  async function save() {
    const tab = tabStore.getActive()
    if (!tab || !window.__TAURI__) return
    const content = getContent()
    if (tab.filePath) {
      try {
        await window.__TAURI__.core.invoke('save_file', {
          content,
          filePath: tab.filePath,
        })
        tabStore.markClean(tab.id)
      } catch (e) {
        console.error('save_file failed:', e)
      }
    } else {
      await saveAs()
    }
  }

  async function saveAs() {
    const tab = tabStore.getActive()
    if (!tab || !window.__TAURI__) return
    const content = getContent()
    const folderPath = get(explorerStore).folder?.path ?? null
    try {
      const result = (await window.__TAURI__.core.invoke('save_file_as', {
        content,
        suggestedName: tab.fileName,
        folderPath,
      })) as { path: string } | null
      if (result) {
        tabStore.updateFilePath(tab.id, result.path)
        tabStore.markClean(tab.id)
      }
    } catch (e) {
      console.error('save_file_as failed:', e)
    }
  }
</script>

<div id="editor-toolbar">
  <IconButton
    variant="toolbar"
    label={$i18n('editor.run')}
    title="Run (F5)"
    on:click={runActiveFile}
  >
    <Play size={14} stroke="#fff" />
    <span class="run-label">{$i18n('editor.run')}</span>
  </IconButton>
</div>
<div id="codemirror-editor" bind:this={editorEl}></div>

<style>
  #editor-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 4px 12px;
    background: var(--panel);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .run-label {
    margin-left: 6px;
  }

  #codemirror-editor {
    flex: 1;
    overflow: hidden;
    height: 100%;
  }

  #codemirror-editor :global(.cm-editor) {
    height: 100%;
    font-family: var(--font-mono);
    font-size: 13px;
    font-variant-ligatures: none;
    user-select: text;
    cursor: text;
  }

  #codemirror-editor :global(.cm-scroller) {
    overflow: auto;
  }
</style>
