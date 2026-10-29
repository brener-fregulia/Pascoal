<script lang="ts">
  import { onMount } from 'svelte'
  import { i18n } from '../i18n'
  import {
    availableCommands,
    executeCommand,
    filterCommands,
    type Command,
  } from './commands'

  let { onClose }: { onClose: () => void } = $props()

  const uid = $props.id()
  const listboxId = `${uid}-listbox`

  let rootEl: HTMLDivElement
  let inputEl: HTMLInputElement
  let query = $state('')
  let activeIndex = $state(0)
  let available = $state<Command[]>(availableCommands())
  let previousFocus: HTMLElement | null = null

  let results = $derived(filterCommands(available, query, $i18n))
  let selectedIndex = $derived(
    results.length === 0 ? -1 : Math.min(activeIndex, results.length - 1),
  )
  let activeDescendant = $derived(
    selectedIndex >= 0 ? optionId(results[selectedIndex]) : undefined,
  )

  function optionId(command: Command): string {
    return `${uid}-option-${command.id}`
  }

  onMount(() => {
    const focused = document.activeElement
    previousFocus = focused instanceof HTMLElement ? focused : null
    inputEl.focus()

    // A direct listener instead of a delegated `onkeydown`, so propagation is
    // stopped before the event reaches the `document` listener of
    // Editor.svelte and the `window` listeners of the shell and modals.
    rootEl.addEventListener('keydown', handleKeydown)
    return () => rootEl.removeEventListener('keydown', handleKeydown)
  })

  function close() {
    if (previousFocus?.isConnected) previousFocus.focus()
    onClose()
  }

  // Closes and restores focus first, so the command can move focus itself
  // (editor, search input, file dialog).
  function execute(command: Command) {
    close()
    void executeCommand(command)
  }

  function move(delta: number) {
    if (results.length === 0) return
    activeIndex = (selectedIndex + delta + results.length) % results.length
    const id = optionId(results[activeIndex])
    document.getElementById(id)?.scrollIntoView?.({ block: 'nearest' })
  }

  function handleKeydown(e: KeyboardEvent) {
    e.stopPropagation()
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        move(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        move(-1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) execute(results[selectedIndex])
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        // The input is the only focusable element of the dialog.
        e.preventDefault()
        break
    }
  }

  function handleInput() {
    available = availableCommands()
    activeIndex = 0
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="cp-backdrop" onclick={close}>
  <div
    bind:this={rootEl}
    class="cp-dialog"
    onclick={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-label={$i18n('command_palette.title')}
    tabindex="-1"
  >
    <input
      bind:this={inputEl}
      bind:value={query}
      oninput={handleInput}
      class="cp-input"
      type="text"
      role="combobox"
      aria-label={$i18n('command_palette.title')}
      aria-expanded={results.length > 0}
      aria-controls={listboxId}
      aria-autocomplete="list"
      aria-activedescendant={activeDescendant}
      placeholder={$i18n('command_palette.placeholder')}
      spellcheck="false"
      autocomplete="off"
    />

    <ul
      id={listboxId}
      class="cp-list"
      role="listbox"
      aria-label={$i18n('command_palette.title')}
    >
      {#each results as command, i (command.id)}
        <li
          id={optionId(command)}
          class="cp-option"
          class:active={i === selectedIndex}
          role="option"
          aria-selected={i === selectedIndex}
          onmousemove={() => (activeIndex = i)}
          onclick={() => execute(command)}
        >
          {$i18n(command.labelKey)}
        </li>
      {/each}
    </ul>

    {#if results.length === 0}
      <p class="cp-empty" role="status">
        {$i18n('command_palette.no_results')}
      </p>
    {/if}
  </div>
</div>

<style>
  .cp-backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 56px;
    z-index: 200;
  }

  .cp-dialog {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    width: min(560px, calc(100vw - 32px));
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .cp-input {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 5px;
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 13px;
    padding: 6px 8px;
    outline: none;
  }

  .cp-input:focus {
    border-color: var(--accent);
  }

  .cp-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 320px;
    overflow-y: auto;
  }

  .cp-option {
    padding: 6px 8px;
    border-radius: 4px;
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--text);
    cursor: pointer;
  }

  .cp-option.active {
    background: rgba(128, 128, 128, 0.18);
  }

  .cp-empty {
    padding: 6px 8px;
    font-size: 12px;
    color: var(--text-dim);
    font-style: italic;
  }
</style>
