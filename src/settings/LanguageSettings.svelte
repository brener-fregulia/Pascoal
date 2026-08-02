<script lang="ts">
  import { i18n, localeStore, LOCALE_OPTIONS } from '../i18n'
  import LocaleFlag from '../icons/LocaleFlag.svelte'
</script>

<section>
  <h3>{$i18n('settings.category_language')}</h3>
  <div id="locale-options">
    {#each LOCALE_OPTIONS as option}
      <button
        class="locale-option"
        class:active={$localeStore === option.value}
        on:click={() => localeStore.set(option.value)}
      >
        <LocaleFlag locale={option.value} />
        <span class="locale-label">{option.label}</span>
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

  #locale-options {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: 280px;
  }

  .locale-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: var(--text-dim);
    font-family: var(--font-ui);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
  }

  .locale-option:hover {
    background: rgba(128, 128, 128, 0.1);
    color: var(--text);
  }

  .locale-option.active {
    border-color: var(--accent2);
    color: var(--text);
    font-weight: 600;
  }
</style>
