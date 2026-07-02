<script lang="ts">
  import { appStore } from '../stores/app'
  import { i18n } from '../i18n'
  import PascoalLogo from './PascoalLogo.svelte'

  let { open = $bindable(false) }: { open: boolean } = $props()

  let info = $derived($appStore.info)

  const REPO = 'https://github.com/brener-fregulia/Pascoal'

  function close() {
    open = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close()
  }

  async function openRepo() {
    if (window.__TAURI__) {
      try {
        await window.__TAURI__.core.invoke('open_url', { url: REPO })
        return
      } catch {
        // fall through to window.open
      }
    }
    window.open(REPO)
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="about-backdrop" on:click={close}>
    <div
      class="about-modal"
      on:click|stopPropagation
      role="dialog"
      aria-label={$i18n('about.title')}
    >
      <button
        class="about-close"
        aria-label={$i18n('find.close')}
        on:click={close}>×</button
      >

      <div class="about-logo">
        <PascoalLogo height={48} />
      </div>

      <h2 class="about-name">Pascoal</h2>
      <p class="about-version">
        {info
          ? `${$i18n('about.version')} ${info.version}`
          : $i18n('about.version')}
      </p>

      <div class="about-info">
        <div class="about-row">
          <span class="about-label">{$i18n('about.fpc')}</span>
          <span class="about-value">
            {#if info?.fpcInstalled}
              {info.fpcVersion ?? $i18n('about.detected')}
            {:else}
              {$i18n('about.fpc_not_found')}
            {/if}
          </span>
        </div>
        <div class="about-row">
          <span class="about-label">{$i18n('about.platform')}</span>
          <span class="about-value">{info?.platform ?? '—'}</span>
        </div>
      </div>

      <button class="about-repo-btn" on:click={openRepo}>
        {$i18n('about.view_repo')}
      </button>

      <p class="about-license">{$i18n('about.license')}</p>
    </div>
  </div>
{/if}

<style>
  .about-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .about-modal {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    padding: 32px 40px;
    width: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
  }

  .about-close {
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

  .about-close:hover {
    color: var(--text);
    background: rgba(128, 128, 128, 0.12);
  }

  .about-logo {
    margin-bottom: 12px;
  }

  .about-logo :global(.logo) {
    height: 48px;
    filter: none !important;
  }

  :global([data-theme='dark']) .about-logo :global(.logo),
  :global([data-theme='charcoal']) .about-logo :global(.logo) {
    filter: brightness(0) saturate(0) invert(1) brightness(0.75) !important;
  }

  .about-name {
    font-family: var(--font-mono);
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: 0.5px;
  }

  .about-version {
    font-size: 12px;
    color: var(--text-dim);
    margin-top: 4px;
    margin-bottom: 20px;
  }

  .about-info {
    width: 100%;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 12px 0;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .about-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
  }

  .about-label {
    color: var(--text-dim);
  }

  .about-value {
    color: var(--text);
    font-family: var(--font-mono);
  }

  .about-repo-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 5px;
    padding: 8px 20px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    margin-bottom: 14px;
  }

  .about-repo-btn:hover {
    opacity: 0.85;
  }

  .about-license {
    font-size: 11px;
    color: var(--text-dim);
  }
</style>
