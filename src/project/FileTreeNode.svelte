<script lang="ts">
  import type { ExplorerNode } from './explorerStore'
  import FileTreeNode from './FileTreeNode.svelte'
  import File from '../icons/File.svelte'
  import Folder from '../icons/Folder.svelte'

  let {
    node,
    depth,
    expandedPaths,
    selectedPath = null,
    onToggle,
    onFileClick,
    onContextMenu = () => {},
  }: {
    node: ExplorerNode
    depth: number
    expandedPaths: Set<string>
    selectedPath?: string | null
    onToggle: (path: string) => void
    onFileClick: (node: ExplorerNode) => void
    onContextMenu?: (node: ExplorerNode, x: number, y: number) => void
  } = $props()

  let isExpanded = $derived(expandedPaths.has(node.path))
  let isSelected = $derived(node.path === selectedPath)

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault()
    onContextMenu(node, e.clientX, e.clientY)
  }
</script>

{#if node.isDirectory}
  <button
    class="tree-row dir-row"
    class:selected={isSelected}
    style="padding-left: {8 + depth * 14}px"
    title={node.relativePath}
    onclick={() => onToggle(node.path)}
    oncontextmenu={handleContextMenu}
  >
    <span class="chevron">{isExpanded ? '▾' : '▸'}</span>
    <Folder size={13} />
    <span class="node-name">{node.name}</span>
  </button>

  {#if isExpanded && node.children}
    {#each node.children as child (child.path)}
      <FileTreeNode
        node={child}
        depth={depth + 1}
        {expandedPaths}
        {selectedPath}
        {onToggle}
        {onFileClick}
        {onContextMenu}
      />
    {/each}
  {/if}
{:else}
  <button
    class="tree-row file-row"
    class:selected={isSelected}
    style="padding-left: {8 + depth * 14 + 16}px"
    title={node.relativePath}
    onclick={() => onFileClick(node)}
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
