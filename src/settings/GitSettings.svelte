<script lang="ts">
  import { onMount } from 'svelte'
  import { i18n } from '../i18n'
  import { explorerStore } from '../project/explorerStore'
  import { settingsStore } from './settingsStore'
  import { isTauriAvailable, invoke } from '../integrations/tauri/client'

  type Scope = 'user' | 'workspace'
  type Identity = { name: string | null; email: string | null }

  let scope = $state<Scope>('user')
  let name = $state('')
  let email = $state('')
  let loading = $state(true)
  let error = $state<string | null>(null)

  let folder = $derived($explorerStore.folder)

  async function load(target: Scope) {
    if (!isTauriAvailable()) {
      loading = false
      return
    }
    loading = true
    error = null
    try {
      const identity =
        target === 'user'
          ? await invoke<Identity>('git_check_global_identity')
          : await invoke<Identity>('git_check_local_identity', {
              folderPath: folder!.path,
            })
      name = identity.name ?? ''
      email = identity.email ?? ''
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      loading = false
    }
  }

  async function save() {
    if (!isTauriAvailable()) return
    error = null
    try {
      if (scope === 'user') {
        await invoke('git_set_global_identity', { name, email })
      } else if (folder) {
        await invoke('git_set_identity', {
          folderPath: folder.path,
          name,
          email,
          global: false,
        })
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  function selectScope(target: Scope) {
    scope = target
    load(target)
  }

  onMount(() => {
    load('user')
  })
</script>

<section>
  <h3>{$i18n('settings.category_git')}</h3>

  {#if folder}
    <div class="scope-tabs">
      <button
        class="scope-tab"
        class:active={scope === 'user'}
        onclick={() => selectScope('user')}
      >
        {$i18n('settings.git_scope_user')}
      </button>
      <button
        class="scope-tab"
        class:active={scope === 'workspace'}
        onclick={() => selectScope('workspace')}
      >
        {folder.name}
      </button>
    </div>
  {/if}

  <div class="field">
    <label for="git-name">{$i18n('settings.git_name')}</label>
    <input
      id="git-name"
      class="field-input"
      type="text"
      bind:value={name}
      disabled={loading}
      onblur={save}
    />
  </div>

  <div class="field">
    <label for="git-email">{$i18n('settings.git_email')}</label>
    <input
      id="git-email"
      class="field-input"
      type="email"
      bind:value={email}
      disabled={loading}
      onblur={save}
    />
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if !folder}
    <p class="hint">{$i18n('settings.git_workspace_hint')}</p>
  {/if}

  <div class="field">
    <label for="git-auto-stage">{$i18n('git.auto_stage_label')}</label>
    <select
      id="git-auto-stage"
      class="field-input"
      value={$settingsStore.gitAutoStageOnCommit}
      onchange={(e) =>
        settingsStore.updateSetting(
          'gitAutoStageOnCommit',
          (e.target as HTMLSelectElement).value as 'ask' | 'always' | 'never',
        )}
    >
      <option value="ask">{$i18n('git.auto_stage_ask')}</option>
      <option value="always">{$i18n('git.auto_stage_always')}</option>
      <option value="never">{$i18n('git.auto_stage_never')}</option>
    </select>
  </div>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 360px;
  }

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .scope-tabs {
    display: flex;
    gap: 4px;
    padding: 3px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 6px;
    width: fit-content;
  }

  .scope-tab {
    padding: 5px 12px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-dim);
    font-family: var(--font-ui);
    font-size: 12px;
    cursor: pointer;
  }

  .scope-tab:hover {
    color: var(--text);
  }

  .scope-tab.active {
    background: var(--bg);
    color: var(--text);
    font-weight: 600;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  label {
    font-size: 12px;
    color: var(--text-dim);
    font-family: var(--font-ui);
  }

  .field-input {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 7px 10px;
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--text);
    outline: none;
  }

  .field-input:focus {
    border-color: var(--accent);
  }

  .field-input:disabled {
    opacity: 0.5;
  }

  .error {
    font-size: 12px;
    color: var(--error);
    margin: 0;
  }

  .hint {
    font-size: 12px;
    color: var(--text-dim);
    margin: 0;
  }
</style>
