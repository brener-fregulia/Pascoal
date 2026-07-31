<script lang="ts">
  import { i18n } from '../i18n'
  import { whatsNewStore } from './whatsNew'
  import { isTauriAvailable, invoke } from '../integrations/tauri/client'

  let { onViewHistory }: { onViewHistory: () => void } = $props()

  const RELEASES_URL = 'https://github.com/brener-fregulia/Pascoal/releases'

  let state = $derived($whatsNewStore)

  function close() {
    whatsNewStore.dismiss()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
  }

  async function handleViewChangelog() {
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

  function handleViewHistory() {
    whatsNewStore.dismiss()
    onViewHistory()
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if state.show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="wn-backdrop" onclick={close}>
    <div
      class="wn-modal"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={$i18n('whats_new.title')}
      tabindex="-1"
    >
      <button class="wn-close" aria-label={$i18n('find.close')} onclick={close}
        >×</button
      >

      <h2 class="wn-title">
        {$i18n('whats_new.title')} — {state.version}
      </h2>

      <p class="wn-note">{state.note}</p>

      <div class="wn-actions">
        <button class="wn-btn wn-btn-primary" onclick={close}>
          {$i18n('whats_new.close')}
        </button>
        <button class="wn-btn wn-btn-ghost" onclick={handleViewHistory}>
          {$i18n('whats_new.view_history')}
        </button>
        <button class="wn-btn wn-btn-ghost" onclick={handleViewChangelog}>
          {$i18n('whats_new.view_changelog')}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .wn-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .wn-modal {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    padding: 28px 32px;
    width: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
  }

  .wn-close {
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

  .wn-close:hover {
    color: var(--text);
    background: rgba(128, 128, 128, 0.12);
  }

  .wn-title {
    font-family: var(--font-ui);
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 12px;
  }

  .wn-note {
    font-size: 13px;
    color: var(--text-dim);
    line-height: 1.6;
    margin-bottom: 8px;
  }

  .wn-actions {
    display: flex;
    gap: 8px;
    margin-top: 14px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .wn-btn {
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

  .wn-btn:hover {
    opacity: 0.85;
  }

  .wn-btn-primary {
    background: var(--accent);
    color: #fff;
  }

  .wn-btn-ghost {
    background: transparent;
    border: 1px solid var(--border);
  }
</style>
