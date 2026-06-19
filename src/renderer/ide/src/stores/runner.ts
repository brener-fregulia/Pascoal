import { get } from 'svelte/store'
import { tabStore } from './tabs'
import { consoleStore, clearConsoleSignal } from './console'
import { settingsStore } from './settings'

export async function runActiveFile() {
  if (!window.__TAURI__) return

  const tab = tabStore.getActive()
  if (!tab) {
    consoleStore.show()
    return
  }

  const settings = get(settingsStore)
  const content = tab.session.getValue()

  // Auto-save before run if enabled
  if (settings.autoSaveBeforeRun) {
    if (tab.filePath) {
      try {
        await window.__TAURI__.core.invoke('save_file', {
          content,
          filePath: tab.filePath,
        })
        tabStore.markClean(tab.id)
      } catch (e) {
        console.error('Failed to save:', e)
        return
      }
    } else {
      consoleStore.show()
      return
    }
  }

  consoleStore.show()
  consoleStore.setRunning(false)
  consoleStore.resetBuild()
  clearConsoleSignal.update(n => n + 1)

  // Small delay to ensure clear renders before output arrives
  await new Promise(resolve => setTimeout(resolve, 50))

  try {
    await window.__TAURI__.core.invoke('compile_and_run', { code: content })
  } catch (e) {
    console.error('compile_and_run failed:', e)
    consoleStore.setRunning(false)
    consoleStore.setBuildStatus('error')
  }
}