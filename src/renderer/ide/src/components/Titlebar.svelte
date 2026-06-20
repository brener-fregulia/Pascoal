<script lang="ts">
  import { appStore } from "../stores/app";
  import { i18n } from "../i18n";

  $: platform = $appStore.info?.platform ?? "linux";
  $: isMac = platform === "macos";

  async function close() {
    if (window.__TAURI__) window.__TAURI__.window.getCurrentWindow().close();
  }

  async function minimize() {
    if (window.__TAURI__) window.__TAURI__.window.getCurrentWindow().minimize();
  }

  async function maximize() {
    if (!window.__TAURI__) return;
    const win = window.__TAURI__.window.getCurrentWindow();
    const isMax = await win.isMaximized();
    isMax ? win.unmaximize() : win.maximize();
  }
</script>

<header id="titlebar" class:mac={isMac}>
  {#if isMac}
    <div class="mac-group">
      <button class="mac-btn mac-close" aria-label={$i18n('titlebar.close')} on:click={close}>
        <svg viewBox="0 0 8 8" fill="none" stroke="#7a1010" stroke-width="1.2" stroke-linecap="round">
          <line x1="1.5" y1="1.5" x2="6.5" y2="6.5" />
          <line x1="6.5" y1="1.5" x2="1.5" y2="6.5" />
        </svg>
      </button>
      <button class="mac-btn mac-min" aria-label={$i18n('titlebar.minimize')} on:click={minimize}>
        <svg viewBox="0 0 8 8" fill="none" stroke="#7a5500" stroke-width="1.2" stroke-linecap="round">
          <line x1="1.5" y1="4" x2="6.5" y2="4" />
        </svg>
      </button>
      <button class="mac-btn mac-max" aria-label={$i18n('titlebar.maximize')} on:click={maximize}>
        <svg viewBox="0 0 8 8" fill="none" stroke="#0a4a18" stroke-width="1.2" stroke-linecap="round">
          <polyline points="1.5,4.5 1.5,1.5 4.5,1.5" />
          <polyline points="3.5,6.5 6.5,6.5 6.5,3.5" />
        </svg>
      </button>
    </div>
  {/if}

  <span class="logo">Pascoal</span>

  {#if !isMac}
    <div class="win-group">
      <button class="wc-btn" aria-label={$i18n('titlebar.minimize')} on:click={minimize}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <line x1="2" y1="7" x2="12" y2="7" />
        </svg>
      </button>
      <button class="wc-btn" aria-label={$i18n('titlebar.maximize')} on:click={maximize}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2.5" y="2.5" width="9" height="9" rx="1.5" />
        </svg>
      </button>
      <button class="wc-btn wc-close" aria-label={$i18n('titlebar.close')} on:click={close}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <line x1="3" y1="3" x2="11" y2="11" />
          <line x1="11" y1="3" x2="3" y2="11" />
        </svg>
      </button>
    </div>
  {/if}
</header>

<style>
  #titlebar {
    background: var(--sidebar);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 12px;
    -webkit-app-region: drag;
    user-select: none;
    height: 36px;
  }

  #titlebar.mac { padding-left: 12px; }

  .logo {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: 0.5px;
  }

  .win-group {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }

  .mac-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .wc-btn {
    width: 32px;
    height: 28px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    color: var(--text-dim);
    transition: background 0.15s, color 0.15s;
    -webkit-app-region: no-drag;
  }

  .wc-btn svg { width: 14px; height: 14px; }
  .wc-btn:hover { background: rgba(255, 255, 255, 0.08); color: var(--text); }
  .wc-btn.wc-close:hover { background: var(--accent); color: #fff; }

  .mac-btn {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    -webkit-app-region: no-drag;
  }

  .mac-btn svg {
    width: 8px;
    height: 8px;
    opacity: 0;
    transition: opacity 0.15s;
    position: absolute;
  }

  .mac-group:hover .mac-btn svg { opacity: 1; }
  .mac-close { background: #ff5f57; }
  .mac-min   { background: #ffbd2e; }
  .mac-max   { background: #28c840; }
</style>
