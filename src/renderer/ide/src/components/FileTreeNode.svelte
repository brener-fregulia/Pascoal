<script lang="ts">
  import type { ExplorerNode } from '../stores/explorerStore'
  import FileTreeNode from './FileTreeNode.svelte'
  import File from '../icons/File.svelte'
  import Folder from '../icons/Folder.svelte'

  let {
    node,
    depth,
    expandedPaths,
    onToggle,
    onFileClick,
  }: {
    node: ExplorerNode
    depth: number
    expandedPaths: Set<string>
    onToggle: (path: string) => void
    onFileClick: (node: ExplorerNode) => void
  } = $props()

  let isExpanded = $derived(expandedPaths.has(node.path))
</script>

{#if node.isDirectory}
  <button
    class="tree-row dir-row"
    style="padding-left: {8 + depth * 14}px"
    title={node.relativePath}
    onclick={() => onToggle(node.path)}
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
        {onToggle}
        {onFileClick}
      />
    {/each}
  {/if}
{:else}
  <button
    class="tree-row file-row"
    style="padding-left: {8 + depth * 14 + 16}px"
    title={node.relativePath}
    onclick={() => onFileClick(node)}
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
