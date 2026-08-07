<script lang="ts">
  import { onMount } from 'svelte'
  import { tabStore } from '../editor/tabs'
  import {
    recentWorkspacesStore,
    type RecentWorkspace,
  } from '../project/recentWorkspaces'
  import { i18n } from '../i18n'
  import FileNew from '../icons/FileNew.svelte'
  import File from '../icons/File.svelte'
  import Folder from '../icons/Folder.svelte'
  import Git from '../icons/Git.svelte'
  import Play from '../icons/Play.svelte'
  import X from '../icons/X.svelte'
  import { isTauriAvailable, invoke } from '../integrations/tauri/client'

  const PASCAL_TEMPLATE = `program Untitled;\n\nbegin\n\nend.\n`

  onMount(() => {
    recentWorkspacesStore.validate()
  })

  async function handleNewFile() {
    const tab = await tabStore.newTab(PASCAL_TEMPLATE)
    tabStore.activate(tab.id)
  }

  async function handleOpenFile() {
    if (!isTauriAvailable()) return
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
  }

  async function handleOpenFolder() {
    if (!isTauriAvailable()) return
    const { emit } = await import('@tauri-apps/api/event')
    await emit('menu-open-folder')
  }

  // Routed through the same menu-open-recent-workspace event the File
  // menu uses (handled in App.svelte) instead of calling explorerStore
  // directly - that listener already switches activePanel to 'explorer'
  // on success, which is what makes opening a workspace from here visibly
  // show the folder, not just update state silently in the background.
  async function openRecentWorkspace(entry: RecentWorkspace) {
    if (!isTauriAvailable()) return
    const { emit } = await import('@tauri-apps/api/event')
    await emit('menu-open-recent-workspace', entry.path)
  }

  function formatDate(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24))
    if (diff === 0) return $i18n('welcome.recent_today')
    if (diff === 1) return $i18n('welcome.recent_yesterday')
    return $i18n('welcome.recent_days_ago', { n: diff })
  }
</script>

<div id="welcome">
  <div class="welcome-header">
    <h1>Pascoal</h1>
    <p>{$i18n('welcome.subtitle')}</p>
  </div>

  <div class="welcome-section">
    <h2>{$i18n('welcome.section_start')}</h2>

    <button class="welcome-action" on:click={handleNewFile}>
      <FileNew size={16} />
      {$i18n('welcome.new_file')}
    </button>

    <button class="welcome-action" on:click={handleOpenFile}>
      <File size={16} />
      {$i18n('welcome.open_file')}
    </button>

    <button class="welcome-action" on:click={handleOpenFolder}>
      <Folder size={16} />
      {$i18n('welcome.open_folder')}
    </button>

    {#if import.meta.env.DEV}
      <button
        class="welcome-action"
        on:click={() => console.log('coming soon')}
      >
        <Git size={16} />
        {$i18n('welcome.new_project_git')}
      </button>
    {/if}

    {#if import.meta.env.DEV}
      <hr class="divider" />
      <h2>{$i18n('welcome.section_walkthroughs')}</h2>

      <button
        class="welcome-action"
        on:click={() => console.log('coming soon')}
      >
        <Play size={16} />
        {$i18n('welcome.open_playground')}
      </button>

      <button
        class="welcome-action"
        on:click={() => console.log('coming soon')}
      >
        <Git size={16} />
        {$i18n('welcome.configure_git')}
      </button>
    {/if}
  </div>

  <div class="welcome-section">
    <h2>{$i18n('workspace.section_recent_workspaces')}</h2>
    {#if $recentWorkspacesStore.length === 0}
      <p class="empty">{$i18n('workspace.no_recent_workspaces')}</p>
    {:else}
      {#each $recentWorkspacesStore as entry (entry.path)}
        <div class="recent-entry">
          <button
            class="welcome-action recent-action"
            title={entry.path}
            on:click={() => openRecentWorkspace(entry)}
            aria-label={$i18n('workspace.open_recent')}
          >
            <Folder size={16} />
            <span class="recent-info">
              <span class="recent-name">{entry.name}</span>
              <span class="recent-path">{entry.path}</span>
            </span>
            <span class="recent-date">{formatDate(entry.openedAt)}</span>
          </button>
          <button
            class="recent-remove"
            title={$i18n('workspace.remove_recent')}
            aria-label={$i18n('workspace.remove_recent')}
            on:click={() => recentWorkspacesStore.remove(entry.path)}
          >
            <X size={10} />
          </button>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  #welcome {
    flex: 1;
    overflow-y: auto;
    padding: 56px 72px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px 64px;
    align-content: start;
  }

  .welcome-header {
    grid-column: 1 / -1;
    margin-bottom: 8px;
  }

  .welcome-header h1 {
    font-family: var(--font-mono);
    font-size: 32px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: 0.5px;
  }

  .welcome-header p {
    font-size: 13px;
    color: var(--text-dim);
    margin-top: 6px;
  }

  .welcome-section h2 {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-dim);
    margin-bottom: 16px;
  }

  .divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 16px 0;
  }

  .welcome-action {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    font-size: 13px;
    font-family: var(--font-ui);
    color: var(--accent2);
    cursor: pointer;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    transition: color 0.15s;
  }

  .welcome-action:hover {
    color: var(--text);
  }

  .empty {
    font-size: 12px;
    color: var(--text-dim);
    font-style: italic;
  }

  .recent-entry {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .recent-action {
    flex: 1;
    min-width: 0;
  }

  .recent-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .recent-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recent-path {
    font-size: 11px;
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recent-date {
    font-size: 11px;
    color: var(--text-dim);
    flex-shrink: 0;
    margin-left: auto;
    padding-left: 8px;
  }

  .recent-remove {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--text-dim);
    border-radius: 3px;
    opacity: 0;
    transition:
      opacity 0.15s,
      background 0.15s;
  }

  .recent-entry:hover .recent-remove {
    opacity: 1;
  }

  .recent-remove:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text);
  }
</style>
