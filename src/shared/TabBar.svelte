<script lang="ts">
  import { tabStore } from '../editor/tabs'
  import { diffTabStore } from '../editor/diffTabs'
  import { i18n } from '../i18n'
  import Tab from './Tab.svelte'
  import Home from '../icons/Home.svelte'
  import File from '../icons/File.svelte'
  import Git from '../icons/Git.svelte'

  $: tabs = $tabStore.tabs
  $: diffTabs = $diffTabStore
  $: activeTabId = $tabStore.activeTabId
  $: activeView = $tabStore.activeView
</script>

<div id="tab-bar">
  <Tab
    label={$i18n('tabs.welcome')}
    active={activeView === 'welcome'}
    on:click={() => tabStore.showWelcome()}
    on:keydown={(e) => e.key === 'Enter' && tabStore.showWelcome()}
  >
    <Home slot="icon" size={14} />
  </Tab>

  {#each tabs as tab (tab.id)}
    <Tab
      label={tab.fileName}
      active={tab.id === activeTabId && activeView === 'editor'}
      isDirty={tab.isDirty}
      closable
      onClose={() => tabStore.close(tab.id)}
      on:click={() => tabStore.activate(tab.id)}
      on:keydown={(e) => e.key === 'Enter' && tabStore.activate(tab.id)}
    >
      <File slot="icon" size={14} />
    </Tab>
  {/each}

  {#each diffTabs as tab (tab.id)}
    <Tab
      label={tab.fileName}
      active={tab.id === activeTabId && activeView === 'diff'}
      closable
      readOnly
      readOnlyLabel={$i18n('tabs.read_only')}
      onClose={() => diffTabStore.close(tab.id)}
      on:click={() => tabStore.activateDiff(tab.id)}
      on:keydown={(e) => e.key === 'Enter' && tabStore.activateDiff(tab.id)}
    >
      <Git slot="icon" size={14} />
    </Tab>
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
</style>
