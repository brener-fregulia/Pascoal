<script lang="ts">
  import Welcome from './Welcome.svelte'
  import TabBar from './TabBar.svelte'
  import Editor from './Editor.svelte'
  import Console from './Console.svelte'
  import FileTree from './FileTree.svelte'
  import SearchPanel from './SearchPanel.svelte'
  import { tabStore } from '../stores/tabs'
  import { consoleStore } from '../stores/console'

  export let activePanel: string | null

  $: hasOpenTabs = $tabStore.tabs.length > 0
  $: showConsole = $consoleStore.visible
  $: position = $consoleStore.position
  $: showFileTree = activePanel === 'explorer'
  $: showSearchPanel = activePanel === 'search'
</script>

<div id="editor-area">
  <TabBar />
  <div id="editor-content" class:right={position === 'right'}>
    {#if showFileTree}
      <div id="side-panel">
        <FileTree />
      </div>
    {:else if showSearchPanel}
      <div id="side-panel">
        <SearchPanel />
      </div>
    {/if}

    <div id="view-area">
      {#if !hasOpenTabs || $tabStore.activeView === 'welcome'}
        <Welcome />
      {/if}
      <div
        id="editor-wrapper"
        class:visible={hasOpenTabs && $tabStore.activeView === 'editor'}
      >
        <Editor />
      </div>
    </div>

    {#if showConsole}
      <div id="console-area" class:right={position === 'right'}>
        <Console />
      </div>
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

  #side-panel {
    width: 220px;
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  #view-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    min-width: 0;
  }

  #editor-wrapper {
    display: none;
    flex: 1;
    overflow: hidden;
  }

  #editor-wrapper.visible {
    display: flex;
    flex-direction: column;
  }

  #console-area {
    height: 240px;
    flex-shrink: 0;
    overflow: hidden;
  }

  #console-area.right {
    height: auto;
    width: 420px;
  }
</style>
