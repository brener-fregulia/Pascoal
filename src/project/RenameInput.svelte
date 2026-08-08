<script lang="ts">
  import { untrack } from 'svelte'
  import File from '../icons/File.svelte'
  import Folder from '../icons/Folder.svelte'

  let {
    depth,
    isDirectory,
    path,
    initialName,
    error = null,
    onConfirm,
    onCancel,
  }: {
    depth: number
    isDirectory: boolean
    path: string
    initialName: string
    error?: string | null
    onConfirm: (name: string) => void
    onCancel: (path: string) => void
  } = $props()

  // Captured once at mount - this input is only ever meant to show the name
  // as it was when the rename started, not track later changes to the prop.
  let name = $state(untrack(() => initialName))
  let inputEl: HTMLInputElement | undefined = $state()

  $effect(() => {
    inputEl?.focus()
    inputEl?.select()
  })

  // `onCancel` reports which rename request this row belongs to, via `path`.
  // The parent MUST pass this component's own stable node path here (see the
  // call sites in FileTreeNode.svelte) - never a live read of the parent's
  // shared "what's being renamed now" state. See the comment on
  // NewEntryRow.svelte's handleBlur for the full explanation: a stale blur
  // fired as a side effect of this row being unmounted when a different
  // rename request replaces it must be a harmless no-op, not a clobber of
  // the request that replaced it.
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      onConfirm(name)
    } else if (e.key === 'Escape') {
      onCancel(path)
    }
  }

  function handleBlur() {
    onCancel(path)
  }
</script>

<div
  class="tree-row rename-row"
  style="padding-left: {8 + depth * 14 + (isDirectory ? 0 : 16)}px"
>
  {#if isDirectory}
    <Folder size={13} />
  {:else}
    <File size={13} />
  {/if}
  <input
    bind:this={inputEl}
    bind:value={name}
    class="rename-input"
    type="text"
    onkeydown={handleKeydown}
    onblur={handleBlur}
  />
</div>
{#if error}
  <p class="rename-error" style="padding-left: {8 + depth * 14}px">
    {error}
  </p>
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
  }

  .rename-input {
    flex: 1;
    min-width: 0;
    background: var(--bg);
    border: 1px solid var(--accent);
    border-radius: 2px;
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 12px;
    padding: 1px 4px;
    outline: none;
  }

  .rename-error {
    margin: 0;
    padding-top: 0;
    padding-bottom: 4px;
    padding-right: 8px;
    font-size: 11px;
    color: var(--error);
    white-space: normal;
    word-break: break-word;
  }
</style>
