<script lang="ts">
  import { themeStore } from './theme'
  import logoSrc from '../assets/pascoal-logo.svg'
  export let height: number = 32
</script>

<img
  src={logoSrc}
  alt="Pascoal"
  {height}
  class="logo"
  class:dark={$themeStore.current === 'dark' ||
    $themeStore.current === 'charcoal'}
  draggable="false"
/>

<style>
  .logo {
    height: 26px;
    width: auto;
    flex-shrink: 0;
    margin: 0 8px 0 12px;
    -webkit-app-region: no-drag;
  }

  /* Dark / Charcoal: shift to ash gray (#B0B0B0) */
  .logo.dark {
    filter: brightness(0) saturate(0) invert(1) brightness(0.69);
  }
</style>
