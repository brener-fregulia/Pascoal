<script lang="ts">
  import { onMount } from 'svelte'
  import { ask } from '@tauri-apps/plugin-dialog'
  import { gitStore, type GitFileStatus } from './gitStore'
  import { explorerStore } from '../../project/explorerStore'
  import { diffTabStore } from '../../editor/diffTabs'
  import { settingsStore } from '../../settings/settingsStore'
  import { i18n } from '../../i18n'
  import { isTauriAvailable, invoke } from '../tauri/client'
  import StageAllPromptModal from './StageAllPromptModal.svelte'

  let remoteInput = $state('')
  let showStagePrompt = $state(false)
  let remoteUrl = $derived($gitStore.remoteUrl)

  let identityName = $state('')
  let identityEmail = $state('')
  let identityGlobal = $state(true)

  let isRepo = $derived($gitStore.isRepo)
  let branch = $derived($gitStore.branch)
  let staged = $derived($gitStore.staged)
  let unstaged = $derived($gitStore.unstaged)
  let loading = $derived($gitStore.loading)
  let error = $derived($gitStore.error)
  let commitMessage = $derived($gitStore.commitMessage)
  let needsIdentity = $derived($gitStore.needsIdentity)
  let notice = $derived($gitStore.notice)
  let ahead = $derived($gitStore.ahead)
  let behind = $derived($gitStore.behind)

  let folder = $derived($explorerStore.folder)
  let canCommit = $derived(
    (staged.length > 0 || unstaged.length > 0) &&
      commitMessage.trim().length > 0,
  )
  let canSaveIdentity = $derived(
    identityName.trim().length > 0 && identityEmail.trim().length > 0,
  )

  onMount(() => {
    gitStore.refresh()
  })

  let lastFolderPath: string | null = null
  $effect(() => {
    const path = folder?.path ?? null
    if (path !== lastFolderPath) {
      lastFolderPath = path
      diffTabStore.reset()
    }
  })

  function statusLabel(status: GitFileStatus['status']): string {
    switch (status) {
      case 'modified':
        return 'M'
      case 'added':
        return 'A'
      case 'deleted':
        return 'D'
      case 'renamed':
        return 'R'
      case 'untracked':
        return 'U'
      case 'unmerged':
        return '!'
      default:
        return '?'
    }
  }

  async function showAt(revision: string, path: string): Promise<string> {
    try {
      return await invoke<string>('git_show_file', {
        folderPath: folder!.path,
        revision,
        filePath: path,
      })
    } catch {
      return ''
    }
  }

  async function loadDiffContent(
    path: string,
    isStaged: boolean,
  ): Promise<{ original: string; modified: string }> {
    if (isStaged) {
      const [original, modified] = await Promise.all([
        showAt('HEAD', path),
        showAt('', path),
      ])
      return { original, modified }
    }

    const original = await showAt('', path)
    let modified = ''
    try {
      modified = await invoke<string>('read_file', {
        path: `${folder!.path}/${path}`,
      })
    } catch {
      modified = ''
    }
    return { original, modified }
  }

  async function openDiff(path: string, isStaged: boolean) {
    if (!folder || !isTauriAvailable()) return
    const { original, modified } = await loadDiffContent(path, isStaged)
    diffTabStore.open({
      filePath: path,
      fileName: path.split(/[\\/]/).pop() ?? path,
      staged: isStaged,
      original,
      modified,
    })
  }

  async function handleDiscard(path: string, isUntracked: boolean) {
    const key = isUntracked
      ? 'git.discard_untracked_confirm'
      : 'git.discard_confirm'
    const message = $i18n(key, { name: path })
    const confirmed = isTauriAvailable()
      ? await ask(message, { title: 'Pascoal', kind: 'warning' })
      : window.confirm(message)
    if (!confirmed) return
    await gitStore.discard(path, isUntracked)
  }

  async function handleSetRemote() {
    if (!remoteInput.trim()) return
    const ok = await gitStore.setRemote(remoteInput.trim())
    if (ok) remoteInput = ''
  }

  async function handleCommit() {
    if (staged.length === 0 && unstaged.length > 0) {
      const mode = $settingsStore.gitAutoStageOnCommit
      if (mode === 'never') return
      if (mode === 'ask') {
        showStagePrompt = true
        return
      }
      // mode === 'always'
      await gitStore.stageAll()
      await gitStore.commit()
      return
    }
    await gitStore.commit()
  }

  async function handleStagePromptChoice(
    choice: 'yes' | 'always' | 'never' | 'cancel',
  ) {
    showStagePrompt = false
    if (choice === 'cancel') return
    if (choice === 'always' || choice === 'never') {
      settingsStore.updateSetting('gitAutoStageOnCommit', choice)
    }
    if (choice === 'never') return
    await gitStore.stageAll()
    await gitStore.commit()
  }
  async function handleSaveIdentity() {
    if (!canSaveIdentity) return
    const ok = await gitStore.configureIdentity(
      identityName.trim(),
      identityEmail.trim(),
      identityGlobal,
    )
    if (ok) {
      identityName = ''
      identityEmail = ''
    }
  }
</script>

<div class="git-panel">
  {#if showStagePrompt}
    <StageAllPromptModal onChoice={handleStagePromptChoice} />
  {/if}

  {#if notice}
    <div class="notice notice-{notice.type}">{notice.message}</div>
  {/if}

  {#if !folder}
    <p class="status-msg">{$i18n('git.no_folder')}</p>
  {:else if loading && !isRepo}
    <p class="status-msg">{$i18n('explorer.loading')}</p>
  {:else if !isRepo}
    <div class="not-repo">
      <p class="status-msg">{$i18n('git.not_a_repo')}</p>
      <button class="init-btn" onclick={() => gitStore.initRepo()}>
        {$i18n('git.init_repo')}
      </button>
    </div>
  {:else}
    <div class="git-header">
      <span class="branch-name" title={branch ?? ''}>
        {branch ?? $i18n('git.no_branch')}
      </span>
      {#if behind > 0}
        <span class="ab-badge ab-badge-behind" title={$i18n('git.behind_hint')}
          >↓{behind}</span
        >
      {/if}
      {#if ahead > 0}
        <span class="ab-badge ab-badge-ahead" title={$i18n('git.ahead_hint')}
          >↑{ahead}</span
        >
      {/if}
      <button
        class="icon-action"
        title={$i18n('git.pull')}
        disabled={!remoteUrl || loading}
        onclick={() => gitStore.pull()}
      >
        ↓
      </button>
      <button
        class="icon-action"
        title={$i18n('git.push')}
        disabled={!remoteUrl || loading}
        onclick={() => gitStore.push()}
      >
        ↑
      </button>
      <button
        class="icon-action"
        title={$i18n('git.sync')}
        disabled={!remoteUrl || loading}
        onclick={() => gitStore.sync()}
      >
        ⇅
      </button>
      <button
        class="icon-action"
        title={$i18n('explorer.refresh')}
        onclick={() => gitStore.refresh()}
      >
        ↻
      </button>
    </div>

    {#if remoteUrl}
      <div class="remote-row" title={remoteUrl}>
        <span class="remote-dot ok"></span>
        <span class="remote-text">{remoteUrl}</span>
      </div>
    {:else}
      <div class="remote-row remote-missing">
        <div class="remote-header">
          <span class="remote-dot"></span>
          <span class="remote-text">{$i18n('git.remote_missing')}</span>
        </div>
        <div class="remote-actions">
          <input
            class="remote-input"
            placeholder={$i18n('git.remote_placeholder')}
            bind:value={remoteInput}
            onkeydown={(e) => e.key === 'Enter' && handleSetRemote()}
          />
          <button class="remote-link-btn" onclick={handleSetRemote}>
            {$i18n('git.remote_link')}
          </button>
        </div>
      </div>
    {/if}

    {#if error}
      <p class="error-msg">{error}</p>
    {/if}

    <div class="commit-box">
      <textarea
        class="commit-input"
        placeholder={$i18n('git.commit_placeholder')}
        bind:value={commitMessage}
        oninput={(e) =>
          gitStore.setCommitMessage((e.target as HTMLTextAreaElement).value)}
        rows="2"></textarea>

      {#if needsIdentity}
        <div class="identity-form">
          <p class="identity-hint">{$i18n('git.identity_needed')}</p>
          <input
            class="identity-input"
            placeholder={$i18n('git.identity_name')}
            bind:value={identityName}
          />
          <input
            class="identity-input"
            placeholder={$i18n('git.identity_email')}
            bind:value={identityEmail}
          />
          <label class="identity-global">
            <input type="checkbox" bind:checked={identityGlobal} />
            {$i18n('git.identity_global')}
          </label>
          <button
            class="commit-btn"
            disabled={!canSaveIdentity}
            onclick={handleSaveIdentity}
          >
            {$i18n('git.identity_save_commit')}
          </button>
        </div>
      {:else}
        <button class="commit-btn" disabled={!canCommit} onclick={handleCommit}>
          {$i18n('git.commit')}
        </button>
      {/if}
    </div>

    <div class="sections">
      <div class="section">
        <div class="section-header">
          <span>{$i18n('git.staged_changes')} ({staged.length})</span>
          {#if staged.length > 0}
            <button
              class="mini-btn"
              title={$i18n('git.unstage_all')}
              onclick={() => gitStore.unstageAll()}>−</button
            >
          {/if}
        </div>
        {#each staged as file (file.path)}
          <div class="file-entry">
            <button class="file-row" onclick={() => openDiff(file.path, true)}>
              <span class="status-badge status-{file.status}"
                >{statusLabel(file.status)}</span
              >
              <span class="file-path">{file.path}</span>
            </button>
            <button
              class="mini-btn"
              title={$i18n('git.unstage')}
              onclick={() => gitStore.unstage(file.path)}>−</button
            >
          </div>
        {/each}
      </div>

      <div class="section">
        <div class="section-header">
          <span>{$i18n('git.changes')} ({unstaged.length})</span>
          {#if unstaged.length > 0}
            <button
              class="mini-btn"
              title={$i18n('git.stage_all')}
              onclick={() => gitStore.stageAll()}>+</button
            >
          {/if}
        </div>
        {#each unstaged as file (file.path)}
          <div class="file-entry">
            <button class="file-row" onclick={() => openDiff(file.path, false)}>
              <span class="status-badge status-{file.status}"
                >{statusLabel(file.status)}</span
              >
              <span class="file-path">{file.path}</span>
            </button>
            <button
              class="mini-btn"
              title={$i18n('git.discard')}
              onclick={() =>
                handleDiscard(file.path, file.status === 'untracked')}>↺</button
            >
            <button
              class="mini-btn"
              title={$i18n('git.stage')}
              onclick={() => gitStore.stage(file.path)}>+</button
            >
          </div>
        {/each}
      </div>

      {#if staged.length === 0 && unstaged.length === 0}
        <p class="status-msg clean">{$i18n('git.clean')}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .git-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--sidebar);
    border-right: 1px solid var(--border);
    min-width: 0;
    position: relative;
  }

  .notice {
    padding: 6px 12px;
    font-size: 11px;
    font-family: var(--font-ui);
    flex-shrink: 0;
  }

  .notice-success {
    background: rgba(76, 175, 130, 0.15);
    color: var(--success);
    border-bottom: 1px solid rgba(76, 175, 130, 0.3);
  }

  .notice-error {
    background: rgba(233, 69, 96, 0.15);
    color: var(--error);
    border-bottom: 1px solid rgba(233, 69, 96, 0.3);
  }

  .status-msg {
    font-size: 12px;
    color: var(--text-dim);
    padding: 12px;
    font-style: italic;
  }

  .status-msg.clean {
    text-align: center;
    padding: 24px 12px;
  }

  .error-msg {
    font-size: 11px;
    color: var(--error);
    padding: 6px 12px;
    background: rgba(233, 69, 96, 0.1);
    border-bottom: 1px solid var(--border);
  }

  .not-repo {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px 16px;
    text-align: center;
  }

  .init-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 6px 14px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .init-btn:hover {
    opacity: 0.85;
  }

  .git-header {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .branch-name {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--accent2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .icon-action {
    background: transparent;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 13px;
    padding: 2px 4px;
    border-radius: 3px;
    transition:
      color 0.15s,
      background 0.15s;
  }

  .icon-action:hover {
    color: var(--text);
    background: rgba(128, 128, 128, 0.1);
  }

  .commit-box {
    padding: 8px;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  .commit-input {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 6px 8px;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--text);
    resize: vertical;
    outline: none;
  }

  .commit-input:focus {
    border-color: var(--accent);
  }

  .commit-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 6px 10px;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .commit-btn:hover:not(:disabled) {
    opacity: 0.85;
  }

  .commit-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .identity-form {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
  }

  .identity-hint {
    font-size: 11px;
    color: var(--text-dim);
    line-height: 1.4;
  }

  .identity-input {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 5px 8px;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--text);
    outline: none;
  }

  .identity-input:focus {
    border-color: var(--accent);
  }

  .identity-global {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-dim);
    cursor: pointer;
  }

  .sections {
    flex: 1;
    overflow-y: auto;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .mini-btn {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 3px;
    color: var(--text-dim);
    font-size: 12px;
    font-weight: 700;
    width: 18px;
    height: 18px;
    line-height: 1;
    cursor: pointer;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      color 0.1s,
      background 0.1s;
  }

  .mini-btn:hover {
    color: var(--text);
    background: var(--border);
  }

  .file-entry {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 12px 0 8px;
  }

  .file-row {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 4px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
  }

  .file-row:hover {
    background: rgba(128, 128, 128, 0.08);
  }

  .status-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    width: 14px;
    text-align: center;
    flex-shrink: 0;
  }

  .status-modified {
    color: var(--accent2);
  }
  .status-added {
    color: var(--success);
  }
  .status-deleted {
    color: var(--error);
  }
  .status-renamed {
    color: var(--accent2);
  }
  .status-untracked {
    color: var(--text-dim);
  }
  .status-unmerged {
    color: var(--error);
  }

  .file-path {
    font-size: 12px;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remote-row {
    padding: 6px 12px;
    font-size: 11px;
    border-bottom: 1px solid var(--border);
  }

  .remote-row:not(.remote-missing) {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .remote-missing {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .remote-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .remote-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--error);
    flex-shrink: 0;
  }

  .remote-dot.ok {
    background: var(--success);
  }

  .remote-text {
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remote-missing .remote-text {
    white-space: normal;
  }

  .remote-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .remote-input {
    flex: 1 1 120px;
    min-width: 0;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 11px;
    color: var(--text);
  }

  .remote-link-btn {
    flex-shrink: 0;
    padding: 4px 10px;
    border: 1px solid var(--accent2);
    border-radius: 4px;
    background: transparent;
    color: var(--accent2);
    font-size: 11px;
    cursor: pointer;
  }

  .ab-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    flex-shrink: 0;
    padding: 0 2px;
  }

  .ab-badge-behind {
    color: var(--accent2);
  }

  .ab-badge-ahead {
    color: var(--accent);
  }
</style>
