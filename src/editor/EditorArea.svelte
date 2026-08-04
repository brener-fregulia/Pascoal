<script lang="ts">
  import { onMount } from 'svelte'
  import { PaneGroup, Pane, PaneResizer } from 'paneforge'
  import FileTree from '../project/FileTree.svelte'
  import SearchPanel from '../project/SearchPanel.svelte'
  import GitPanel from '../integrations/git/GitPanel.svelte'
  import MainContent from './MainContent.svelte'

  export let activePanel: string | null

  $: hasSidePanel =
    activePanel === 'explorer' ||
    activePanel === 'search' ||
    activePanel === 'git'

  const ACTIVITY_BAR_WIDTH = 48
  const MIN_SIDEBAR_PX = 220
  const EDITOR_RESERVED_PX = 480
  const DEFAULT_SIDEBAR_PX = 220

  let windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
  let isDraggingResizer = false

  onMount(() => {
    function handleResize() {
      windowWidth = window.innerWidth
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  })

  $: groupWidth = Math.max(windowWidth - ACTIVITY_BAR_WIDTH, 1)
  $: minSizePct = (MIN_SIDEBAR_PX / groupWidth) * 100
  $: maxSizePct = Math.max(
    100 - (EDITOR_RESERVED_PX / groupWidth) * 100,
    minSizePct,
  )
  $: defaultSizePct = (DEFAULT_SIDEBAR_PX / groupWidth) * 100
</script>

<div id="editor-area">
  <div id="editor-content">
    {#if hasSidePanel}
      <PaneGroup
        direction="horizontal"
        autoSaveId="pascoal-side-panel"
        class="pane-group"
      >
        <Pane
          defaultSize={defaultSizePct}
          minSize={minSizePct}
          maxSize={maxSizePct}
          collapsible={true}
          collapsedSize={0}
        >
          <div id="side-panel">
            {#if activePanel === 'explorer'}
              <FileTree />
            {:else if activePanel === 'search'}
              <SearchPanel />
            {:else if activePanel === 'git'}
              <GitPanel />
            {/if}
          </div>
        </Pane>
        <PaneResizer
          class={`pane-resizer ${isDraggingResizer ? 'dragging' : ''}`}
          onDraggingChange={(dragging) => (isDraggingResizer = dragging)}
        />
        <Pane>
          <MainContent />
        </Pane>
      </PaneGroup>
    {:else}
      <MainContent />
    {/if}
  </div>
</div>

<style>
  #editor-area {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
  }

  #editor-content {
    flex: 1;
    display: flex;
    flex-direction: row;
    overflow: hidden;
  }

  :global(.pane-group) {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  :global(.pane-resizer) {
    width: 4px;
    flex-shrink: 0;
    background: transparent;
    cursor: col-resize;
    transition: background 0.1s;
  }

  :global(.pane-resizer:hover),
  :global(.pane-resizer.dragging) {
    background: var(--accent2);
  }

  #side-panel {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
</style>
