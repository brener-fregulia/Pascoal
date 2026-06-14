<script lang="ts">
  import { onMount, afterUpdate } from 'svelte'
  import { tabStore } from '../stores/tabs'
  import { runActiveFile } from '../stores/runner'

  let editorEl: HTMLDivElement
  let aceEditor: any = null

  $: activeTab = $tabStore.tabs.find(t => t.id === $tabStore.activeTabId) ?? null

  onMount(() => {
    aceEditor = (window as any).ace.edit(editorEl)
    aceEditor.setTheme('ace/theme/tomorrow_night')
    aceEditor.setOptions({
      fontSize: '13px',
      showPrintMargin: false,
      highlightActiveLine: true,
      wrap: false,
    })
    aceEditor.renderer.setScrollMargin(16, 16, 0, 20)

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  })

  afterUpdate(() => {
    if (aceEditor && activeTab) {
      if (aceEditor.getSession() !== activeTab.session) {
        aceEditor.setSession(activeTab.session)
        aceEditor.resize()
        aceEditor.focus()
      }
    }
  })

  async function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      await save()
    }
    if (e.key === 'F5') {
      e.preventDefault()
      await runActiveFile()
    }
  }

  async function save() {
    const tab = tabStore.getActive()
    if (!tab || !window.__TAURI__) return

    const content = tab.session.getValue()

    if (tab.filePath) {
      try {
        await window.__TAURI__.core.invoke('save_file', { content, filePath: tab.filePath })
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

    const content = tab.session.getValue()
    try {
      const result = await window.__TAURI__.core.invoke<{ path: string } | null>('save_file_as', {
        content,
        suggestedName: tab.fileName,
      })
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
  <button class="run-btn" on:click={runActiveFile} title="Run (F5)">
    ⚡ Run
  </button>
</div>
<div id="ace-editor" bind:this={editorEl}></div>

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

  .run-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    padding: 4px 14px;
    border-radius: 4px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .run-btn:hover { opacity: 0.85; }
  .run-btn:active { opacity: 0.7; }

  #ace-editor {
    flex: 1;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
