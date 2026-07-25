<script lang="ts">
  export let label: string
  export let active: boolean = false
  export let variant: 'activity' | 'welcome' | 'toolbar' | 'inline' = 'activity'
  export let title: string = ''
</script>

<button
  class="icon-btn {variant}"
  class:active
  aria-label={label}
  {title}
  on:click
>
  <slot />
  {#if variant === 'welcome'}
    <span>{label}</span>
  {/if}
</button>

<style>
  .icon-btn {
    display: flex;
    align-items: center;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--text-dim);
    transition:
      color 0.15s,
      background 0.15s;
  }

  /* ── activity bar ── */
  .activity {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    justify-content: center;
  }

  .activity:hover {
    color: var(--text);
    background: rgba(128, 128, 128, 0.1);
  }

  .activity.active {
    color: var(--accent2);
  }

  /* ── welcome screen ── */
  .welcome {
    gap: 10px;
    padding: 8px 0;
    font-size: 13px;
    font-family: var(--font-ui);
    color: var(--accent2);
    width: 100%;
    text-align: left;
  }

  .welcome:hover {
    color: var(--text);
  }

  /* ── toolbar (run button etc.) ── */
  .toolbar {
    background: var(--accent);
    color: #fff;
    padding: 4px 14px;
    border-radius: 4px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 600;
  }

  .toolbar:hover {
    opacity: 0.85;
  }
  .toolbar:active {
    opacity: 0.7;
  }

  /* ── inline (clear, close in panel headers) ── */
  .inline {
    font-size: 11px;
    font-family: var(--font-ui);
    padding: 2px 8px;
    border-radius: 3px;
    background: var(--panel);
    border: 1px solid var(--border);
  }

  .inline:hover {
    color: var(--text);
    background: var(--border);
  }
</style>
