<script lang="ts">
  import { i18n } from '../i18n'
  import PanelHeader from '../shared/PanelHeader.svelte'
  import IconButton from '../shared/IconButton.svelte'
  import X from '../icons/X.svelte'

  export let onClose: () => void

  type Category = 'appearance' | 'language' | 'git' | 'toolchain'

  const categories: { id: Category; labelKey: string }[] = [
    { id: 'appearance', labelKey: 'settings.category_appearance' },
    { id: 'language', labelKey: 'settings.category_language' },
    { id: 'git', labelKey: 'settings.category_git' },
    { id: 'toolchain', labelKey: 'settings.category_toolchain' },
  ]

  let activeCategory: Category = 'appearance'
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
      {#each categories as category}
        <button
          class="nav-item"
          class:active={activeCategory === category.id}
          on:click={() => (activeCategory = category.id)}
        >
          {$i18n(category.labelKey)}
        </button>
      {/each}
    </nav>

    <div id="settings-content">
      <p class="placeholder">{$i18n('settings.coming_soon')}</p>
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
    gap: 2px;
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