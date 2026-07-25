<script lang="ts">
  import type { Locale } from '../i18n'
  export let locale: Locale
</script>

<svg
  class="flag"
  viewBox="0 0 20 14"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  {#if locale === 'en'}
    <rect width="20" height="14" fill="#B22234" />
    <rect y="1.08" width="20" height="1.08" fill="#fff" />
    <rect y="3.23" width="20" height="1.08" fill="#fff" />
    <rect y="5.38" width="20" height="1.08" fill="#fff" />
    <rect y="7.54" width="20" height="1.08" fill="#fff" />
    <rect y="9.69" width="20" height="1.08" fill="#fff" />
    <rect y="11.85" width="20" height="1.08" fill="#fff" />
    <rect width="8" height="7.54" fill="#3C3B6E" />
  {:else if locale === 'pt-BR'}
    <rect width="20" height="14" fill="#009C3B" />
    <polygon points="10,1.5 18.5,7 10,12.5 1.5,7" fill="#FEDF00" />
    <circle cx="10" cy="7" r="3.2" fill="#002776" />
    <path
      d="M7.1 6.4 Q10 5.2 12.9 6.4"
      stroke="#fff"
      stroke-width="0.7"
      fill="none"
    />
  {:else if locale === 'es-419'}
    <rect width="20" height="4.67" fill="#CE1126" />
    <rect y="4.67" width="20" height="4.67" fill="#FCD116" />
    <rect y="9.33" width="20" height="4.67" fill="#CE1126" />
  {:else if locale === 'pl'}
    <rect width="20" height="7" fill="#fff" />
    <rect y="7" width="20" height="7" fill="#DC143C" />
  {/if}
</svg>

<style>
  .flag {
    width: 18px;
    height: 13px;
    border-radius: 2px;
    flex-shrink: 0;
    display: block;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
  }
</style>
