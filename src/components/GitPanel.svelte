<script lang="ts">
  import { onMount } from 'svelte'
  import { gitStore, type GitFileStatus } from '../stores/gitStore'
  import { explorerStore } from '../stores/explorerStore'
  import { i18n } from '../i18n'

  let expandedKey = $state<string | null>(null)
  let diffText = $state<string>('')
  let diffLoading = $state(false)

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
  let folder = $derived($explorerStore.folder)
  let canCommit = $derived(staged.length > 0 && commitMessage.trim().length > 0)
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
      expandedKey = null
      gitStore.refresh()
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

  async function toggleDiff(path: string, isStaged: boolean) {
    const key = `${isStaged ? 'staged' : 'unstaged'}:${path}`
    if (expandedKey === key) {
      expandedKey = null
      return
    }

    expandedKey = key
    diffText = ''

    if (!folder || !window.__TAURI__) return
    diffLoading = true
    try {
      diffText = (await window.__TAURI__.core.invoke('git_diff', {
        folderPath: folder.path,
        filePath: path,
        staged: isStaged,
      })) as string
    } catch (e) {
      diffText = String(e)
    } finally {
      diffLoading = false
    }
  }

  function diffLineClass(line: string): string {
    if (line.startsWith('+++') || line.startsWith('---')) return 'diff-meta'
    if (line.startsWith('@@')) return 'diff-hunk'
    if (line.startsWith('+')) return 'diff-add'
    if (line.startsWith('-')) return 'diff-remove'
    return 'diff-context'
  }

  async function handleCommit() {
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
      <button
        class="icon-action"
        title={$i18n('explorer.refresh')}
        onclick={() => gitStore.refresh()}
      >
        ↻
      </button>
    </div>

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
            <button
              class="file-row"
              onclick={() => toggleDiff(file.path, true)}
            >
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
          {#if expandedKey === `staged:${file.path}`}
            <div class="diff-box">
              {#if diffLoading}
                <p class="status-msg">{$i18n('explorer.loading')}</p>
              {:else}
                <pre
                  class="diff-content">{#each diffText.split('\n') as line}<span
                      class={diffLineClass(line)}
                      >{line}
</span>{/each}</pre>
              {/if}
            </div>
          {/if}
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
            <button
              class="file-row"
              onclick={() => toggleDiff(file.path, false)}
            >
              <span class="status-badge status-{file.status}"
                >{statusLabel(file.status)}</span
              >
              <span class="file-path">{file.path}</span>
            </button>
            <button
              class="mini-btn"
              title={$i18n('git.stage')}
              onclick={() => gitStore.stage(file.path)}>+</button
            >
          </div>
          {#if expandedKey === `unstaged:${file.path}`}
            <div class="diff-box">
              {#if diffLoading}
                <p class="status-msg">{$i18n('explorer.loading')}</p>
              {:else if file.status === 'untracked'}
                <p class="status-msg">{$i18n('git.untracked_no_diff')}</p>
              {:else}
                <pre
                  class="diff-content">{#each diffText.split('\n') as line}<span
                      class={diffLineClass(line)}
                      >{line}
</span>{/each}</pre>
              {/if}
            </div>
          {/if}
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

  .diff-box {
    padding: 4px 8px 8px 24px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .diff-content {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 240px;
    overflow-y: auto;
  }

  .diff-add {
    color: var(--success);
  }
  .diff-remove {
    color: var(--error);
  }
  .diff-hunk {
    color: var(--accent2);
  }
  .diff-meta {
    color: var(--text-dim);
  }
  .diff-context {
    color: var(--text-dim);
  }
</style>
