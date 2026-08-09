<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import Titlebar from './app/Titlebar.svelte'
  import ActivityBar from './app/ActivityBar.svelte'
  import EditorArea from './editor/EditorArea.svelte'
  import SettingsView from './settings/SettingsView.svelte'
  import Statusbar from './app/Statusbar.svelte'
  import AboutModal from './app/AboutModal.svelte'
  import FpcMissingModal from './app/FpcMissingModal.svelte'
  import UpdateAvailableModal from './app/UpdateAvailableModal.svelte'
  import WhatsNewModal from './app/WhatsNewModal.svelte'
  import VersionHistoryModal from './app/VersionHistoryModal.svelte'
  import { appStore } from './app/app'
  import { whatsNewStore } from './app/whatsNew'
  import { themeStore } from './shared/theme'
  import { tabStore } from './editor/tabs'
  import { explorerStore } from './project/explorerStore'
  import { searchFocusTick } from './project/searchStore'
  import { recentWorkspacesStore } from './project/recentWorkspaces'
  import { settingsStore } from './settings/settingsStore'
  import { fpcInstallStore } from './toolchain/fpcInstall'
  import { updateStore } from './integrations/updater/updateStore'
  import { gitStore } from './integrations/git/gitStore'
  import { isTauriAvailable, invoke } from './integrations/tauri/client'

  const PASCAL_TEMPLATE = `program Untitled;\n\nbegin\n\nend.\n`

  let activePanel = $state<string | null>(null)
  let showAbout = $state(false)
  let showVersionHistory = $state(false)

  onMount(async () => {
    themeStore.init()
    gitStore.watchFolder()
    await appStore.init()
    await whatsNewStore.checkAfterUpdate()

    if (!import.meta.env.DEV) {
      window.addEventListener('contextmenu', (e) => e.preventDefault())
      updateStore.checkForUpdate(true)
    }

    if (!isTauriAvailable()) return
    const { listen } = await import('@tauri-apps/api/event')

    if (get(settingsStore).reopenLastWorkspace) {
      const [lastWorkspace] = get(recentWorkspacesStore)
      if (lastWorkspace) {
        const opened = await explorerStore.openFolderAtPath(lastWorkspace.path)
        if (opened) {
          if (activePanel === null) activePanel = 'explorer'
        } else {
          recentWorkspacesStore.remove(lastWorkspace.path)
        }
      }
    }

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

    await listen('menu-find-in-files', () => {
      activePanel = 'search'
      searchFocusTick.update((n) => n + 1)
    })

    await listen<string>('menu-open-recent-workspace', async (event) => {
      const path = event.payload
      const opened = await explorerStore.openFolderAtPath(path)
      if (opened) {
        activePanel = 'explorer'
      } else {
        recentWorkspacesStore.remove(path)
      }
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

    await listen('menu-release-notes', () => {
      whatsNewStore.showCurrent()
    })

    await listen('menu-version-history', () => {
      showVersionHistory = true
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
    {#if activePanel === 'settings'}
      <SettingsView onClose={() => (activePanel = null)} />
    {:else}
      <EditorArea {activePanel} />
    {/if}
  </div>
  <Statusbar />
</div>

<AboutModal bind:open={showAbout} />
<FpcMissingModal />
<UpdateAvailableModal />
<WhatsNewModal onViewHistory={() => (showVersionHistory = true)} />
<VersionHistoryModal bind:open={showVersionHistory} />

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
    grid-template-rows: 1fr;
    overflow: hidden;
  }
</style>
