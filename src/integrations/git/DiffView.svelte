<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { MergeView } from '@codemirror/merge'
  import {
    pascalDiffExtensions,
    themeCompartment,
  } from '../../editor/editor-extensions'
  import { buildPascoalTheme } from '../../editor/editor-theme'
  import { pascalTreeSitterHighlight } from '../../language/pascal/pascal-treesitter'
  import { themeStore } from '../../shared/theme'

  let { original, modified }: { original: string; modified: string } = $props()

  let containerEl: HTMLDivElement
  let mergeView: MergeView | null = null

  onMount(() => {
    mergeView = new MergeView({
      a: {
        doc: original,
        extensions: pascalDiffExtensions(pascalTreeSitterHighlight),
      },
      b: {
        doc: modified,
        extensions: pascalDiffExtensions(pascalTreeSitterHighlight),
      },
      parent: containerEl,
    })
  })

  onDestroy(() => {
    mergeView?.destroy()
  })

  $effect(() => {
    const _theme = $themeStore.current
    if (!mergeView) return
    Promise.resolve().then(() => {
      mergeView?.a.dispatch({
        effects: themeCompartment.reconfigure(buildPascoalTheme()),
      })
      mergeView?.b.dispatch({
        effects: themeCompartment.reconfigure(buildPascoalTheme()),
      })
    })
  })
</script>

<div id="diff-view" bind:this={containerEl}></div>

<style>
  #diff-view {
    max-height: 400px;
    overflow: auto;
    border: 1px solid var(--border);
    border-radius: 4px;
  }

  #diff-view :global(.cm-editor) {
    font-family: var(--font-mono);
    font-size: 12px;
  }
</style>
