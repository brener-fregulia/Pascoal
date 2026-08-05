<script lang="ts">
  import TabBar from '../shared/TabBar.svelte'
  import Welcome from '../app/Welcome.svelte'
  import Editor from './Editor.svelte'
  import Console from '../toolchain/Console.svelte'
  import DiffView from '../integrations/git/DiffView.svelte'
  import { tabStore } from './tabs'
  import { diffTabStore } from './diffTabs'
  import { consoleStore } from '../toolchain/console'

  $: hasOpenTabs = $tabStore.tabs.length > 0
  $: hasOpenDiffTabs = $diffTabStore.length > 0
  $: showWelcome =
    $tabStore.activeView === 'welcome' || (!hasOpenTabs && !hasOpenDiffTabs)
  $: showConsole = $consoleStore.visible
  $: position = $consoleStore.position
  $: activeDiffTab =
    $diffTabStore.find((t) => t.id === $tabStore.activeTabId) ?? null
</script>

<div id="main-content">
  <TabBar />
  <div id="content-row">
    <div id="view-area">
      {#if showWelcome}
        <Welcome />
      {/if}
      <div
        id="editor-wrapper"
        class:visible={hasOpenTabs && $tabStore.activeView === 'editor'}
      >
        <Editor />
      </div>
      {#if $tabStore.activeView === 'diff' && activeDiffTab}
        <div id="diff-wrapper">
          {#key activeDiffTab.id}
            <DiffView
              original={activeDiffTab.original}
              modified={activeDiffTab.modified}
            />
          {/key}
        </div>
      {/if}
    </div>

    {#if showConsole}
      <div id="console-area" class:right={position === 'right'}>
        <Console />
      </div>
    {/if}
  </div>
</div>

<style>
  #main-content {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  #content-row {
    flex: 1;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    min-height: 0;
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

  #diff-wrapper {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
</style>
