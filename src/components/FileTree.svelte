<script lang="ts">
  import { explorerStore, type ExplorerNode } from '../stores/explorerStore'
  import { tabStore } from '../stores/tabs'
  import { i18n } from '../i18n'
  import FileTreeNode from './FileTreeNode.svelte'
  import Folder from '../icons/Folder.svelte'

  let expandedPaths = $state(new Set<string>())

  let folder = $derived($explorerStore.folder)
  let tree = $derived($explorerStore.tree)
  let loading = $derived($explorerStore.loading)
  let error = $derived($explorerStore.error)

  async function handleOpenFolder() {
    await explorerStore.openFolder()
  }

  function toggle(path: string) {
    const next = new Set(expandedPaths)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    expandedPaths = next
  }

  async function openFile(node: ExplorerNode) {
    if (!window.__TAURI__) return
    try {
      const content = (await window.__TAURI__.core.invoke('read_file', {
        path: node.path,
      })) as string
      const tab = await tabStore.openFile(node.path, content)
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
      <button class="open-btn" onclick={handleOpenFolder}>
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
        onclick={() => explorerStore.refresh()}
      >
        ↻
      </button>
      <button
        class="icon-action"
        title={$i18n('explorer.close_folder')}
        onclick={() => explorerStore.closeFolder()}
      >
        ×
      </button>
    </div>

    {#if loading}
      <p class="status-msg">{$i18n('explorer.loading')}</p>
    {:else if error}
      <p class="status-msg error">{error}</p>
    {:else if tree.length === 0}
      <p class="status-msg">{$i18n('explorer.no_files')}</p>
    {:else}
      <div class="tree-body">
        {#each tree as node (node.path)}
          <FileTreeNode
            {node}
            depth={0}
            {expandedPaths}
            onToggle={toggle}
            onFileClick={openFile}
          />
        {/each}
      </div>
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

  .tree-body {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

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
