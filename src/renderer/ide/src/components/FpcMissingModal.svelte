<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { i18n } from '../i18n'
  import { appStore } from '../stores/app'
  import { fpcInstallStore } from '../stores/fpcInstall'

  const DOWNLOAD_URL = 'https://www.freepascal.org/download.html'

  let state = $derived($fpcInstallStore)

  let unlistenOutput: (() => void) | null = null
  let unlistenDone: (() => void) | null = null
  let unlistenError: (() => void) | null = null

  onMount(async () => {
    if (!window.__TAURI__) return
    const { listen } = await import('@tauri-apps/api/event')

    unlistenOutput = await listen<string>('fpc-install-output', (e) => {
      fpcInstallStore.appendOutput(e.payload)
    })

    unlistenDone = await listen('fpc-install-done', async () => {
      fpcInstallStore.setSuccess()
      await appStore.init()
    })

    unlistenError = await listen<string>('fpc-install-error', (e) => {
      fpcInstallStore.setError(e.payload)
    })
  })

  onDestroy(() => {
    unlistenOutput?.()
    unlistenDone?.()
    unlistenError?.()
  })

  function close() {
    if (state.status === 'installing') return
    fpcInstallStore.hide()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
  }

  async function handleInstall() {
    await fpcInstallStore.install()
  }

  async function handleDownload() {
    if (window.__TAURI__) {
      try {
        await window.__TAURI__.core.invoke('open_url', { url: DOWNLOAD_URL })
        return
      } catch {
        // fall through to window.open
      }
    }
    window.open(DOWNLOAD_URL)
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if state.visible}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fpc-backdrop" onclick={close}>
    <div
      class="fpc-modal"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={$i18n('fpc_missing.title')}
      tabindex="-1"
    >
      {#if state.status !== 'installing'}
        <button
          class="fpc-close"
          aria-label={$i18n('find.close')}
          onclick={close}>×</button
        >
      {/if}

      <h2 class="fpc-title">{$i18n('fpc_missing.title')}</h2>

      {#if state.status === 'idle'}
        <p class="fpc-message">{$i18n('fpc_missing.message')}</p>
        {#if !state.packageManager}
          <p class="fpc-hint">{$i18n('fpc_missing.no_package_manager')}</p>
        {/if}
      {:else if state.status === 'installing'}
        <div class="fpc-installing-row">
          <span class="fpc-spinner"></span>
          <p class="fpc-message">{$i18n('fpc_missing.installing')}</p>
        </div>
      {:else if state.status === 'success'}
        <p class="fpc-message fpc-success">{$i18n('fpc_missing.success')}</p>
      {:else if state.status === 'error'}
        <p class="fpc-message fpc-error">{$i18n('fpc_missing.error')}</p>
      {/if}

      {#if state.status === 'installing' || state.status === 'error'}
        <pre class="fpc-output">{state.output || ' '}</pre>
      {/if}

      <div class="fpc-actions">
        {#if state.status === 'idle' || state.status === 'error'}
          <button
            class="fpc-btn fpc-btn-primary"
            disabled={!state.packageManager}
            onclick={handleInstall}
          >
            {$i18n('fpc_missing.install')}
          </button>
          <button class="fpc-btn" onclick={handleDownload}>
            {$i18n('fpc_missing.download')}
          </button>
          <button class="fpc-btn fpc-btn-ghost" onclick={close}>
            {$i18n('fpc_missing.cancel')}
          </button>
        {:else if state.status === 'installing'}
          <button class="fpc-btn" disabled>
            {$i18n('fpc_missing.installing_btn')}
          </button>
        {:else if state.status === 'success'}
          <button class="fpc-btn fpc-btn-primary" onclick={close}>
            {$i18n('fpc_missing.close')}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .fpc-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .fpc-modal {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    padding: 28px 32px;
    width: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
  }

  .fpc-close {
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

  .fpc-close:hover {
    color: var(--text);
    background: rgba(128, 128, 128, 0.12);
  }

  .fpc-title {
    font-family: var(--font-ui);
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 12px;
  }

  .fpc-installing-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .fpc-installing-row .fpc-message {
    margin-bottom: 0;
  }

  .fpc-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: fpc-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes fpc-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .fpc-message {
    font-size: 13px;
    color: var(--text-dim);
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .fpc-success {
    color: var(--success);
  }

  .fpc-error {
    color: var(--error);
  }

  .fpc-hint {
    font-size: 11px;
    color: var(--text-dim);
    margin-bottom: 8px;
  }

  .fpc-output {
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

  .fpc-actions {
    display: flex;
    gap: 8px;
    margin-top: 14px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .fpc-btn {
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

  .fpc-btn:hover:not(:disabled) {
    opacity: 0.85;
  }

  .fpc-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .fpc-btn-primary {
    background: var(--accent);
    color: #fff;
  }

  .fpc-btn-ghost {
    background: transparent;
    border: 1px solid var(--border);
  }
</style>
