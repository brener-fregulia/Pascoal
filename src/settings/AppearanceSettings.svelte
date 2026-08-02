<script lang="ts">
  import { i18n } from '../i18n'
  import { themeStore, type Theme } from '../shared/theme'

  const THEMES: Theme[] = ['dark', 'light', 'charcoal']
  const labelKeys: Record<Theme, string> = {
    dark: 'settings.theme_dark',
    light: 'settings.theme_light',
    charcoal: 'settings.theme_charcoal',
  }
</script>

<section>
  <h3>{$i18n('settings.section_themes')}</h3>
  <div id="theme-options">
    {#each THEMES as theme}
      <button
        class="theme-option"
        class:active={$themeStore.current === theme}
        on:click={() => themeStore.apply(theme)}
      >
        <span class="swatch-frame">
          <span class="swatch" data-theme={theme}>
            <span class="swatch-sidebar"></span>
            <span class="swatch-main">
              <span class="swatch-tabbar">
                <span class="swatch-tab"></span>
              </span>
              <span class="swatch-code">
                <span class="code-line"></span>
                <span class="code-line"></span>
                <span class="code-line"></span>
                <span class="code-line"></span>
              </span>
            </span>
          </span>
        </span>
        <span class="theme-label">{$i18n(labelKeys[theme])}</span>
      </button>
    {/each}
  </div>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  #theme-options {
    display: flex;
    gap: 20px;
  }

  .theme-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: var(--font-ui);
  }

  .swatch-frame {
    padding: 3px;
    border-radius: 10px;
    border: 2px solid var(--border);
    transition: border-color 0.15s;
  }

  .theme-option:hover .swatch-frame {
    border-color: var(--accent2);
  }

  .theme-option.active .swatch-frame {
    border-color: var(--accent2);
  }

  .swatch {
    width: 150px;
    height: 96px;
    border-radius: 7px;
    background: var(--bg);
    display: flex;
    overflow: hidden;
  }

  .swatch-sidebar {
    width: 26px;
    background: var(--sidebar);
    flex-shrink: 0;
  }

  .swatch-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .swatch-tabbar {
    height: 14px;
    background: var(--panel);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: flex-end;
    padding: 0 8px;
    flex-shrink: 0;
  }

  .swatch-tab {
    width: 28px;
    height: 3px;
    border-radius: 2px 2px 0 0;
    background: var(--accent2);
  }

  .swatch-code {
    flex: 1;
    padding: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 7px;
  }

  .code-line {
    height: 5px;
    border-radius: 2px;
    background: var(--text-dim);
  }

  .code-line:nth-child(1) {
    width: 65%;
    background: var(--accent2);
  }

  .code-line:nth-child(2) {
    width: 40%;
  }

  .code-line:nth-child(3) {
    width: 78%;
    background: var(--accent);
  }

  .code-line:nth-child(4) {
    width: 50%;
  }

  .theme-label {
    font-size: 12px;
    color: var(--text-dim);
  }

  .theme-option.active .theme-label {
    color: var(--text);
    font-weight: 600;
  }
</style>
