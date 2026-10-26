<script lang="ts">
  import { i18n } from '../i18n'
  import PanelHeader from '../shared/PanelHeader.svelte'
</script>

<aside id="right-panel" aria-label={$i18n('right_panel.title')}>
  <PanelHeader title={$i18n('right_panel.title')} />
  <p class="empty">{$i18n('right_panel.empty')}</p>
</aside>

<style>
  #right-panel {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--sidebar);
    border-left: 1px solid var(--border);
  }

  .empty {
    margin: 0;
    padding: 16px 12px;
    font-family: var(--font-ui);
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-dim);
  }
</style>
