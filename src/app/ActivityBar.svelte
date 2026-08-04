<script lang="ts">
  import { i18n } from '../i18n'
  import { gitStore } from '../integrations/git/gitStore'
  import IconButton from '../shared/IconButton.svelte'
  import Folder from '../icons/Folder.svelte'
  import Search from '../icons/Search.svelte'
  import Git from '../icons/Git.svelte'
  import Play from '../icons/Play.svelte'
  import Settings from '../icons/Settings.svelte'

  export let activePanel: string | null

  $: items = [
    { id: 'explorer', label: $i18n('activity.explorer'), icon: Folder },
    { id: 'search', label: $i18n('activity.search'), icon: Search },
    ...(import.meta.env.DEV
      ? [
          { id: 'git', label: $i18n('activity.git'), icon: Git },
          { id: 'playground', label: $i18n('activity.playground'), icon: Play },
        ]
      : []),
  ]

  $: gitChangeCount = $gitStore.staged.length + $gitStore.unstaged.length

  function handleItemClick(id: string) {
    if (id === 'explorer' || id === 'search' || id === 'git') {
      activePanel = activePanel === id ? null : id
    }
  }
</script>

<nav id="activity-bar">
  {#each items as item}
    <div class="icon-wrap">
      <IconButton
        label={item.label}
        active={activePanel === item.id}
        on:click={() => handleItemClick(item.id)}
      >
        <svelte:component this={item.icon} size={20} />
      </IconButton>
      {#if item.id === 'git' && gitChangeCount > 0}
        <span class="badge">{gitChangeCount > 99 ? '99+' : gitChangeCount}</span
        >
      {/if}
    </div>
  {/each}

  <div class="spacer"></div>

  <IconButton
    label={$i18n('activity.settings')}
    active={activePanel === 'settings'}
    on:click={() =>
      (activePanel = activePanel === 'settings' ? null : 'settings')}
  >
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

  .icon-wrap {
    position: relative;
  }

  .badge {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    border-radius: 7px;
    background: var(--accent);
    color: var(--bg);
    font-size: 9px;
    font-weight: 700;
    line-height: 14px;
    text-align: center;
    pointer-events: none;
  }
</style>
