<script lang="ts">
  import Welcome from "./Welcome.svelte";
  import TabBar from "./TabBar.svelte";
  import Editor from "./Editor.svelte";
  import Console from "./Console.svelte";
  import { tabStore } from "../stores/tabs";
  import { consoleStore } from "../stores/console";

  $: hasOpenTabs = $tabStore.tabs.length > 0;
  $: showConsole = $consoleStore.visible;
  $: position = $consoleStore.position;
</script>

<div id="editor-area">
  <TabBar />
  <div id="editor-content" class:right={position === "right"}>
    <div id="view-area">
      {#if !hasOpenTabs || $tabStore.activeView === "welcome"}
        <Welcome />
      {/if}
      <div
        id="editor-wrapper"
        class:visible={hasOpenTabs && $tabStore.activeView === "editor"}
      >
        <Editor />
      </div>
    </div>

    {#if showConsole}
      <div id="console-area" class:right={position === "right"}>
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
    flex-direction: column;
    overflow: hidden;
  }

  #editor-content.right {
    flex-direction: row;
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
