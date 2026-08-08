<script lang="ts">
  import type { ExplorerNode } from './explorerStore'
  import FileTreeNode from './FileTreeNode.svelte'
  import NewEntryRow from './NewEntryRow.svelte'
  import RenameInput from './RenameInput.svelte'
  import File from '../icons/File.svelte'
  import Folder from '../icons/Folder.svelte'

  let {
    node,
    depth,
    expandedPaths,
    selectedPath = null,
    pendingCreate = null,
    renaming = null,
    clipboard = null,
    onToggle,
    onFileClick,
    onContextMenu = () => {},
    onCreateConfirm = () => {},
    onCreateCancel = () => {},
    onRenameConfirm = () => {},
    onRenameCancel = () => {},
  }: {
    node: ExplorerNode
    depth: number
    expandedPaths: Set<string>
    selectedPath?: string | null
    pendingCreate?: {
      parentPath: string
      isDirectory: boolean
      error: string | null
    } | null
    renaming?: { path: string; error: string | null } | null
    clipboard?: { path: string; mode: 'copy' | 'cut' } | null
    onToggle: (path: string) => void
    onFileClick: (node: ExplorerNode) => void
    onContextMenu?: (node: ExplorerNode, x: number, y: number) => void
    onCreateConfirm?: (name: string) => void
    onCreateCancel?: (parentPath: string) => void
    onRenameConfirm?: (name: string) => void
    onRenameCancel?: (path: string) => void
  } = $props()

  let isExpanded = $derived(expandedPaths.has(node.path))
  let isSelected = $derived(node.path === selectedPath)
  let isRenaming = $derived(node.path === renaming?.path)
  let renameError = $derived(isRenaming ? (renaming?.error ?? null) : null)
  let isCut = $derived(node.path === clipboard?.path && clipboard?.mode === 'cut')

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu(node, e.clientX, e.clientY)
  }

  // Native <button> elements already fire a click from Enter/Space by
  // default, which would trigger onclick below on its own in a real
  // browser - but that translation isn't simulated by jsdom (the test
  // environment), so it wouldn't be verifiable by an automated test, and it
  // would silently stop working if this row ever stopped being a <button>.
  // Handling Enter explicitly here (and preventing its default action, so
  // the native click-from-Enter doesn't also fire and double-run this) makes
  // the behavior explicit, robust to markup changes, and testable.
  function handleRowKeydown(e: KeyboardEvent) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (node.isDirectory) onToggle(node.path)
    else onFileClick(node)
  }
</script>

{#if node.isDirectory}
  {#if isRenaming}
    <!-- path={node.path}, not {renaming.path} - see the comment in RenameInput.svelte's handleBlur -->
    <RenameInput
      depth={depth}
      isDirectory={true}
      path={node.path}
      initialName={node.name}
      error={renameError}
      onConfirm={onRenameConfirm}
      onCancel={onRenameCancel}
    />
  {:else}
    <button
      class="tree-row dir-row"
      class:selected={isSelected}
      class:cut={isCut}
      style="padding-left: {8 + depth * 14}px"
      title={node.relativePath}
      onclick={() => onToggle(node.path)}
      onkeydown={handleRowKeydown}
      oncontextmenu={handleContextMenu}
    >
      <span class="chevron">{isExpanded ? '▾' : '▸'}</span>
      <Folder size={13} />
      <span class="node-name">{node.name}</span>
    </button>
  {/if}

  {#if isExpanded && node.children}
    {#if pendingCreate?.parentPath === node.path}
      <!-- parentPath={node.path}, not {pendingCreate.parentPath} - see the comment in NewEntryRow.svelte's handleBlur -->
      <NewEntryRow
        depth={depth + 1}
        isDirectory={pendingCreate.isDirectory}
        parentPath={node.path}
        error={pendingCreate.error}
        onConfirm={onCreateConfirm}
        onCancel={onCreateCancel}
      />
    {/if}
    {#each node.children as child (child.path)}
      <FileTreeNode
        node={child}
        depth={depth + 1}
        {expandedPaths}
        {selectedPath}
        {pendingCreate}
        {renaming}
        {clipboard}
        {onToggle}
        {onFileClick}
        {onContextMenu}
        {onCreateConfirm}
        {onCreateCancel}
        {onRenameConfirm}
        {onRenameCancel}
      />
    {/each}
  {/if}
{:else if isRenaming}
  <!-- path={node.path}, not {renaming.path} - see the comment in RenameInput.svelte's handleBlur -->
  <RenameInput
    depth={depth}
    isDirectory={false}
    path={node.path}
    initialName={node.name}
    error={renameError}
    onConfirm={onRenameConfirm}
    onCancel={onRenameCancel}
  />
{:else}
  <button
    class="tree-row file-row"
    class:selected={isSelected}
    class:cut={isCut}
    style="padding-left: {8 + depth * 14 + 16}px"
    title={node.relativePath}
    onclick={() => onFileClick(node)}
    onkeydown={handleRowKeydown}
    oncontextmenu={handleContextMenu}
  >
    <File size={13} />
    <span class="node-name">{node.name}</span>
  </button>
{/if}

<style>
  .tree-row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding-top: 3px;
    padding-bottom: 3px;
    padding-right: 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--text-dim);
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    transition:
      background 0.1s,
      color 0.1s;
  }

  .tree-row:hover {
    background: rgba(128, 128, 128, 0.08);
    color: var(--text);
  }

  .tree-row.selected {
    background: rgba(128, 128, 128, 0.16);
    color: var(--text);
  }

  .tree-row.selected:hover {
    background: rgba(128, 128, 128, 0.22);
  }

  .tree-row.cut {
    opacity: 0.5;
  }

  .chevron {
    font-size: 9px;
    width: 10px;
    flex-shrink: 0;
    text-align: center;
  }

  .node-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
