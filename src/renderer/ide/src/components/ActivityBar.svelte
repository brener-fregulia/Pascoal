<script lang="ts">
  import { themeStore } from '../stores/theme'
  import { explorerStore } from '../stores/explorerStore'
  import { i18n, localeStore, LOCALE_OPTIONS, type Locale } from '../i18n'
  import IconButton from './IconButton.svelte'
  import Folder from '../icons/Folder.svelte'
  import Search from '../icons/Search.svelte'
  import Git from '../icons/Git.svelte'
  import Play from '../icons/Play.svelte'
  import Sun from '../icons/Sun.svelte'
  import Settings from '../icons/Settings.svelte'

  export let activePanel: string | null

  let showLocalePicker = false

  $: items = [
    { id: 'explorer', label: $i18n('activity.explorer'), icon: Folder },
    { id: 'search', label: $i18n('activity.search'), icon: Search },
    { id: 'git', label: $i18n('activity.git'), icon: Git },
    { id: 'playground', label: $i18n('activity.playground'), icon: Play },
  ]

  $: currentCode = $localeStore

  function handleItemClick(id: string) {
    if (id === 'explorer') {
      // Toggle explorer panel
      activePanel = activePanel === 'explorer' ? null : 'explorer'
    }
    // search, git, playground: future panels — do nothing for now
  }

  function selectLocale(locale: Locale) {
    localeStore.set(locale)
    showLocalePicker = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') showLocalePicker = false
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if showLocalePicker}
  <div class="backdrop" on:click={() => (showLocalePicker = false)}></div>
{/if}

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

  <!-- Locale button -->
  <div class="locale-wrapper">
    <button
      class="locale-btn"
      title="Change language"
      on:click={() => (showLocalePicker = !showLocalePicker)}
    >
      {currentCode}
    </button>

    {#if showLocalePicker}
      <div class="locale-popover">
        {#each LOCALE_OPTIONS as option}
          <button
            class="locale-option"
            class:active={option.value === $localeStore}
            on:click={() => selectLocale(option.value)}
          >
            {option.value}
          </button>
        {/each}
      </div>
    {/if}
  </div>

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

  .locale-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .locale-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.03em;
    line-height: 1.2;
    text-align: center;
    border-radius: 6px;
    transition:
      color 0.15s,
      background 0.15s;
    padding: 0 2px;
    word-break: break-all;
  }

  .locale-btn:hover {
    color: var(--text);
    background: rgba(128, 128, 128, 0.1);
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .locale-popover {
    position: absolute;
    bottom: 0;
    left: calc(100% + 6px);
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);
    z-index: 100;
    overflow: hidden;
    padding: 4px 0;
    min-width: 100px;
  }

  .locale-option {
    display: block;
    width: 100%;
    padding: 7px 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    text-align: left;
    transition:
      background 0.1s,
      color 0.1s;
  }

  .locale-option:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text);
  }

  .locale-option.active {
    color: var(--accent2);
  }
</style>
