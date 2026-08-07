<script lang="ts">
  import { explorerStore, type ExplorerNode } from './explorerStore'
  import { tabStore } from '../editor/tabs'
  import { i18n } from '../i18n'
  import { appStore } from '../app/app'
  import FileTreeNode from './FileTreeNode.svelte'
  import NewEntryRow from './NewEntryRow.svelte'
  import Folder from '../icons/Folder.svelte'
  import FileNew from '../icons/FileNew.svelte'
  import FolderNew from '../icons/FolderNew.svelte'
  import { isTauriAvailable, invoke } from '../integrations/tauri/client'

  let expandedPaths = $state(new Set<string>())
  let selectedPath = $state<string | null>(null)
  let selectedIsDirectory = $state(false)
  let menu = $state<
    | { kind: 'node'; node: ExplorerNode; x: number; y: number }
    | { kind: 'empty'; x: number; y: number }
    | null
  >(null)
  let pendingCreate = $state<{
    parentPath: string
    isDirectory: boolean
    error: string | null
  } | null>(null)

  let folder = $derived($explorerStore.folder)
  let tree = $derived($explorerStore.tree)
  let loading = $derived($explorerStore.loading)
  let error = $derived($explorerStore.error)

  let platform = $derived($appStore.info?.platform ?? 'linux')
  let revealLabelKey = $derived(
    platform === 'macos'
      ? 'explorer.reveal_macos'
      : platform === 'windows'
        ? 'explorer.reveal_windows'
        : 'explorer.reveal_linux',
  )

  async function handleOpenFolder() {
    await explorerStore.openFolder()
  }

  function toggle(path: string) {
    selectedPath = path
    selectedIsDirectory = true
    const next = new Set(expandedPaths)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    expandedPaths = next
  }

  async function openFilePath(path: string) {
    selectedPath = path
    selectedIsDirectory = false
    if (!isTauriAvailable()) return
    try {
      const content = await invoke<string>('read_file', { path })
      const tab = await tabStore.openFile(path, content)
      tabStore.activate(tab.id)
    } catch (e) {
      console.error('read_file failed:', e)
    }
  }

  async function openFile(node: ExplorerNode) {
    await openFilePath(node.path)
  }

  function handleContextMenu(node: ExplorerNode, x: number, y: number) {
    selectedPath = node.path
    selectedIsDirectory = node.isDirectory
    menu = { kind: 'node', node, x, y }
  }

  function handleEmptyContextMenu(e: MouseEvent) {
    e.preventDefault()
    menu = { kind: 'empty', x: e.clientX, y: e.clientY }
  }

  function closeMenu() {
    menu = null
  }

  function menuOpen(node: ExplorerNode) {
    closeMenu()
    openFile(node)
  }

  async function menuReveal(node: ExplorerNode) {
    closeMenu()
    if (!isTauriAvailable()) return
    try {
      await invoke('reveal_in_file_manager', { path: node.path })
    } catch (e) {
      console.error('reveal_in_file_manager failed:', e)
    }
  }

  function menuCopyPath(node: ExplorerNode) {
    closeMenu()
    navigator.clipboard.writeText(node.path)
  }

  function menuCopyRelativePath(node: ExplorerNode) {
    closeMenu()
    navigator.clipboard.writeText(node.relativePath)
  }

  function expandFolder(path: string) {
    if (expandedPaths.has(path)) return
    const next = new Set(expandedPaths)
    next.add(path)
    expandedPaths = next
  }

  function startCreate(parentPath: string, isDirectory: boolean) {
    pendingCreate = { parentPath, isDirectory, error: null }
  }

  // Only clears state if `pendingCreate` is still the one this cancel call
  // came from - see the comment in NewEntryRow.svelte's handleBlur for why
  // this guard matters (a stale unmount-triggered blur from a replaced
  // create request must not clobber the request that replaced it).
  function cancelCreate(parentPath: string) {
    if (pendingCreate?.parentPath === parentPath) pendingCreate = null
  }

  async function confirmCreate(name: string) {
    if (!pendingCreate) return
    const { parentPath, isDirectory } = pendingCreate
    if (!isTauriAvailable()) return
    try {
      const path = await invoke<string>(
        isDirectory ? 'create_directory' : 'create_file',
        { parentPath, name },
      )
      pendingCreate = null
      await explorerStore.refresh()
      selectedPath = path
      if (!isDirectory) {
        await openFilePath(path)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      pendingCreate = { parentPath, isDirectory, error: msg }
    }
  }

  function menuNewFile(node: ExplorerNode) {
    closeMenu()
    expandFolder(node.path)
    startCreate(node.path, false)
  }

  function menuNewFolder(node: ExplorerNode) {
    closeMenu()
    expandFolder(node.path)
    startCreate(node.path, true)
  }

  function menuNewFileRoot() {
    closeMenu()
    if (folder) startCreate(folder.path, false)
  }

  function menuNewFolderRoot() {
    closeMenu()
    if (folder) startCreate(folder.path, true)
  }

  // Creates inside the selected folder when one is selected, otherwise at
  // the workspace root - matches VS Code's toolbar behavior.
  function toolbarTargetParent(): string | null {
    if (selectedIsDirectory && selectedPath) return selectedPath
    return folder?.path ?? null
  }

  function toolbarNewFile() {
    const parent = toolbarTargetParent()
    if (!parent) return
    if (parent === selectedPath) expandFolder(parent)
    startCreate(parent, false)
  }

  function toolbarNewFolder() {
    const parent = toolbarTargetParent()
    if (!parent) return
    if (parent === selectedPath) expandFolder(parent)
    startCreate(parent, true)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeMenu()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

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
        title={$i18n('explorer.new_file')}
        onclick={toolbarNewFile}
      >
        <FileNew size={14} />
      </button>
      <button
        class="icon-action"
        title={$i18n('explorer.new_folder')}
        onclick={toolbarNewFolder}
      >
        <FolderNew size={14} />
      </button>
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

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="tree-body" oncontextmenu={handleEmptyContextMenu}>
      {#if loading}
        <p class="status-msg">{$i18n('explorer.loading')}</p>
      {:else if error}
        <p class="status-msg error">{error}</p>
      {:else}
        {#if pendingCreate && pendingCreate.parentPath === folder.path}
          <NewEntryRow
            depth={0}
            isDirectory={pendingCreate.isDirectory}
            parentPath={pendingCreate.parentPath}
            error={pendingCreate.error}
            onConfirm={confirmCreate}
            onCancel={cancelCreate}
          />
        {/if}
        {#if tree.length === 0 && !(pendingCreate && pendingCreate.parentPath === folder.path)}
          <p class="status-msg">{$i18n('explorer.no_files')}</p>
        {/if}
        {#each tree as node (node.path)}
          <FileTreeNode
            {node}
            depth={0}
            {expandedPaths}
            {selectedPath}
            {pendingCreate}
            onToggle={toggle}
            onFileClick={openFile}
            onContextMenu={handleContextMenu}
            onCreateConfirm={confirmCreate}
            onCreateCancel={cancelCreate}
          />
        {/each}
      {/if}
    </div>
  {/if}
</div>

{#if menu?.kind === 'node'}
  {@const menuNode = menu.node}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="menu-backdrop" onclick={closeMenu}></div>
  <div
    class="menu-dropdown context-menu"
    style="left: {menu.x}px; top: {menu.y}px"
  >
    {#if menuNode.isDirectory}
      <button class="menu-item" onclick={() => menuNewFile(menuNode)}>
        {$i18n('explorer.new_file')}
      </button>
      <button class="menu-item" onclick={() => menuNewFolder(menuNode)}>
        {$i18n('explorer.new_folder')}
      </button>
      <hr class="menu-sep" />
    {/if}
    {#if !menuNode.isDirectory}
      <button class="menu-item" onclick={() => menuOpen(menuNode)}>
        {$i18n('explorer.open')}
      </button>
      <hr class="menu-sep" />
    {/if}
    <button class="menu-item" onclick={() => menuReveal(menuNode)}>
      {$i18n(revealLabelKey)}
    </button>
    <hr class="menu-sep" />
    <button class="menu-item" onclick={() => menuCopyPath(menuNode)}>
      {$i18n('explorer.copy_path')}
    </button>
    <button class="menu-item" onclick={() => menuCopyRelativePath(menuNode)}>
      {$i18n('explorer.copy_relative_path')}
    </button>
  </div>
{:else if menu?.kind === 'empty'}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="menu-backdrop" onclick={closeMenu}></div>
  <div
    class="menu-dropdown context-menu"
    style="left: {menu.x}px; top: {menu.y}px"
  >
    <button class="menu-item" onclick={menuNewFileRoot}>
      {$i18n('explorer.new_file')}
    </button>
    <button class="menu-item" onclick={menuNewFolderRoot}>
      {$i18n('explorer.new_folder')}
    </button>
  </div>
{/if}

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
    display: inline-flex;
    align-items: center;
    justify-content: center;
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

  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .menu-dropdown {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    min-width: 200px;
    z-index: 100;
    padding: 4px 0;
  }

  .context-menu {
    position: fixed;
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
</style>
