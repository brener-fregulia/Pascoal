<script lang="ts">
  import { onMount } from 'svelte'
  import Titlebar from './components/Titlebar.svelte'
  import ActivityBar from './components/ActivityBar.svelte'
  import EditorArea from './editor/EditorArea.svelte'
  import Statusbar from './components/Statusbar.svelte'
  import AboutModal from './components/AboutModal.svelte'
  import FpcMissingModal from './components/FpcMissingModal.svelte'
  import UpdateAvailableModal from './components/UpdateAvailableModal.svelte'
  import { appStore } from './stores/app'
  import { themeStore } from './shared/theme'
  import { tabStore } from './editor/tabs'
  import { explorerStore } from './project/explorerStore'
  import { fpcInstallStore } from './toolchain/fpcInstall'
  import { updateStore } from './integrations/updater/updateStore'
  import { isTauriAvailable, invoke } from './integrations/tauri/client'

  const PASCAL_TEMPLATE = `program Untitled;\n\nbegin\n\nend.\n`

  let activePanel = $state<string | null>(null)
  let showAbout = $state(false)

  onMount(async () => {
    themeStore.init()
    await appStore.init()

    if (!import.meta.env.DEV) {
      window.addEventListener('contextmenu', (e) => e.preventDefault())
      updateStore.checkForUpdate(true)
    }

    if (!isTauriAvailable()) return
    const { listen } = await import('@tauri-apps/api/event')

    await listen('menu-new-file', async () => {
      const tab = await tabStore.newTab(PASCAL_TEMPLATE)
      tabStore.activate(tab.id)
    })

    await listen('menu-open-file', async () => {
      try {
        const result = await invoke<[string, string] | null>('open_file')
        if (result) {
          const [filePath, content] = result
          const tab = await tabStore.openFile(filePath, content)
          tabStore.activate(tab.id)
        }
      } catch (e) {
        console.error('open_file failed:', e)
      }
    })

    await listen('menu-open-folder', async () => {
      const opened = await explorerStore.openFolder()
      if (opened) activePanel = 'explorer'
    })

    await listen('menu-save-file', () => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
          bubbles: true,
        }),
      )
    })

    await listen('menu-save-file-as', () => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'S',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      )
    })

    await listen('menu-about', () => {
      showAbout = true
    })
  })

  $effect(() => {
    document.documentElement.setAttribute('data-theme', $themeStore.current)
  })

  $effect(() => {
    if ($appStore.info && !$appStore.loading && !$appStore.info.fpcInstalled) {
      fpcInstallStore.show()
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

<AboutModal bind:open={showAbout} />
<FpcMissingModal />
<UpdateAvailableModal />

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
