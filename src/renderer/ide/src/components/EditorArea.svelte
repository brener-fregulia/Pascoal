<script lang="ts">
  import Welcome from "./Welcome.svelte";
  import TabBar from "./TabBar.svelte";
  import Editor from "./Editor.svelte";
  import { tabStore } from "../stores/tabs";

  $: hasOpenTabs = $tabStore.tabs.length > 0;
</script>

<div id="editor-area">
  <TabBar />
  <div id="content">
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
</div>

<style>
  #editor-area {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
  }

  #content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
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
</style>
