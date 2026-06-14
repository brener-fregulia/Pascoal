<script lang="ts">
  import Welcome from './Welcome.svelte'
  import TabBar from './TabBar.svelte'
  import Editor from './Editor.svelte'
  import Terminal from './Terminal.svelte'
  import { tabStore } from '../stores/tabs'
  import { terminalStore } from '../stores/terminal'

  $: hasOpenTabs = $tabStore.tabs.length > 0
  $: showTerminal = $terminalStore.visible
</script>

<div id="editor-area">
  <TabBar />
  <div id="editor-content">
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

    {#if showTerminal}
      <div id="terminal-area">
        <Terminal />
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
    flex-direction: column;
    overflow: hidden;
  }

  #view-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
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

  #terminal-area {
    height: 240px;
    flex-shrink: 0;
    overflow: hidden;
  }
</style>
