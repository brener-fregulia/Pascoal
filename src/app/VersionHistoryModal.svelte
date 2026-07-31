<script lang="ts">
  import { i18n, localeStore } from '../i18n'
  import { loadReleaseNoteHistory } from '../i18n/release-notes'

  let { open = $bindable(false) }: { open?: boolean } = $props()

  let entries = $state<Array<{ version: string; note: string }>>([])
  let loading = $state(false)

  $effect(() => {
    if (!open) return
    loading = true
    loadReleaseNoteHistory($localeStore).then((result) => {
      entries = result
      loading = false
    })
  })

  function close() {
    open = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="vh-backdrop" onclick={close}>
    <div
      class="vh-modal"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={$i18n('version_history.title')}
      tabindex="-1"
    >
      <button class="vh-close" aria-label={$i18n('find.close')} onclick={close}
        >×</button
      >

      <h2 class="vh-title">{$i18n('version_history.title')}</h2>

      <div class="vh-list">
        {#if loading}
          <p class="vh-status">{$i18n('version_history.loading')}</p>
        {:else if entries.length === 0}
          <p class="vh-status">{$i18n('version_history.empty')}</p>
        {:else}
          {#each entries as entry (entry.version)}
            <div class="vh-entry">
              <div class="vh-version">{entry.version}</div>
              <p class="vh-note">{entry.note}</p>
            </div>
          {/each}
        {/if}
      </div>

      <div class="vh-actions">
        <button class="vh-btn vh-btn-primary" onclick={close}>
          {$i18n('version_history.close')}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .vh-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .vh-modal {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    padding: 28px 32px;
    width: 460px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
  }

  .vh-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--text-dim);
    font-size: 16px;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      color 0.15s,
      background 0.15s;
  }

  .vh-close:hover {
    color: var(--text);
    background: rgba(128, 128, 128, 0.12);
  }

  .vh-title {
    font-family: var(--font-ui);
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 12px;
  }

  .vh-list {
    width: 100%;
    overflow-y: auto;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-right: 4px;
  }

  .vh-status {
    font-size: 13px;
    color: var(--text-dim);
    text-align: center;
  }

  .vh-entry {
    border-bottom: 1px solid var(--border);
    padding-bottom: 12px;
  }

  .vh-entry:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .vh-version {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 700;
    color: var(--accent2);
    margin-bottom: 4px;
  }

  .vh-note {
    font-size: 13px;
    color: var(--text-dim);
    line-height: 1.6;
  }

  .vh-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }

  .vh-btn {
    background: var(--border);
    color: var(--text);
    border: none;
    border-radius: 5px;
    padding: 8px 16px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .vh-btn:hover {
    opacity: 0.85;
  }

  .vh-btn-primary {
    background: var(--accent);
    color: #fff;
  }
</style>
