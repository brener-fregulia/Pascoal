<script lang="ts">
  import { explorerStore, type ExplorerFile } from '../stores/explorerStore'
  import { tabStore } from '../stores/tabs'
  import { i18n } from '../i18n'
  import File from '../icons/File.svelte'
  import Folder from '../icons/Folder.svelte'

  $: folder = $explorerStore.folder
  $: files = $explorerStore.files
  $: loading = $explorerStore.loading
  $: error = $explorerStore.error

  async function handleOpenFolder() {
    await explorerStore.openFolder()
  }

  async function handleFileClick(file: ExplorerFile) {
    if (!window.__TAURI__) return

    try {
      const content = (await window.__TAURI__.core.invoke('read_file', {
        path: file.path,
      })) as string

      const tab = await tabStore.openFile(file.path, content)
      tabStore.activate(tab.id)
    } catch (e) {
      console.error('read_file failed:', e)
    }
  }
</script>

<div class="file-tree">
  {#if !folder}
    <div class="empty-state">
      <p class="empty-label">{$i18n('explorer.no_folder')}</p>
      <button class="open-btn" on:click={handleOpenFolder}>
        <Folder size={14} />
        {$i18n('explorer.open_folder')}
      </button>
    </div>
  {:else}
    <div class="tree-header">
      <span class="folder-name" title={folder.path}>{folder.name}</span>
      <button
        class="icon-action"
        title={$i18n('explorer.refresh')}
        on:click={() => explorerStore.refresh()}
      >
        ↻
      </button>
      <button
        class="icon-action"
        title={$i18n('explorer.close_folder')}
        on:click={() => explorerStore.closeFolder()}
      >
        ×
      </button>
    </div>

    {#if loading}
      <p class="status-msg">{$i18n('explorer.loading')}</p>
    {:else if error}
      <p class="status-msg error">{error}</p>
    {:else if files.length === 0}
      <p class="status-msg">{$i18n('explorer.no_files')}</p>
    {:else}
      <ul class="file-list">
        {#each files as file (file.path)}
          <li>
            <button
              class="file-item"
              title={file.relativePath}
              on:click={() => handleFileClick(file)}
            >
              <File size={13} />
              <span class="file-name">{file.name}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .file-tree {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--sidebar);
    border-right: 1px solid var(--border);
    min-width: 0;
  }

  /* Empty state */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px 16px;
  }

  .empty-label {
    font-size: 12px;
    color: var(--text-dim);
    text-align: center;
  }

  .open-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 4px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .open-btn:hover {
    opacity: 0.85;
  }

  /* Header */
  .tree-header {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    gap: 4px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .folder-name {
    flex: 1;
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .icon-action {
    background: transparent;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 2px 4px;
    border-radius: 3px;
    transition:
      color 0.15s,
      background 0.15s;
    flex-shrink: 0;
  }

  .icon-action:hover {
    color: var(--text);
    background: rgba(128, 128, 128, 0.1);
  }

  /* File list */
  .file-list {
    list-style: none;
    overflow-y: auto;
    flex: 1;
    padding: 4px 0;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--text-dim);
    text-align: left;
    transition:
      background 0.1s,
      color 0.1s;
    white-space: nowrap;
    overflow: hidden;
  }

  .file-item:hover {
    background: rgba(128, 128, 128, 0.08);
    color: var(--text);
  }

  .file-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Status messages */
  .status-msg {
    font-size: 12px;
    color: var(--text-dim);
    padding: 12px;
    font-style: italic;
  }

  .status-msg.error {
    color: var(--error);
    font-style: normal;
  }
</style>
