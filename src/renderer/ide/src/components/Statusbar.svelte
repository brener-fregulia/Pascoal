<script lang="ts">
  import { appStore } from '../stores/app'
  import { themeStore } from '../stores/theme'
  import { i18n, localeStore, LOCALE_OPTIONS, type Locale } from '../i18n'

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

  // Returns SVG markup string for a given locale flag
  // Using simple geometric SVG flags — no emoji, no external resources
  function flagSvg(locale: Locale): string {
    const flags: Record<Locale, string> = {
      en: `
        <rect width="20" height="14" fill="#B22234"/>
        <rect y="1.08" width="20" height="1.08" fill="#fff"/>
        <rect y="3.23" width="20" height="1.08" fill="#fff"/>
        <rect y="5.38" width="20" height="1.08" fill="#fff"/>
        <rect y="7.54" width="20" height="1.08" fill="#fff"/>
        <rect y="9.69" width="20" height="1.08" fill="#fff"/>
        <rect y="11.85" width="20" height="1.08" fill="#fff"/>
        <rect width="8" height="7.54" fill="#3C3B6E"/>`,
      'pt-BR': `
        <rect width="20" height="14" fill="#009C3B"/>
        <polygon points="10,1.5 18.5,7 10,12.5 1.5,7" fill="#FEDF00"/>
        <circle cx="10" cy="7" r="3.2" fill="#002776"/>
        <path d="M7.1 6.4 Q10 5.2 12.9 6.4" stroke="#fff" stroke-width="0.7" fill="none"/>`,
      'es-419': `
        <rect width="20" height="4.67" fill="#CE1126"/>
        <rect y="4.67" width="20" height="4.67" fill="#FCD116"/>
        <rect y="9.33" width="20" height="4.67" fill="#CE1126"/>`,
      pl: `
        <rect width="20" height="7" fill="#fff"/>
        <rect y="7" width="20" height="7" fill="#DC143C"/>`,
    }
    return flags[locale] ?? ''
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

  <!-- Theme cycler -->
  <button
    class="status-btn"
    on:click={() => themeStore.cycle()}
    title="Cycle theme"
  >
    {themeLabel}
  </button>

  <span class="sep">|</span>

  <!-- Locale picker -->
  <div class="locale-wrapper">
    <button
      class="status-btn locale-btn"
      title="Language / Idioma"
      on:click={() => (showLocalePicker = !showLocalePicker)}
    >
      <svg class="flag" viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg">
        {@html flagSvg($localeStore)}
      </svg>
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
            <svg
              class="flag"
              viewBox="0 0 20 14"
              xmlns="http://www.w3.org/2000/svg"
            >
              {@html flagSvg(option.value)}
            </svg>
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

  .flag {
    width: 18px;
    height: 13px;
    border-radius: 2px;
    flex-shrink: 0;
    display: block;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
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
