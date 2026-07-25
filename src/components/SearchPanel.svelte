<script lang="ts">
  import { searchStore, pendingJumpLine } from '../stores/searchStore'
  import { explorerStore } from '../stores/explorerStore'
  import { tabStore } from '../stores/tabs'
  import { i18n } from '../i18n'
  import File from '../icons/File.svelte'

  let queryInput = ''
  let debounceTimer: ReturnType<typeof setTimeout>

  $: folder = $explorerStore.folder
  $: results = $searchStore.results
  $: loading = $searchStore.loading
  $: caseSensitive = $searchStore.caseSensitive

  $: grouped = results.reduce(
    (acc, r) => {
      if (!acc[r.filePath])
        acc[r.filePath] = {
          fileName: r.fileName,
          matches: [] as typeof results,
        }
      acc[r.filePath].matches.push(r)
      return acc
    },
    {} as Record<string, { fileName: string; matches: typeof results }>,
  )

  function handleInput() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      searchStore.search(queryInput)
    }, 250)
  }

  function handleToggleCase() {
    searchStore.toggleCaseSensitive()
    searchStore.search(queryInput)
  }

  async function openMatch(filePath: string, lineNumber: number) {
    if (!window.__TAURI__) return
    try {
      const content = (await window.__TAURI__.core.invoke('read_file', {
        path: filePath,
      })) as string
      const tab = await tabStore.openFile(filePath, content)
      tabStore.activate(tab.id)
      pendingJumpLine.set(lineNumber)
    } catch (e) {
      console.error('read_file failed:', e)
    }
  }
</script>

<div class="search-panel">
  <div class="search-header">
    <input
      type="text"
      class="search-input"
      placeholder={$i18n('search.placeholder')}
      bind:value={queryInput}
      on:input={handleInput}
    />
    <button
      class="case-toggle"
      class:active={caseSensitive}
      title={$i18n('search.case_sensitive')}
      on:click={handleToggleCase}
    >
      Aa
    </button>
  </div>

  {#if !folder}
    <p class="status-msg">{$i18n('search.no_folder')}</p>
  {:else if loading}
    <p class="status-msg">{$i18n('explorer.loading')}</p>
  {:else if queryInput.trim() && results.length === 0}
    <p class="status-msg">{$i18n('search.no_results')}</p>
  {:else if results.length > 0}
    <div class="results-count">
      {$i18n('search.results_count', { count: results.length })}
    </div>
    <ul class="results-list">
      {#each Object.entries(grouped) as [filePath, group] (filePath)}
        <li class="result-group">
          <div class="result-file">
            <File size={12} />
            <span>{group.fileName}</span>
            <span class="match-count">{group.matches.length}</span>
          </div>
          {#each group.matches as match}
            <button
              class="result-match"
              on:click={() => openMatch(filePath, match.lineNumber)}
            >
              <span class="line-number">{match.lineNumber}</span>
              <span class="line-text">{match.lineText.trim()}</span>
            </button>
          {/each}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .search-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--sidebar);
    border-right: 1px solid var(--border);
    min-width: 0;
  }

  .search-header {
    display: flex;
    align-items: stretch;
    gap: 4px;
    padding: 6px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .search-input {
    flex: 1;
    min-width: 0;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 5px 6px;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--text);
    outline: none;
  }

  .search-input:focus {
    border-color: var(--accent);
  }

  .case-toggle {
    flex-shrink: 0;
    width: 26px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-dim);
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      color 0.15s,
      border-color 0.15s;
  }

  .case-toggle:hover {
    color: var(--text);
  }

  .case-toggle.active {
    color: var(--accent2);
    border-color: var(--accent2);
  }

  .status-msg {
    font-size: 12px;
    color: var(--text-dim);
    padding: 12px;
    font-style: italic;
  }

  .results-count {
    font-size: 11px;
    color: var(--text-dim);
    padding: 6px 12px;
    border-bottom: 1px solid var(--border);
  }

  .results-list {
    list-style: none;
    overflow-y: auto;
    flex: 1;
  }

  .result-group {
    border-bottom: 1px solid var(--border);
  }

  .result-file {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-dim);
  }

  .result-file span:first-of-type {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .match-count {
    background: var(--panel);
    border-radius: 8px;
    padding: 1px 6px;
    font-size: 10px;
  }

  .result-match {
    display: flex;
    align-items: baseline;
    gap: 8px;
    width: 100%;
    padding: 3px 12px 3px 26px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
  }

  .result-match:hover {
    background: rgba(128, 128, 128, 0.08);
  }

  .line-number {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    flex-shrink: 0;
    min-width: 20px;
  }

  .line-text {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
