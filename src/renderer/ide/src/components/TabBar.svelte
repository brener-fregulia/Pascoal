<script lang="ts">
  import { tabStore } from "../stores/tabs";
  import Home from "../icons/Home.svelte";
  import File from "../icons/File.svelte";
  import X from "../icons/X.svelte";

  $: tabs = $tabStore.tabs;
  $: activeTabId = $tabStore.activeTabId;
  $: activeView = $tabStore.activeView;
</script>

<div id="tab-bar">
  <button
    class="tab"
    class:active={activeView === "welcome"}
    on:click={() => tabStore.showWelcome()}
  >
    <Home size={14} />
    Welcome
  </button>

  {#each tabs as tab (tab.id)}
    <div
      class="tab file-tab"
      class:active={tab.id === activeTabId && activeView === "editor"}
      role="tab"
      tabindex="0"
      on:click={() => tabStore.activate(tab.id)}
      on:keydown={(e) => e.key === "Enter" && tabStore.activate(tab.id)}
    >
      <File size={14} />
      <span class="tab-name">
        {tab.isDirty ? `● ${tab.fileName}` : tab.fileName}
      </span>
      <button
        class="tab-close"
        aria-label="Close {tab.fileName}"
        on:click|stopPropagation={() => tabStore.close(tab.id)}
      >
        <X size={10} />
      </button>
    </div>
  {/each}
</div>

<style>
  #tab-bar {
    background: var(--panel);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: stretch;
    height: 35px;
    flex-shrink: 0;
    overflow-x: auto;
  }

  #tab-bar::-webkit-scrollbar {
    height: 0;
  }

  .tab {
    padding: 0 12px;
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-family: var(--font-ui);
    color: var(--text-dim);
    border: none;
    border-right: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
    white-space: nowrap;
    transition:
      color 0.15s,
      background 0.15s;
    flex-shrink: 0;
  }

  .tab:hover {
    color: var(--text);
    background: rgba(255, 255, 255, 0.03);
  }

  .tab.active {
    color: var(--text);
    background: var(--bg);
    border-top: 1px solid var(--accent);
  }

  .file-tab {
    padding: 0 12px;
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-family: var(--font-ui);
    color: var(--text-dim);
    border-right: 1px solid var(--border);
    cursor: pointer;
    white-space: nowrap;
    transition:
      color 0.15s,
      background 0.15s;
    flex-shrink: 0;
    outline: none;
  }

  .file-tab:hover {
    color: var(--text);
    background: rgba(255, 255, 255, 0.03);
  }

  .file-tab.active {
    color: var(--text);
    background: var(--bg);
    border-top: 1px solid var(--accent);
  }

  .tab-close {
    width: 16px;
    height: 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    color: var(--text-dim);
    padding: 0;
    margin-left: 2px;
    opacity: 0;
    transition:
      opacity 0.15s,
      background 0.15s;
    flex-shrink: 0;
  }

  .file-tab:hover .tab-close,
  .file-tab.active .tab-close {
    opacity: 1;
  }

  .tab-close:hover {
    background: rgba(255, 255, 255, 0.12);
    color: var(--text);
  }
</style>
