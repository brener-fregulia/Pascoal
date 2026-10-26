<script lang="ts">
  import { onMount } from 'svelte'
  import { PaneGroup, Pane, PaneResizer } from 'paneforge'
  import FileTree from '../project/FileTree.svelte'
  import SearchPanel from '../project/SearchPanel.svelte'
  import GitPanel from '../integrations/git/GitPanel.svelte'
  import MainContent from './MainContent.svelte'
  import RightPanel from '../app/RightPanel.svelte'
  import { rightPanelStore } from '../app/rightPanel'
  import { loadSidePanelWidth, saveSidePanelWidth } from './sidePanelWidth'

  export let activePanel: string | null

  $: hasSidePanel =
    activePanel === 'explorer' ||
    activePanel === 'search' ||
    activePanel === 'git'

  const ACTIVITY_BAR_WIDTH = 48
  const MIN_SIDEBAR_PX = 220
  const EDITOR_RESERVED_PX = 480
  const DEFAULT_SIDEBAR_PX = 220
  const MIN_RIGHT_PX = 200
  const DEFAULT_RIGHT_PX = 260
  const RESIZE_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End']

  let windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
  let isDraggingResizer = false
  let sidebarPx = loadSidePanelWidth(DEFAULT_SIDEBAR_PX)
  let sidebarSizePct = 0
  let userResizing = false
  let userResized = false

  onMount(() => {
    function handleResize() {
      windowWidth = window.innerWidth
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  })

  $: groupWidth = Math.max(windowWidth - ACTIVITY_BAR_WIDTH, 1)
  $: minSizePct = (MIN_SIDEBAR_PX / groupWidth) * 100
  // The right panel is only shown when it fits next to the left sidebar
  // without taking the editor below its reserve. Otherwise it stays hidden
  // and the user's choice is kept, so it returns once there is room.
  $: fitsRightPanel =
    groupWidth >=
    (hasSidePanel ? MIN_SIDEBAR_PX : 0) + MIN_RIGHT_PX + EDITOR_RESERVED_PX
  $: showRightPanel = $rightPanelStore.open && fitsRightPanel
  $: rightPanelStore.setAvailable(fitsRightPanel)
  $: maxSizePct = Math.max(
    100 -
      ((EDITOR_RESERVED_PX + (showRightPanel ? MIN_RIGHT_PX : 0)) /
        groupWidth) *
        100,
    minSizePct,
  )
  $: defaultSizePct = (sidebarPx / groupWidth) * 100

  let rightPx = DEFAULT_RIGHT_PX
  let rightSizePct = 0
  let isDraggingRightResizer = false
  let rightUserResizing = false
  let rightUserResized = false

  $: rightMinPct = (MIN_RIGHT_PX / groupWidth) * 100
  $: rightMaxPct = Math.max(
    100 -
      (((hasSidePanel ? MIN_SIDEBAR_PX : 0) + EDITOR_RESERVED_PX) /
        groupWidth) *
        100,
    rightMinPct,
  )
  $: rightDefaultPct = (rightPx / groupWidth) * 100

  // Same rule as the sidebar: only drags and keyboard resizes change the
  // preferred width, never clamping caused by a narrower window.
  function beginRightUserResize() {
    rightUserResizing = true
    rightUserResized = false
  }

  function handleRightResize(size: number) {
    rightSizePct = size
    if (rightUserResizing) rightUserResized = true
  }

  function endRightUserResize() {
    rightUserResizing = false
    if (!rightUserResized || rightSizePct <= 0) return
    rightPx = Math.round((rightSizePct / 100) * groupWidth)
  }

  function handleRightDraggingChange(dragging: boolean) {
    isDraggingRightResizer = dragging
    if (dragging) beginRightUserResize()
    else endRightUserResize()
  }

  // Only drags and keyboard resizes change the preferred width; clamping
  // caused by a narrower window must not overwrite it.
  function beginUserResize() {
    userResizing = true
    userResized = false
  }

  function handleSidebarResize(size: number) {
    sidebarSizePct = size
    if (userResizing) userResized = true
  }

  function endUserResize() {
    userResizing = false
    // A collapsed panel keeps the last expanded width for its next opening.
    if (!userResized || sidebarSizePct <= 0) return
    sidebarPx = Math.round((sidebarSizePct / 100) * groupWidth)
    saveSidePanelWidth(sidebarPx)
  }

  function handleDraggingChange(dragging: boolean) {
    isDraggingResizer = dragging
    if (dragging) beginUserResize()
    else endUserResize()
  }
</script>

<div id="editor-area">
  <div id="editor-content">
    <PaneGroup direction="horizontal" class="pane-group">
      {#if hasSidePanel}
        <Pane
          order={1}
          defaultSize={defaultSizePct}
          minSize={minSizePct}
          maxSize={maxSizePct}
          collapsible={true}
          collapsedSize={0}
          onResize={handleSidebarResize}
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
          onDraggingChange={handleDraggingChange}
          onkeydown={(e: KeyboardEvent) =>
            RESIZE_KEYS.includes(e.key) && beginUserResize()}
          onkeyup={(e: KeyboardEvent) =>
            RESIZE_KEYS.includes(e.key) && endUserResize()}
        />
      {/if}
      <Pane order={2}>
        <MainContent />
      </Pane>
      {#if showRightPanel}
        <PaneResizer
          class={`pane-resizer ${isDraggingRightResizer ? 'dragging' : ''}`}
          onDraggingChange={handleRightDraggingChange}
          onkeydown={(e: KeyboardEvent) =>
            RESIZE_KEYS.includes(e.key) && beginRightUserResize()}
          onkeyup={(e: KeyboardEvent) =>
            RESIZE_KEYS.includes(e.key) && endRightUserResize()}
        />
        <Pane
          order={3}
          defaultSize={rightDefaultPct}
          minSize={rightMinPct}
          maxSize={rightMaxPct}
          onResize={handleRightResize}
        >
          <RightPanel />
        </Pane>
      {/if}
    </PaneGroup>
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
