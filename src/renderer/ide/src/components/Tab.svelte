<script lang="ts">
  import X from '../icons/X.svelte'

  export let label: string
  export let active: boolean = false
  export let isDirty: boolean = false
  export let closable: boolean = false
  export let onClose: (() => void) | null = null
</script>

<div class="tab" class:active role="tab" tabindex="0" on:click on:keydown>
  <slot name="icon" />

  <span class="tab-label">
    {isDirty ? `● ${label}` : label}
  </span>

  {#if closable}
    <button
      class="tab-close"
      aria-label="Close {label}"
      on:click|stopPropagation={() => onClose?.()}
    >
      <X size={10} />
    </button>
  {/if}
</div>

<style>
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
    flex-shrink: 0;
    outline: none;
    transition:
      color 0.15s,
      background 0.15s;
    height: 100%;
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

  .tab:hover .tab-close,
  .tab.active .tab-close {
    opacity: 1;
  }

  .tab-close:hover {
    background: rgba(255, 255, 255, 0.12);
    color: var(--text);
  }
</style>
