<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import { EditorView } from '@codemirror/view'
  import { undo, redo } from '@codemirror/commands'
  import { tabStore } from './tabs'
  import { themeStore } from '../shared/theme'
  import { explorerStore } from '../project/explorerStore'
  import { pendingJumpLine } from '../project/searchStore'
  import { runActiveFile } from '../toolchain/runner'
  import { gitStore } from '../integrations/git/gitStore'
  import { themeCompartment } from './editor-extensions'
  import { buildPascoalTheme } from './editor-theme'
  import { copySelection, cutSelection, pasteFromClipboard } from './editorClipboard'
  import { activeFocusStore } from '../shared/activeFocus'
  import {
    settingsStore,
    MIN_FONT_SIZE,
    MAX_FONT_SIZE,
    DEFAULT_FONT_SIZE,
  } from '../settings/settingsStore'
  import { i18n } from '../i18n'
  import IconButton from '../shared/IconButton.svelte'
  import FindWidget from './FindWidget.svelte'
  import Play from '../icons/Play.svelte'
  import { isTauriAvailable, invoke } from '../integrations/tauri/client'

  let editorEl: HTMLDivElement
  let view = $state<EditorView | null>(null)
  let currentTabId: string | null = null

  let showFind = $state(false)
  let showReplace = $state(false)
  let findFocusTick = $state(0)

  let unlistenUndo: (() => void) | null = null
  let unlistenRedo: (() => void) | null = null
  let unlistenCut: (() => void) | null = null
  let unlistenCopy: (() => void) | null = null
  let unlistenPaste: (() => void) | null = null
  let unlistenFind: (() => void) | null = null
  let unlistenReplace: (() => void) | null = null

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
    const fontSize = $settingsStore.fontSize
    if (!view) return
    Promise.resolve().then(() => {
      view?.dispatch({
        effects: themeCompartment.reconfigure(buildPascoalTheme(fontSize)),
      })
    })
  })

  // Jump to a specific line after a search result is clicked.
  $effect(() => {
    const line = $pendingJumpLine
    if (line === null) return

    Promise.resolve().then(() => {
      if (!view) return
      const totalLines = view.state.doc.lines
      const target = Math.min(Math.max(line, 1), totalLines)
      const lineInfo = view.state.doc.line(target)

      view.dispatch({
        selection: { anchor: lineInfo.from, head: lineInfo.to },
        effects: EditorView.scrollIntoView(lineInfo.from, { y: 'center' }),
      })
      view.focus()
      pendingJumpLine.set(null)
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
    editorEl.addEventListener('wheel', handleWheel, { passive: false })
    editorEl.addEventListener('focusin', handleFocusIn)

    setupMenuListeners()

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      editorEl.removeEventListener('wheel', handleWheel)
      editorEl.removeEventListener('focusin', handleFocusIn)
    }
  })

  onDestroy(() => {
    unlistenUndo?.()
    unlistenRedo?.()
    unlistenCut?.()
    unlistenCopy?.()
    unlistenPaste?.()
    unlistenFind?.()
    unlistenReplace?.()
    view?.destroy()
  })

  function handleFocusIn() {
    activeFocusStore.set('editor')
  }

  // Cut/Copy/Paste from the Edit menu act on the editor unless the file
  // explorer's tree currently owns keyboard focus - the explorer has its own
  // path-based clipboard (see FileTree.svelte) and its own `menu-cut`/
  // `menu-copy`/`menu-paste` listeners guarded the opposite way. A `null`
  // focus (nothing focused yet) is treated as "editor" since it's the main
  // content area.
  async function setupMenuListeners() {
    if (!isTauriAvailable()) return
    try {
      const { listen } = await import('@tauri-apps/api/event')

      unlistenUndo = await listen('menu-undo', () => {
        if (!view) return
        undo(view)
        view.focus()
      })

      unlistenRedo = await listen('menu-redo', () => {
        if (!view) return
        redo(view)
        view.focus()
      })

      unlistenCut = await listen('menu-cut', async () => {
        if (!view || get(activeFocusStore) === 'explorer') return
        await cutSelection(view)
        view.focus()
      })

      unlistenCopy = await listen('menu-copy', async () => {
        if (!view || get(activeFocusStore) === 'explorer') return
        await copySelection(view)
        view.focus()
      })

      unlistenPaste = await listen('menu-paste', async () => {
        if (!view || get(activeFocusStore) === 'explorer') return
        await pasteFromClipboard(view)
        view.focus()
      })

      unlistenFind = await listen('menu-find', () => {
        showFind = true
        findFocusTick++
      })

      unlistenReplace = await listen('menu-replace', () => {
        showFind = true
        showReplace = true
        findFocusTick++
      })
    } catch (e) {
      console.error('Editor menu event listeners failed to register:', e)
    }
  }

  async function handleKeydown(e: KeyboardEvent) {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === 'f' &&
      !e.shiftKey
    ) {
      e.preventDefault()
      showFind = true
      findFocusTick++
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
      e.preventDefault()
      showFind = true
      showReplace = true
      findFocusTick++
      return
    }
    if (e.key === 'Escape' && showFind) {
      showFind = false
      return
    }
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
      return
    }
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.code === 'Equal' || e.code === 'NumpadAdd' || e.key === '+' || e.key === '=')
    ) {
      e.preventDefault()
      zoomBy(1)
      return
    }
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.code === 'Minus' || e.code === 'NumpadSubtract' || e.key === '-')
    ) {
      e.preventDefault()
      zoomBy(-1)
      return
    }
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.code === 'Digit0' || e.code === 'Numpad0' || e.key === '0')
    ) {
      e.preventDefault()
      resetZoom()
    }
  }

  function clampFontSize(size: number): number {
    return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, size))
  }

  function zoomBy(delta: number) {
    const current = get(settingsStore).fontSize
    settingsStore.updateSetting('fontSize', clampFontSize(current + delta))
  }

  function resetZoom() {
    settingsStore.updateSetting('fontSize', DEFAULT_FONT_SIZE)
  }

  function handleWheel(e: WheelEvent) {
    if (!(e.ctrlKey || e.metaKey)) return
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 1 : -1)
  }

  function getContent(): string {
    return view?.state.doc.toString() ?? ''
  }

  async function save() {
    const tab = tabStore.getActive()
    if (!tab || !isTauriAvailable()) return
    const content = getContent()
    if (tab.filePath) {
      try {
        await invoke('save_file', {
          content,
          filePath: tab.filePath,
        })
        tabStore.markClean(tab.id)
        explorerStore.refresh()
        gitStore.refresh()
      } catch (e) {
        console.error('save_file failed:', e)
      }
    } else {
      await saveAs()
    }
  }

  async function saveAs() {
    const tab = tabStore.getActive()
    if (!tab || !isTauriAvailable()) return
    const content = getContent()
    const folderPath = get(explorerStore).folder?.path ?? null
    try {
      const result = await invoke<{ path: string } | null>('save_file_as', {
        content,
        suggestedName: tab.fileName,
        folderPath,
      })
      if (result) {
        tabStore.updateFilePath(tab.id, result.path)
        tabStore.markClean(tab.id)
        explorerStore.refresh()
        gitStore.refresh()
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
<div id="editor-body">
  <div
    id="codemirror-editor"
    bind:this={editorEl}
    style="--editor-font-size: {$settingsStore.fontSize}px"
  ></div>
  <FindWidget
    bind:open={showFind}
    bind:showReplace
    {view}
    focusTick={findFocusTick}
  />
</div>

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

  #editor-body {
    position: relative;
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  #codemirror-editor {
    flex: 1;
    overflow: hidden;
    height: 100%;
  }

  #codemirror-editor :global(.cm-editor) {
    height: 100%;
    font-family: var(--font-mono);
    font-size: var(--editor-font-size, 13px);
    font-variant-ligatures: none;
    user-select: text;
    cursor: text;
  }

  #codemirror-editor :global(.cm-scroller) {
    overflow: auto;
  }

  /* Custom find-match highlight - controlled entirely by FindWidget,
     not the default CodeMirror search panel decorations */
  #codemirror-editor :global(.cm-pascal-match) {
    background-color: rgba(255, 193, 7, 0.35);
    border-radius: 2px;
  }

  :global([data-theme='light']) #codemirror-editor :global(.cm-pascal-match) {
    background-color: rgba(255, 152, 0, 0.4);
  }

  #codemirror-editor :global(.cm-pascal-match-selected) {
    background-color: rgba(255, 152, 0, 0.75);
    outline: 1.5px solid rgba(255, 111, 0, 0.9);
    border-radius: 2px;
  }

  :global([data-theme='light'])
    #codemirror-editor
    :global(.cm-pascal-match-selected) {
    background-color: rgba(255, 111, 0, 0.55);
    outline-color: rgba(230, 81, 0, 0.9);
  }
</style>
