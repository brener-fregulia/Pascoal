<script lang="ts">
  import { themeStore } from '../stores/theme'
  import { i18n } from '../i18n'
  import IconButton from './IconButton.svelte'
  import Folder from '../icons/Folder.svelte'
  import Search from '../icons/Search.svelte'
  import Git from '../icons/Git.svelte'
  import Play from '../icons/Play.svelte'
  import Sun from '../icons/Sun.svelte'
  import Settings from '../icons/Settings.svelte'

  export let activePanel: string | null

  $: items = [
    { id: 'explorer', label: $i18n('activity.explorer'), icon: Folder },
    { id: 'search', label: $i18n('activity.search'), icon: Search },
    { id: 'git', label: $i18n('activity.git'), icon: Git },
    { id: 'playground', label: $i18n('activity.playground'), icon: Play },
  ]

  function handleItemClick(id: string) {
    if (id === 'explorer' || id === 'search') {
      activePanel = activePanel === id ? null : id
    }
    // git, playground: future panels - do nothing for now
  }
</script>

<nav id="activity-bar">
  {#each items as item}
    <IconButton
      label={item.label}
      active={activePanel === item.id}
      on:click={() => handleItemClick(item.id)}
    >
      <svelte:component this={item.icon} size={20} />
    </IconButton>
  {/each}

  <div class="spacer"></div>

  <IconButton
    label={$i18n('activity.toggle_theme')}
    on:click={() => themeStore.cycle()}
  >
    <Sun size={20} />
  </IconButton>

  <IconButton label={$i18n('activity.settings')}>
    <Settings size={20} />
  </IconButton>
</nav>

<style>
  #activity-bar {
    background: var(--sidebar);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    gap: 2px;
  }

  .spacer {
    flex: 1;
  }
</style>
