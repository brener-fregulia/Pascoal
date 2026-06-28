<script lang="ts">
  import { appStore } from '../stores/app'
  import { i18n } from '../i18n'
  import { onMount } from 'svelte'

  $: platform = $appStore.info?.platform ?? 'linux'
  $: isMac = platform === 'macos'

  let openMenu: string | null = null

  type MenuItem =
    | { type: 'action'; labelKey: string; event: string }
    | { type: 'separator' }
    | { type: 'link'; labelKey: string; url: string }

  const fileItems: MenuItem[] = [
    { type: 'action', labelKey: 'titlebar.new_file', event: 'menu-new-file' },
    { type: 'action', labelKey: 'titlebar.open_file', event: 'menu-open-file' },
    {
      type: 'action',
      labelKey: 'titlebar.open_folder',
      event: 'menu-open-folder',
    },
    { type: 'separator' },
    { type: 'action', labelKey: 'titlebar.save', event: 'menu-save-file' },
    {
      type: 'action',
      labelKey: 'titlebar.save_as',
      event: 'menu-save-file-as',
    },
  ]

  const REPO = 'https://github.com/brener-fregulia/Pascoal'
  const helpItems: MenuItem[] = [
    {
      type: 'link',
      labelKey: 'titlebar.report_bug',
      url: `${REPO}/issues/new?template=bug_report.yml`,
    },
    {
      type: 'link',
      labelKey: 'titlebar.report_pascal_compiler_issue',
      url: `${REPO}/issues/new?template=compiler_runtime_issue.yml`,
    },
    {
      type: 'link',
      labelKey: 'titlebar.request_feature',
      url: `${REPO}/issues/new?template=feature_request.yml`,
    },
    { type: 'separator' },
    { type: 'link', labelKey: 'titlebar.view_on_github', url: REPO },
    { type: 'separator' },
    { type: 'action', labelKey: 'titlebar.about_pascoal', event: 'menu-about' },
  ]

  const menus = [
    { id: 'file', labelKey: 'titlebar.file', items: fileItems },
    { id: 'help', labelKey: 'titlebar.help', items: helpItems },
  ]

  function toggleMenu(id: string) {
    openMenu = openMenu === id ? null : id
  }

  function closeMenus() {
    openMenu = null
  }

  async function handleItem(item: MenuItem) {
    closeMenus()
    if (item.type === 'action') {
      if (!window.__TAURI__) return
      const { emit } = await import('@tauri-apps/api/event')
      await emit(item.event)
    } else if (item.type === 'link') {
      window.__TAURI__
        ? await import('@tauri-apps/api/event').then(() =>
            window.__TAURI__.core
              .invoke('open_url', { url: item.url })
              .catch(() => window.open(item.url)),
          )
        : window.open(item.url)
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeMenus()
  }

  async function close() {
    if (window.__TAURI__) window.__TAURI__.window.getCurrentWindow().close()
  }

  async function minimize() {
    if (window.__TAURI__) window.__TAURI__.window.getCurrentWindow().minimize()
  }

  async function maximize() {
    if (!window.__TAURI__) return
    const win = window.__TAURI__.window.getCurrentWindow()
    const isMax = await win.isMaximized()
    isMax ? win.unmaximize() : win.maximize()
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if openMenu}
  <div class="menu-backdrop" on:click={closeMenus}></div>
{/if}

<header id="titlebar" class:mac={isMac}>
  {#if isMac}
    <div class="mac-group">
      <button
        class="mac-btn mac-close"
        aria-label={$i18n('titlebar.close')}
        on:click={close}
      >
        <svg
          viewBox="0 0 8 8"
          fill="none"
          stroke="#7a1010"
          stroke-width="1.2"
          stroke-linecap="round"
        >
          <line x1="1.5" y1="1.5" x2="6.5" y2="6.5" />
          <line x1="6.5" y1="1.5" x2="1.5" y2="6.5" />
        </svg>
      </button>
      <button
        class="mac-btn mac-min"
        aria-label={$i18n('titlebar.minimize')}
        on:click={minimize}
      >
        <svg
          viewBox="0 0 8 8"
          fill="none"
          stroke="#7a5500"
          stroke-width="1.2"
          stroke-linecap="round"
        >
          <line x1="1.5" y1="4" x2="6.5" y2="4" />
        </svg>
      </button>
      <button
        class="mac-btn mac-max"
        aria-label={$i18n('titlebar.maximize')}
        on:click={maximize}
      >
        <svg
          viewBox="0 0 8 8"
          fill="none"
          stroke="#0a4a18"
          stroke-width="1.2"
          stroke-linecap="round"
        >
          <polyline points="1.5,4.5 1.5,1.5 4.5,1.5" />
          <polyline points="3.5,6.5 6.5,6.5 6.5,3.5" />
        </svg>
      </button>
    </div>
  {/if}

  <!-- Logo -->
  <img
    src="/src/assets/pascoal-logo.svg"
    alt="Pascoal"
    class="logo"
    draggable="false"
  />

  <!-- Menu bar -->
  <div class="menubar" style="-webkit-app-region: no-drag">
    {#each menus as menu}
      <div class="menu-root">
        <button
          class="menu-trigger"
          class:open={openMenu === menu.id}
          on:click={() => toggleMenu(menu.id)}
        >
          {$i18n(menu.labelKey)}
        </button>

        {#if openMenu === menu.id}
          <div class="menu-dropdown">
            {#each menu.items as item}
              {#if item.type === 'separator'}
                <hr class="menu-sep" />
              {:else}
                <button class="menu-item" on:click={() => handleItem(item)}>
                  {$i18n(item.labelKey)}
                </button>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="drag-region"></div>

  {#if !isMac}
    <div class="win-group" style="-webkit-app-region: no-drag">
      <button
        class="wc-btn"
        aria-label={$i18n('titlebar.minimize')}
        on:click={minimize}
      >
        <svg
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        >
          <line x1="2" y1="7" x2="12" y2="7" />
        </svg>
      </button>
      <button
        class="wc-btn"
        aria-label={$i18n('titlebar.maximize')}
        on:click={maximize}
      >
        <svg
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="2.5" y="2.5" width="9" height="9" rx="1.5" />
        </svg>
      </button>
      <button
        class="wc-btn wc-close"
        aria-label={$i18n('titlebar.close')}
        on:click={close}
      >
        <svg
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        >
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
    gap: 0;
    -webkit-app-region: drag;
    user-select: none;
    height: 36px;
    position: relative;
  }

  #titlebar.mac {
    padding-left: 80px;
  }

  .logo {
    height: 26px;
    width: auto;
    flex-shrink: 0;
    margin: 0 8px 0 12px;
    -webkit-app-region: no-drag;
  }

  /* Drag region fills remaining space between menus and win controls */
  .drag-region {
    flex: 1;
    height: 100%;
    -webkit-app-region: drag;
  }

  /* Menu bar */
  .menubar {
    display: flex;
    align-items: stretch;
    height: 100%;
  }

  .menu-root {
    position: relative;
    display: flex;
    align-items: stretch;
  }

  .menu-trigger {
    padding: 0 10px;
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-family: var(--font-ui);
    font-size: 12px;
    cursor: pointer;
    height: 100%;
    transition:
      background 0.1s,
      color 0.1s;
  }

  .menu-trigger:hover,
  .menu-trigger.open {
    background: rgba(128, 128, 128, 0.12);
    color: var(--text);
  }

  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .menu-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    min-width: 200px;
    z-index: 100;
    padding: 4px 0;
  }

  .menu-item {
    display: block;
    width: 100%;
    padding: 6px 16px;
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-family: var(--font-ui);
    font-size: 12px;
    text-align: left;
    cursor: pointer;
    transition:
      background 0.1s,
      color 0.1s;
    white-space: nowrap;
  }

  .menu-item:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text);
  }

  .menu-sep {
    border: none;
    border-top: 1px solid var(--border);
    margin: 4px 0;
  }

  /* Mac controls */
  .mac-group {
    position: absolute;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    -webkit-app-region: no-drag;
  }

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

  .mac-group:hover .mac-btn svg {
    opacity: 1;
  }
  .mac-close {
    background: #ff5f57;
  }
  .mac-min {
    background: #ffbd2e;
  }
  .mac-max {
    background: #28c840;
  }

  /* Windows controls */
  .win-group {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .wc-btn {
    width: 32px;
    height: 36px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
    transition:
      background 0.15s,
      color 0.15s;
  }

  .wc-btn svg {
    width: 14px;
    height: 14px;
  }
  .wc-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text);
  }
  .wc-btn.wc-close:hover {
    background: var(--accent);
    color: #fff;
  }
</style>
