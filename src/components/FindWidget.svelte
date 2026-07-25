<script lang="ts">
  import type { EditorView } from '@codemirror/view'
  import { Decoration } from '@codemirror/view'
  import { RangeSetBuilder } from '@codemirror/state'
  import {
    SearchQuery,
    setSearchQuery,
    findNext,
    findPrevious,
    replaceNext,
    replaceAll,
  } from '@codemirror/search'
  import {
    setMatchDecorations,
    matchMark,
    selectedMatchMark,
  } from '../stores/search-highlight'
  import { i18n } from '../i18n'

  let {
    view,
    open = $bindable(false),
    focusTick = 0,
  }: { view: EditorView | null; open: boolean; focusTick?: number } = $props()

  let queryText = $state('')
  let replaceText = $state('')
  let caseSensitive = $state(false)
  let wholeWord = $state(false)
  let useRegex = $state(false)
  let showReplace = $state(false)

  let matchIndex = $state(0)
  let matchCount = $state(0)

  let inputEl = $state<HTMLInputElement | null>(null)

  $effect(() => {
    focusTick
    if (open) {
      queueMicrotask(() => inputEl?.focus())
    }
  })

  function buildQuery(): SearchQuery {
    return new SearchQuery({
      search: queryText,
      caseSensitive,
      regexp: useRegex,
      wholeWord,
      replace: replaceText,
    })
  }

  function applyQuery() {
    if (!view) return
    const query = buildQuery()
    view.dispatch({ effects: setSearchQuery.of(query) })
    updateMatches()
  }

  // Computes match count/index AND builds our own highlight decorations
  // for every match in the document, marking the current one distinctly.
  function updateMatches() {
    if (!view) return

    if (!queryText) {
      matchCount = 0
      matchIndex = 0
      view.dispatch({ effects: setMatchDecorations.of(Decoration.none) })
      return
    }

    const query = buildQuery()
    if (!query.valid) {
      matchCount = 0
      matchIndex = 0
      view.dispatch({ effects: setMatchDecorations.of(Decoration.none) })
      return
    }

    const cursor = query.getCursor(view.state)
    const selFrom = view.state.selection.main.from

    const ranges: { from: number; to: number }[] = []
    let result = cursor.next()
    while (!result.done) {
      ranges.push({ from: result.value.from, to: result.value.to })
      result = cursor.next()
    }

    let current = 0
    for (let i = 0; i < ranges.length; i++) {
      if (ranges[i].from <= selFrom && selFrom <= ranges[i].to) {
        current = i + 1
        break
      }
    }

    matchCount = ranges.length
    matchIndex = current || (ranges.length > 0 ? 1 : 0)

    const builder = new RangeSetBuilder<Decoration>()
    ranges.forEach((r, i) => {
      const isCurrent = i + 1 === matchIndex
      builder.add(r.from, r.to, isCurrent ? selectedMatchMark : matchMark)
    })

    view.dispatch({ effects: setMatchDecorations.of(builder.finish()) })
  }

  function goNext() {
    if (!view) return
    applyQuery()
    findNext(view)
    updateMatches()
  }

  function goPrev() {
    if (!view) return
    applyQuery()
    findPrevious(view)
    updateMatches()
  }

  function doReplace() {
    if (!view) return
    applyQuery()
    replaceNext(view)
    updateMatches()
  }

  function doReplaceAll() {
    if (!view) return
    applyQuery()
    replaceAll(view)
    updateMatches()
  }

  function close() {
    open = false
    if (view) {
      view.dispatch({
        effects: [
          setSearchQuery.of(new SearchQuery({ search: '' })),
          setMatchDecorations.of(Decoration.none),
        ],
      })
      view.focus()
    }
  }

  function handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) goPrev()
      else goNext()
    }
  }

  function handleReplaceKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      doReplace()
    }
  }

  function toggle(flag: 'case' | 'word' | 'regex') {
    if (flag === 'case') caseSensitive = !caseSensitive
    if (flag === 'word') wholeWord = !wholeWord
    if (flag === 'regex') useRegex = !useRegex
    applyQuery()
  }
</script>

{#if open}
  <div class="find-widget">
    <div class="find-row">
      <button
        class="expand-btn"
        title={$i18n('find.toggle_replace')}
        onclick={() => (showReplace = !showReplace)}
      >
        {showReplace ? '▾' : '▸'}
      </button>

      <input
        bind:this={inputEl}
        bind:value={queryText}
        oninput={applyQuery}
        onkeydown={handleInputKeydown}
        class="find-input"
        placeholder={$i18n('find.find_placeholder')}
      />

      <button
        class="opt-btn"
        class:active={caseSensitive}
        title={$i18n('find.match_case')}
        onclick={() => toggle('case')}>Aa</button
      >
      <button
        class="opt-btn"
        class:active={wholeWord}
        title={$i18n('find.whole_word')}
        onclick={() => toggle('word')}>ab</button
      >
      <button
        class="opt-btn"
        class:active={useRegex}
        title={$i18n('find.use_regex')}
        onclick={() => toggle('regex')}>.*</button
      >

      <span class="match-info">
        {#if queryText}
          {matchCount === 0
            ? $i18n('find.no_results')
            : `${matchIndex} ${$i18n('find.of')} ${matchCount}`}
        {/if}
      </span>

      <button
        class="nav-btn"
        title={$i18n('find.previous')}
        onclick={goPrev}
        disabled={matchCount === 0}>↑</button
      >
      <button
        class="nav-btn"
        title={$i18n('find.next')}
        onclick={goNext}
        disabled={matchCount === 0}>↓</button
      >
      <button
        class="nav-btn close-btn"
        title={$i18n('find.close')}
        onclick={close}>×</button
      >
    </div>

    {#if showReplace}
      <div class="find-row replace-row">
        <span class="row-spacer"></span>
        <input
          bind:value={replaceText}
          onkeydown={handleReplaceKeydown}
          class="find-input"
          placeholder={$i18n('find.replace_placeholder')}
        />
        <button
          class="replace-btn"
          title={$i18n('find.replace')}
          onclick={doReplace}
        >
          {$i18n('find.replace')}
        </button>
        <button
          class="replace-btn"
          title={$i18n('find.replace_all')}
          onclick={doReplaceAll}
        >
          {$i18n('find.replace_all')}
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .find-widget {
    position: absolute;
    top: 8px;
    right: 20px;
    z-index: 20;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .find-row {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .find-input {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 4px 6px;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--text);
    outline: none;
    width: 180px;
    min-width: 0;
  }

  .find-input:focus {
    border-color: var(--accent);
  }

  .expand-btn {
    background: transparent;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 10px;
    width: 16px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .expand-btn:hover {
    color: var(--text);
  }

  .opt-btn {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 3px;
    color: var(--text-dim);
    font-family: var(--font-ui);
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    width: 22px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      color 0.1s,
      background 0.1s,
      border-color 0.1s;
  }

  .opt-btn:hover {
    color: var(--text);
    background: rgba(128, 128, 128, 0.1);
  }

  .opt-btn.active {
    color: var(--accent2);
    border-color: var(--accent2);
    background: rgba(168, 218, 220, 0.12);
  }

  .match-info {
    font-family: var(--font-ui);
    font-size: 11px;
    color: var(--text-dim);
    white-space: nowrap;
    min-width: 52px;
    padding: 0 4px;
    text-align: center;
    flex-shrink: 0;
  }

  .nav-btn {
    background: transparent;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 13px;
    width: 22px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    transition:
      color 0.1s,
      background 0.1s;
  }

  .nav-btn:hover:not(:disabled) {
    color: var(--text);
    background: rgba(128, 128, 128, 0.1);
  }

  .nav-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .close-btn {
    font-size: 15px;
  }

  .close-btn:hover {
    color: #fff;
    background: var(--error);
  }

  .row-spacer {
    width: 16px;
    flex-shrink: 0;
  }

  .replace-btn {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-dim);
    font-family: var(--font-ui);
    font-size: 11px;
    padding: 4px 8px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition:
      color 0.1s,
      border-color 0.1s;
  }

  .replace-btn:hover {
    color: var(--text);
    border-color: var(--accent2);
  }
</style>
