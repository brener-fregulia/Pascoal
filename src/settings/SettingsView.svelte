<script lang="ts">
  import { i18n } from '../i18n'
  import PanelHeader from '../shared/PanelHeader.svelte'
  import IconButton from '../shared/IconButton.svelte'
  import X from '../icons/X.svelte'
  import ThemesSettings from './ThemesSettings.svelte'
  import LanguageSettings from './LanguageSettings.svelte'
  import GitSettings from './GitSettings.svelte'
  import ToolchainSettings from './ToolchainSettings.svelte'

  export let onClose: () => void

  type Leaf = 'themes' | 'language' | 'git' | 'toolchain'

  interface NavItem {
    id: Leaf
    labelKey: string
  }

  interface NavGroup {
    groupLabelKey?: string
    items: NavItem[]
  }

  const nav: NavGroup[] = [
    {
      groupLabelKey: 'settings.group_general',
      items: [
        { id: 'themes', labelKey: 'settings.section_themes' },
        { id: 'language', labelKey: 'settings.category_language' },
      ],
    },
    { items: [{ id: 'git', labelKey: 'settings.category_git' }] },
    { items: [{ id: 'toolchain', labelKey: 'settings.category_toolchain' }] },
  ]

  let activeLeaf: Leaf = 'themes'
</script>

<div id="settings-view">
  <PanelHeader title={$i18n('settings.title')}>
    <IconButton
      label={$i18n('settings.close')}
      variant="inline"
      on:click={onClose}
    >
      <X size={14} />
    </IconButton>
  </PanelHeader>

  <div id="settings-body">
    <nav id="settings-nav">
      {#each nav as group}
        <div class="nav-group">
          {#if group.groupLabelKey}
            <div class="nav-group-label">{$i18n(group.groupLabelKey)}</div>
          {/if}
          {#each group.items as item}
            <button
              class="nav-item"
              class:indented={!!group.groupLabelKey}
              class:active={activeLeaf === item.id}
              on:click={() => (activeLeaf = item.id)}
            >
              {$i18n(item.labelKey)}
            </button>
          {/each}
        </div>
      {/each}
    </nav>

    <div id="settings-content">
      {#if activeLeaf === 'themes'}
        <ThemesSettings />
      {:else if activeLeaf === 'language'}
        <LanguageSettings />
      {:else if activeLeaf === 'git'}
        <GitSettings />
      {:else if activeLeaf === 'toolchain'}
        <ToolchainSettings />
      {:else}
        <p class="placeholder">{$i18n('settings.coming_soon')}</p>
      {/if}
    </div>
  </div>
</div>

<style>
  #settings-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    background: var(--bg);
  }

  #settings-body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  #settings-nav {
    width: 200px;
    flex-shrink: 0;
    border-right: 1px solid var(--border);
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
  }

  .nav-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-group-label {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-dim);
  }

  .nav-item {
    text-align: left;
    padding: 6px 10px;
    border: none;
    background: transparent;
    border-radius: 4px;
    color: var(--text-dim);
    font-family: var(--font-ui);
    font-size: 13px;
    cursor: pointer;
  }

  .nav-item.indented {
    padding-left: 20px;
  }

  .nav-item:hover {
    background: rgba(128, 128, 128, 0.1);
    color: var(--text);
  }

  .nav-item.active {
    background: var(--panel);
    color: var(--text);
    font-weight: 600;
  }

  #settings-content {
    flex: 1;
    overflow: auto;
    padding: 24px;
  }

  .placeholder {
    color: var(--text-dim);
    font-family: var(--font-ui);
    font-size: 13px;
  }
</style>
