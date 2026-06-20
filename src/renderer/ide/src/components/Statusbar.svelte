<script lang="ts">
  import { appStore } from "../stores/app";
  import { themeStore } from "../stores/theme";
  import { i18n } from "../i18n";

  $: info = $appStore.info;
  $: fpcLabel = info?.fpcInstalled ? `FPC ${info.fpcVersion}` : $i18n('statusbar.fpc_not_found');
  $: versionLabel = info ? `${info.name} v${info.version}` : "Pascoal";
  $: themeLabel =
    $themeStore.current.charAt(0).toUpperCase() + $themeStore.current.slice(1);
</script>

<footer id="statusbar">
  <span>{fpcLabel}</span>
  <span>|</span>
  <span>{versionLabel}</span>
  <div class="spacer"></div>
  <button class="theme-btn" on:click={() => themeStore.cycle()}>
    {themeLabel}
  </button>
</footer>

<style>
  #statusbar {
    background: var(--accent);
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 16px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: #fff;
    user-select: none;
  }

  :global([data-theme="charcoal"]) #statusbar {
    color: #e8d8c0;
  }

  .spacer {
    flex: 1;
  }

  .theme-btn {
    background: transparent;
    border: none;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.15s;
  }

  .theme-btn:hover {
    opacity: 1;
  }
</style>
