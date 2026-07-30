<script lang="ts">
  import { i18n } from '../i18n'
  import { updateStore } from '../integrations/updater/updateStore'
  import { isTauriAvailable, invoke } from '../integrations/tauri/client'

  const RELEASES_URL = 'https://github.com/brener-fregulia/Pascoal/releases'

  let state = $derived($updateStore)

  function close() {
    if (state.status === 'downloading') return
    updateStore.dismiss()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
  }

  async function handleInstall() {
    await updateStore.installUpdate()
  }

  async function handleDownloadManually() {
    if (isTauriAvailable()) {
      try {
        await invoke('open_url', { url: RELEASES_URL })
        return
      } catch {
        // fall through to window.open
      }
    }
    window.open(RELEASES_URL)
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if state.status === 'available' || state.status === 'downloading' || state.status === 'ready' || state.status === 'error'}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="upd-backdrop" onclick={close}>
    <div
      class="upd-modal"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={$i18n('update.title')}
      tabindex="-1"
    >
      {#if state.status !== 'downloading'}
        <button
          class="upd-close"
          aria-label={$i18n('find.close')}
          onclick={close}>×</button
        >
      {/if}

      <h2 class="upd-title">{$i18n('update.title')}</h2>

      {#if state.status === 'available'}
        <p class="upd-message">
          {$i18n('update.available_message', { version: state.version ?? '' })}
        </p>
        {#if state.notes}
          <pre class="upd-notes">{state.notes}</pre>
        {/if}
      {:else if state.status === 'downloading'}
        <div class="upd-downloading-row">
          <span class="upd-spinner"></span>
          <p class="upd-message">{$i18n('update.downloading')}</p>
        </div>
        <div class="upd-progress-track">
          <div class="upd-progress-fill" style="width: {state.progress}%"></div>
        </div>
      {:else if state.status === 'ready'}
        <p class="upd-message upd-success">{$i18n('update.ready')}</p>
      {:else if state.status === 'error'}
        <p class="upd-message upd-error">{$i18n('update.error')}</p>
      {/if}

      <div class="upd-actions">
        {#if state.status === 'available'}
          <button class="upd-btn upd-btn-primary" onclick={handleInstall}>
            {$i18n('update.now')}
          </button>
          <button class="upd-btn upd-btn-ghost" onclick={close}>
            {$i18n('update.later')}
          </button>
        {:else if state.status === 'error'}
          <button class="upd-btn upd-btn-primary" onclick={handleInstall}>
            {$i18n('update.retry')}
          </button>
          <button class="upd-btn" onclick={handleDownloadManually}>
            {$i18n('update.download_manually')}
          </button>
          <button class="upd-btn upd-btn-ghost" onclick={close}>
            {$i18n('update.later')}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .upd-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .upd-modal {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    padding: 28px 32px;
    width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
  }

  .upd-close {
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

  .upd-close:hover {
    color: var(--text);
    background: rgba(128, 128, 128, 0.12);
  }

  .upd-title {
    font-family: var(--font-ui);
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 12px;
  }

  .upd-message {
    font-size: 13px;
    color: var(--text-dim);
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .upd-success {
    color: var(--success);
  }

  .upd-error {
    color: var(--error);
  }

  .upd-notes {
    width: 100%;
    max-height: 140px;
    overflow-y: auto;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px;
    margin: 8px 0 14px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    text-align: left;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .upd-downloading-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .upd-downloading-row .upd-message {
    margin-bottom: 0;
  }

  .upd-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: upd-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes upd-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .upd-progress-track {
    width: 100%;
    height: 6px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .upd-progress-fill {
    height: 100%;
    background: var(--accent);
    transition: width 0.2s ease;
  }

  .upd-actions {
    display: flex;
    gap: 8px;
    margin-top: 14px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .upd-btn {
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

  .upd-btn:hover:not(:disabled) {
    opacity: 0.85;
  }

  .upd-btn-primary {
    background: var(--accent);
    color: #fff;
  }

  .upd-btn-ghost {
    background: transparent;
    border: 1px solid var(--border);
  }
</style>
