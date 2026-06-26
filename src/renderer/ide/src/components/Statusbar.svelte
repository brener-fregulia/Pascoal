<script lang="ts">
  import { appStore } from '../stores/app'
  import { themeStore } from '../stores/theme'
  import { i18n, localeStore, LOCALE_OPTIONS, type Locale } from '../i18n'
  import LocaleFlag from '../icons/LocaleFlag.svelte'

  $: info = $appStore.info
  $: fpcLabel = info?.fpcInstalled
    ? `FPC ${info.fpcVersion}`
    : $i18n('statusbar.fpc_not_found')
  $: versionLabel = info ? `${info.name} v${info.version}` : 'Pascoal'
  $: themeLabel =
    $themeStore.current.charAt(0).toUpperCase() + $themeStore.current.slice(1)
  $: currentLocale = LOCALE_OPTIONS.find((o) => o.value === $localeStore)!

  let showLocalePicker = false

  function selectLocale(locale: Locale) {
    localeStore.set(locale)
    showLocalePicker = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') showLocalePicker = false
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if showLocalePicker}
  <div
    class="locale-backdrop"
    on:click={() => (showLocalePicker = false)}
  ></div>
{/if}

<footer id="statusbar">
  <span>{fpcLabel}</span>
  <span class="sep">|</span>
  <span>{versionLabel}</span>

  <div class="spacer"></div>

  <button
    class="status-btn"
    on:click={() => themeStore.cycle()}
    title="Cycle theme"
  >
    {themeLabel}
  </button>

  <span class="sep">|</span>

  <div class="locale-wrapper">
    <button
      class="status-btn"
      title="Language / Idioma"
      on:click={() => (showLocalePicker = !showLocalePicker)}
    >
      <LocaleFlag locale={$localeStore} />
      <span class="locale-code"
        >{currentLocale.value.toUpperCase().slice(0, 2)}</span
      >
    </button>

    {#if showLocalePicker}
      <div class="locale-popover" role="listbox" aria-label="Select language">
        {#each LOCALE_OPTIONS as option}
          <button
            class="locale-option"
            class:active={option.value === $localeStore}
            role="option"
            aria-selected={option.value === $localeStore}
            on:click={() => selectLocale(option.value)}
          >
            <LocaleFlag locale={option.value} />
            <span class="option-label">{option.label}</span>
            {#if option.value === $localeStore}
              <span class="option-check">✓</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</footer>

<style>
  #statusbar {
    background: var(--accent);
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: #fff;
    user-select: none;
    position: relative;
  }

  :global([data-theme='charcoal']) #statusbar {
    color: #e8d8c0;
  }

  .sep {
    opacity: 0.4;
  }
  .spacer {
    flex: 1;
  }

  .status-btn {
    background: transparent;
    border: none;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    opacity: 0.85;
    transition: opacity 0.15s;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 4px;
    height: 100%;
  }

  .status-btn:hover {
    opacity: 1;
  }

  .locale-code {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .locale-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .locale-backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .locale-popover {
    position: absolute;
    bottom: calc(100% + 6px);
    right: 0;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);
    min-width: 215px;
    z-index: 100;
    overflow: hidden;
    padding: 4px 0;
  }

  .locale-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 7px 12px;
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
  }

  .locale-option:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text);
  }

  .locale-option.active {
    color: var(--text);
  }
  .option-label {
    flex: 1;
  }

  .option-check {
    color: var(--success);
    font-size: 11px;
    flex-shrink: 0;
  }
</style>
