<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'
  import { explorerStore, type ExplorerNode } from './explorerStore'
  import { tabStore } from '../editor/tabs'
  import { i18n } from '../i18n'
  import { appStore } from '../app/app'
  import { activeFocusStore } from '../shared/activeFocus'
  import FileTreeNode from './FileTreeNode.svelte'
  import NewEntryRow from './NewEntryRow.svelte'
  import Folder from '../icons/Folder.svelte'
  import FileNew from '../icons/FileNew.svelte'
  import FolderNew from '../icons/FolderNew.svelte'
  import { isTauriAvailable, invoke } from '../integrations/tauri/client'
  import { ask, message } from '@tauri-apps/plugin-dialog'

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
  let renaming = $state<{ path: string; error: string | null } | null>(null)
  let clipboard = $state<{ path: string; mode: 'copy' | 'cut' } | null>(null)

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

  // Clears the selection when the empty area of the tree (below/between
  // rows) is clicked directly - e.target === e.currentTarget only holds when
  // the click landed on .tree-body itself, not on a bubbled row button -
  // so clicking on a row's own click handler isn't affected. This is the
  // only way to move the toolbar's "New File"/"New Folder" target back to
  // the workspace root after a subfolder was selected, short of clicking a
  // file (which resets it as a side effect) or reopening the folder.
  function handleEmptyClick(e: MouseEvent) {
    if (e.target !== e.currentTarget) return
    selectedPath = null
    selectedIsDirectory = false
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

  function startRename(path: string) {
    renaming = { path, error: null }
  }

  // Only clears state if `renaming` is still the one this cancel call came
  // from - same guard as `cancelCreate` above, for the same reason: see the
  // comment on RenameInput.svelte's handleBlur (and NewEntryRow.svelte's
  // handleBlur) for why a stale unmount-triggered blur from a rename
  // request that was already replaced must be a no-op instead of clobbering
  // the request that replaced it.
  function cancelRename(path: string) {
    if (renaming?.path === path) renaming = null
  }

  // Rewrites a path that starts with `oldPrefix` (exactly, or as a folder
  // ancestor) so it starts with `newPrefix` instead. Used to keep
  // `expandedPaths`/`selectedPath` pointing at the right entries after a
  // rename, since a renamed folder invalidates every descendant path too.
  function remapPathPrefix(path: string, oldPrefix: string, newPrefix: string): string {
    if (path === oldPrefix) return newPrefix
    if (path.startsWith(oldPrefix + '/') || path.startsWith(oldPrefix + '\\')) {
      return newPrefix + path.slice(oldPrefix.length)
    }
    return path
  }

  async function confirmRename(newName: string) {
    if (!renaming) return
    const { path } = renaming
    const currentName = path.split(/[\\/]/).pop() ?? path
    const trimmed = newName.trim()
    if (!trimmed || trimmed === currentName) {
      renaming = null
      return
    }
    if (!isTauriAvailable()) return
    try {
      const newPath = await invoke<string>('rename_path', {
        path,
        newName: trimmed,
      })
      renaming = null
      tabStore.remapPaths(path, newPath)
      expandedPaths = new Set(
        Array.from(expandedPaths, (p) => remapPathPrefix(p, path, newPath)),
      )
      if (selectedPath) {
        selectedPath = remapPathPrefix(selectedPath, path, newPath)
      }
      await explorerStore.refresh()
      selectedPath = newPath
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      renaming = { path, error: msg }
    }
  }

  function menuRename(node: ExplorerNode) {
    closeMenu()
    startRename(node.path)
  }

  // True when `candidate` is exactly `path` or lives inside it (a
  // descendant file/folder) - same prefix-matching rule as
  // `remapPathPrefix`/`tabStore.remapPaths` above, just as a boolean check
  // instead of a rewrite.
  function isPathOrDescendant(candidate: string | null, path: string): boolean {
    if (candidate === null) return false
    return (
      candidate === path ||
      candidate.startsWith(path + '/') ||
      candidate.startsWith(path + '\\')
    )
  }

  // Shared cleanup after a delete (via trash or permanent) actually
  // succeeds on the backend: close every open tab pointing at the deleted
  // path or something inside it, clear the selection if it was affected,
  // then refresh the tree. Tabs are closed one at a time (not in parallel)
  // so a dirty tab's unsaved-changes confirmation dialog never overlaps
  // with another one still pending.
  async function finishDelete(path: string) {
    const affected = $tabStore.tabs.filter((tab) =>
      isPathOrDescendant(tab.filePath, path),
    )
    for (const tab of affected) {
      await tabStore.close(tab.id)
    }
    if (isPathOrDescendant(selectedPath, path)) {
      selectedPath = null
      selectedIsDirectory = false
    }
    await explorerStore.refresh()
  }

  async function deletePath(path: string) {
    const name = path.split(/[\\/]/).pop() ?? path
    const trashMessage = $i18n('explorer.delete_confirm', { name })
    const confirmedTrash = isTauriAvailable()
      ? await ask(trashMessage, { title: 'Pascoal', kind: 'warning' })
      : window.confirm(trashMessage)
    if (!confirmedTrash) return
    if (!isTauriAvailable()) return

    try {
      await invoke('trash_path', { path })
      await finishDelete(path)
      return
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e)
      const permanentMessage = $i18n('explorer.delete_permanently_confirm', {
        name,
        error,
      })
      const confirmedPermanent = await ask(permanentMessage, {
        title: 'Pascoal',
        kind: 'warning',
      })
      if (!confirmedPermanent) return

      try {
        await invoke('delete_path_permanently', { path })
        await finishDelete(path)
      } catch (e2) {
        const error2 = e2 instanceof Error ? e2.message : String(e2)
        await message($i18n('explorer.delete_failed', { name, error: error2 }), {
          title: 'Pascoal',
          kind: 'error',
        })
      }
    }
  }

  function menuDelete(node: ExplorerNode) {
    closeMenu()
    deletePath(node.path)
  }

  function menuCut(node: ExplorerNode) {
    closeMenu()
    clipboard = { path: node.path, mode: 'cut' }
  }

  function menuCopy(node: ExplorerNode) {
    closeMenu()
    clipboard = { path: node.path, mode: 'copy' }
  }

  // Copies or moves `clipboard.path` into `targetParent`. Cut is a one-shot
  // action: it clears the clipboard once the move succeeds and remaps any
  // open tabs/expanded paths/selection pointing at the old location, since
  // the original path no longer exists. Copy leaves the clipboard untouched
  // (so the same item can be pasted into multiple places, matching standard
  // OS behavior) and never remaps anything, since the original file/folder
  // and its open tabs are untouched by a copy.
  async function pasteClipboard(targetParent: string | null) {
    if (!clipboard || !targetParent) return
    if (!isTauriAvailable()) return
    const { path, mode } = clipboard
    try {
      const command = mode === 'copy' ? 'copy_path' : 'move_path'
      const newPath = await invoke<string>(command, {
        path,
        destinationParent: targetParent,
      })
      if (mode === 'cut') {
        clipboard = null
        tabStore.remapPaths(path, newPath)
        expandedPaths = new Set(
          Array.from(expandedPaths, (p) => remapPathPrefix(p, path, newPath)),
        )
        if (selectedPath) {
          selectedPath = remapPathPrefix(selectedPath, path, newPath)
        }
      }
      expandFolder(targetParent)
      await explorerStore.refresh()
      selectedPath = newPath
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await message(msg, { title: 'Pascoal', kind: 'error' })
    }
  }

  function menuPaste(node: ExplorerNode) {
    closeMenu()
    pasteClipboard(node.path)
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

  function menuPasteRoot() {
    closeMenu()
    if (folder) pasteClipboard(folder.path)
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

  // Escape closes the context menu overlay regardless of where keyboard
  // focus currently is - it covers the whole screen, so it must stay global
  // on `window` rather than scoped to the tree.
  function handleGlobalKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeMenu()
  }

  // Shared by handleTreeKeydown (Ctrl+C/X/V) and the `menu-cut`/`menu-copy`/
  // `menu-paste` Edit-menu listeners below - both act on whatever is
  // currently selected in the tree.
  function cutSelected() {
    if (selectedPath) clipboard = { path: selectedPath, mode: 'cut' }
  }

  function copySelected() {
    if (selectedPath) clipboard = { path: selectedPath, mode: 'copy' }
  }

  function pasteToSelection() {
    if (clipboard) pasteClipboard(toolbarTargetParent())
  }

  // F2/Delete/Cut/Copy/Paste act on the selected tree item and must only
  // fire while keyboard focus is inside the file tree - the Explorer panel
  // sits in a split pane next to the code editor, so a global `window`
  // listener for these would also fire while the user is typing/deleting
  // text in the editor, acting on whatever was last selected in the tree.
  // Attaching this to `.tree-body` (rather than `window`) relies on native
  // event bubbling: it only fires when a descendant of `.tree-body` (e.g. a
  // focused tree row) has focus.
  function handleTreeKeydown(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey
    if (e.key === 'F2' && selectedPath && !pendingCreate && !renaming) {
      startRename(selectedPath)
    } else if (e.key === 'Delete' && selectedPath && !pendingCreate && !renaming) {
      deletePath(selectedPath)
    } else if (mod && e.key.toLowerCase() === 'c' && selectedPath) {
      e.preventDefault()
      copySelected()
    } else if (mod && e.key.toLowerCase() === 'x' && selectedPath) {
      e.preventDefault()
      cutSelected()
    } else if (mod && e.key.toLowerCase() === 'v' && clipboard) {
      e.preventDefault()
      pasteToSelection()
    }
  }

  function handleTreeFocusIn() {
    activeFocusStore.set('explorer')
  }

  let unlistenMenuCut: (() => void) | null = null
  let unlistenMenuCopy: (() => void) | null = null
  let unlistenMenuPaste: (() => void) | null = null

  // The Edit menu's Cut/Copy/Paste route to the tree only when it currently
  // owns keyboard focus - see the matching guard (inverted) in
  // Editor.svelte's setupMenuListeners.
  onMount(() => {
    async function setup() {
      if (!isTauriAvailable()) return
      try {
        const { listen } = await import('@tauri-apps/api/event')

        unlistenMenuCut = await listen('menu-cut', () => {
          if (get(activeFocusStore) !== 'explorer') return
          cutSelected()
        })

        unlistenMenuCopy = await listen('menu-copy', () => {
          if (get(activeFocusStore) !== 'explorer') return
          copySelected()
        })

        unlistenMenuPaste = await listen('menu-paste', () => {
          if (get(activeFocusStore) !== 'explorer') return
          pasteToSelection()
        })
      } catch (e) {
        console.error('File tree menu event listeners failed to register:', e)
      }
    }

    setup()
  })

  onDestroy(() => {
    unlistenMenuCut?.()
    unlistenMenuCopy?.()
    unlistenMenuPaste?.()
  })
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

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
    <div
      class="tree-body"
      onclick={handleEmptyClick}
      oncontextmenu={handleEmptyContextMenu}
      onkeydown={handleTreeKeydown}
      onfocusin={handleTreeFocusIn}
    >
      {#if loading}
        <p class="status-msg">{$i18n('explorer.loading')}</p>
      {:else if error}
        <p class="status-msg error">{error}</p>
      {:else}
        {#if pendingCreate && pendingCreate.parentPath === folder.path}
          <!-- parentPath={folder.path}, not {pendingCreate.parentPath} - see the comment in NewEntryRow.svelte's handleBlur -->
          <NewEntryRow
            depth={0}
            isDirectory={pendingCreate.isDirectory}
            parentPath={folder.path}
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
            {renaming}
            {clipboard}
            onToggle={toggle}
            onFileClick={openFile}
            onContextMenu={handleContextMenu}
            onCreateConfirm={confirmCreate}
            onCreateCancel={cancelCreate}
            onRenameConfirm={confirmRename}
            onRenameCancel={cancelRename}
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
      {#if clipboard}
        <button class="menu-item" onclick={() => menuPaste(menuNode)}>
          {$i18n('explorer.paste')}
        </button>
      {/if}
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
    <button class="menu-item" onclick={() => menuCut(menuNode)}>
      {$i18n('explorer.cut')}
    </button>
    <button class="menu-item" onclick={() => menuCopy(menuNode)}>
      {$i18n('explorer.copy')}
    </button>
    <hr class="menu-sep" />
    <button class="menu-item" onclick={() => menuRename(menuNode)}>
      {$i18n('explorer.rename')}
    </button>
    <hr class="menu-sep" />
    <button class="menu-item" onclick={() => menuCopyPath(menuNode)}>
      {$i18n('explorer.copy_path')}
    </button>
    <button class="menu-item" onclick={() => menuCopyRelativePath(menuNode)}>
      {$i18n('explorer.copy_relative_path')}
    </button>
    <hr class="menu-sep" />
    <button class="menu-item" onclick={() => menuDelete(menuNode)}>
      {$i18n('explorer.delete')}
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
    {#if clipboard}
      <button class="menu-item" onclick={menuPasteRoot}>
        {$i18n('explorer.paste')}
      </button>
    {/if}
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
