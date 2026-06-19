<script lang="ts">
  export let title: string;
</script>

<div class="panel-header">
  <span class="panel-title">{title}</span>
  <div class="panel-actions">
    <slot />
  </div>
</div>

<style>
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    height: 32px;
    background: var(--panel);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .panel-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-dim);
  }

  .panel-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
