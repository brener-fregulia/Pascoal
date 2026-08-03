<script lang="ts">
  import { onMount } from 'svelte'
  import { i18n } from '../i18n'
  import { isTauriAvailable, invoke } from '../integrations/tauri/client'
  import { fpcInstallStore } from '../toolchain/fpcInstall'

  const GIT_DOWNLOAD_URL = 'https://git-scm.com/downloads'

  interface ToolStatus {
    installed: boolean
    version: string | null
    path: string | null
  }

  interface ToolchainStatus {
    fpc: ToolStatus
    git: ToolStatus
  }

  let status = $state<ToolchainStatus | null>(null)
  let loading = $state(true)

  async function refresh() {
    if (!isTauriAvailable()) {
      loading = false
      return
    }
    loading = true
    try {
      status = await invoke<ToolchainStatus>('get_toolchain_status')
    } finally {
      loading = false
    }
  }

  onMount(refresh)

  $effect(() => {
    if ($fpcInstallStore.status === 'success') {
      refresh()
    }
  })

  async function downloadGit() {
    if (isTauriAvailable()) {
      try {
        await invoke('open_url', { url: GIT_DOWNLOAD_URL })
        return
      } catch {
        // fall through to window.open
      }
    }
    window.open(GIT_DOWNLOAD_URL)
  }
</script>

<section>
  <h3>{$i18n('settings.category_toolchain')}</h3>

  {#if loading}
    <p class="hint">{$i18n('settings.toolchain_checking')}</p>
  {:else if status}
    <div class="tool-row">
      <div class="tool-header">
        <span class="dot" class:ok={status.fpc.installed}></span>
        <span class="tool-name">Free Pascal Compiler</span>
        {#if status.fpc.installed}
          <span class="tool-version">{status.fpc.version ?? '—'}</span>
        {:else}
          <span class="tool-missing"
            >{$i18n('settings.toolchain_not_found')}</span
          >
          <button class="tool-action" onclick={() => fpcInstallStore.show()}>
            {$i18n('settings.toolchain_install')}
          </button>
        {/if}
      </div>
      {#if status.fpc.path}
        <code class="tool-path">{status.fpc.path}</code>
      {/if}
    </div>

    <div class="tool-row">
      <div class="tool-header">
        <span class="dot" class:ok={status.git.installed}></span>
        <span class="tool-name">Git</span>
        {#if status.git.installed}
          <span class="tool-version">{status.git.version ?? '—'}</span>
        {:else}
          <span class="tool-missing"
            >{$i18n('settings.toolchain_not_found')}</span
          >
          <button class="tool-action" onclick={downloadGit}>
            {$i18n('settings.toolchain_download')}
          </button>
        {/if}
      </div>
      {#if status.git.path}
        <code class="tool-path">{status.git.path}</code>
      {/if}
    </div>
  {/if}
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .hint {
    font-size: 12px;
    color: var(--text-dim);
    margin: 0;
  }

  .tool-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 6px;
  }

  .tool-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--error);
    flex-shrink: 0;
  }

  .dot.ok {
    background: var(--success);
  }

  .tool-name {
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--text);
    font-weight: 600;
  }

  .tool-version {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-dim);
  }

  .tool-missing {
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--error);
  }

  .tool-action {
    margin-left: auto;
    padding: 4px 10px;
    border: 1px solid var(--accent2);
    border-radius: 4px;
    background: transparent;
    color: var(--accent2);
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
  }

  .tool-action:hover {
    background: var(--accent2);
    color: var(--bg);
  }

  .tool-path {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    word-break: break-all;
  }
</style>
