<script lang="ts">
  import { i18n } from '../i18n'
  import File from '../icons/File.svelte'
  import Folder from '../icons/Folder.svelte'

  let {
    depth,
    isDirectory,
    parentPath,
    error = null,
    onConfirm,
    onCancel,
  }: {
    depth: number
    isDirectory: boolean
    parentPath: string
    error?: string | null
    onConfirm: (name: string) => void
    onCancel: (parentPath: string) => void
  } = $props()

  let name = $state('')
  let inputEl: HTMLInputElement | undefined = $state()

  $effect(() => {
    inputEl?.focus()
  })

  // `onCancel` reports which pendingCreate this row belongs to (`parentPath`
  // is this component's own prop, frozen relative to this instance - not a
  // live read of the parent's current state). Blur fires as a side effect of
  // this row being unmounted when a *different* create request replaces this
  // one (e.g. clicking "New File" on the toolbar while this row, for another
  // folder, is still open and focused) - without this, that stale blur would
  // cancel the *new* pendingCreate instead of being a harmless no-op, since
  // the parent only clears its state when the reported parentPath still
  // matches what's currently pending.
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const trimmed = name.trim()
      if (trimmed) onConfirm(trimmed)
    } else if (e.key === 'Escape') {
      onCancel(parentPath)
    }
  }

  function handleBlur() {
    onCancel(parentPath)
  }
</script>

<div
  class="tree-row new-entry-row"
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
    class="new-entry-input"
    type="text"
    placeholder={isDirectory
      ? $i18n('explorer.new_folder_placeholder')
      : $i18n('explorer.new_file_placeholder')}
    onkeydown={handleKeydown}
    onblur={handleBlur}
  />
</div>
{#if error}
  <p class="new-entry-error" style="padding-left: {8 + depth * 14}px">
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

  .new-entry-input {
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

  .new-entry-error {
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
