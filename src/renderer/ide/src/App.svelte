<script lang="ts">
  import { onMount } from 'svelte'
  import Titlebar from './components/Titlebar.svelte'
  import ActivityBar from './components/ActivityBar.svelte'
  import EditorArea from './components/EditorArea.svelte'
  import Statusbar from './components/Statusbar.svelte'
  import { appStore } from './stores/app'
  import { themeStore } from './stores/theme'
  import { explorerStore } from './stores/explorerStore'

  let activePanel = $state<string | null>(null)

  onMount(async () => {
    themeStore.init()
    await appStore.init()
  })

  $effect(() => {
    document.documentElement.setAttribute('data-theme', $themeStore.current)
  })

  $effect(() => {
    if ($explorerStore.folder && activePanel !== 'explorer') {
      activePanel = 'explorer'
    }
  })
</script>

<div id="layout">
  <Titlebar />
  <div id="main">
    <ActivityBar bind:activePanel />
    <EditorArea {activePanel} />
  </div>
  <Statusbar />
</div>

<style>
  #layout {
    display: grid;
    grid-template-rows: 36px 1fr 24px;
    height: 100vh;
    background: var(--bg);
    color: var(--text);
  }

  #main {
    display: grid;
    grid-template-columns: 48px 1fr;
    overflow: hidden;
  }
</style>
