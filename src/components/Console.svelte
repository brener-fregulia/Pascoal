<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { consoleStore, clearConsoleSignal } from '../stores/console'
  import { i18n } from '../i18n'
  import PanelHeader from './PanelHeader.svelte'
  import IconButton from './IconButton.svelte'
  import X from '../icons/X.svelte'

  let programEl: HTMLDivElement
  let term: any = null
  let fitAddon: any = null
  let isRunning = false
  let unlistenBuild: (() => void) | null = null
  let unlistenStarted: (() => void) | null = null
  let unlistenProgramOut: (() => void) | null = null
  let unlistenProgramErr: (() => void) | null = null
  let unlistenExit: (() => void) | null = null

  let buildStatus = $derived($consoleStore.buildStatus)
  let buildOutput = $derived($consoleStore.buildOutput)
  let copied = $state(false)

  $effect(() => {
    if ($clearConsoleSignal > 0) term?.reset()
  })

  onMount(() => {
    let resizeObserver: ResizeObserver

    async function setup() {
      const { Terminal } = await import('@xterm/xterm')
      const { FitAddon } = await import('@xterm/addon-fit')

      term = new Terminal({
        fontFamily: '"JetBrains Mono", "Cascadia Code", monospace',
        fontSize: 13,
        lineHeight: 1.5,
        theme: getTheme(),
        cursorBlink: true,
        convertEol: true,
      })

      fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.open(programEl)
      fitAddon.fit()

      term.onData((data: string) => {
        if (window.__TAURI__ && isRunning) {
          if (data === '\r') {
            term.write('\r\n')
          } else if (data === '\x7f') {
            term.write('\b \b')
          } else {
            term.write(data)
          }
          window.__TAURI__.core.invoke('send_input', {
            data: data === '\r' ? '\n' : data,
          })
        }
      })

      if (window.__TAURI__) {
        const { listen } = await import('@tauri-apps/api/event')

        unlistenBuild = await listen<string>(
          'console-build-output',
          (event) => {
            consoleStore.appendBuildOutput(event.payload)
          },
        )

        unlistenStarted = await listen('console-started', () => {
          consoleStore.setBuildStatus('success')
          consoleStore.setRunning(true)
          isRunning = true
        })

        unlistenProgramOut = await listen<string>(
          'console-program-output',
          (event) => term?.write(event.payload),
        )

        unlistenProgramErr = await listen<string>(
          'console-program-error',
          (event) => term?.write(`\x1b[31m${event.payload}\x1b[0m`),
        )

        unlistenExit = await listen<number>('console-exit', (event) => {
          const code = event.payload
          if ($consoleStore.buildStatus === 'compiling') {
            consoleStore.setBuildStatus('error')
          } else {
            const msg =
              code === 0
                ? `\r\n\x1b[32m${$i18n('console.exit_success')}\x1b[0m\r\n`
                : `\r\n\x1b[31m${$i18n('console.exit_failure', { code })}\x1b[0m\r\n`
            term?.write(msg)
          }
          consoleStore.setRunning(false)
          isRunning = false
        })
      }

      resizeObserver = new ResizeObserver(() => fitAddon?.fit())
      resizeObserver.observe(programEl)

      window.dispatchEvent(new CustomEvent('console-ready'))
    }

    setup()

    return () => {
      resizeObserver?.disconnect()
    }
  })

  onDestroy(() => {
    unlistenBuild?.()
    unlistenStarted?.()
    unlistenProgramOut?.()
    unlistenProgramErr?.()
    unlistenExit?.()
    term?.dispose()
  })

  function getTheme() {
    const style = getComputedStyle(document.documentElement)
    const get = (v: string) => style.getPropertyValue(v).trim()
    return {
      background: get('--bg') || '#0D0D0D',
      foreground: get('--text') || '#F0F0F0',
      cursor: get('--accent') || '#E94560',
      black: '#000000',
      red: get('--error') || '#E94560',
      green: get('--success') || '#4CAF82',
      cyan: get('--accent2') || '#A8DADC',
      white: get('--text') || '#F0F0F0',
      brightBlack: get('--text-dim') || '#7A7A9A',
      brightWhite: get('--text') || '#F0F0F0',
    }
  }

  async function copyProgramOutput() {
    const text = term?.getSelection()
    if (text) {
      await navigator.clipboard.writeText(text)
    } else {
      const all = term?.buffer.active
      if (!all) return
      const lines: string[] = []
      for (let i = 0; i < all.length; i++) {
        lines.push(all.getLine(i)?.translateToString(true) ?? '')
      }
      await navigator.clipboard.writeText(lines.join('\n').trimEnd())
    }
    copied = true
    setTimeout(() => (copied = false), 2000)
  }

  const statusLabels = $derived({
    idle: $i18n('console.status_idle'),
    compiling: $i18n('console.status_compiling'),
    success: $i18n('console.status_success'),
    error: $i18n('console.status_error'),
  })
</script>

<div id="console-panel">
  <PanelHeader title={$i18n('console.title')}>
    <IconButton
      variant="inline"
      label={$i18n('console.clear')}
      title={$i18n('console.clear')}
      on:click={() => term?.reset()}
    >
      {$i18n('console.clear')}
    </IconButton>
    <IconButton
      variant="inline"
      label={$i18n('console.title')}
      title="Close"
      on:click={() => consoleStore.hide()}
    >
      <X size={10} />
    </IconButton>
  </PanelHeader>

  <section class="console-build" class:error={buildStatus === 'error'}>
    <div class="zone-label">
      <span>{$i18n('console.build')}</span>
      <span class="status status-{buildStatus}"
        >{statusLabels[buildStatus]}</span
      >
    </div>
    {#if buildOutput}
      <pre class="build-output">{buildOutput}</pre>
    {/if}
  </section>

  <section class="console-program">
    <div class="zone-label">
      <span>{$i18n('console.program')}</span>
      <IconButton
        variant="inline"
        label={$i18n('console.copy')}
        title={$i18n('console.copy')}
        on:click={copyProgramOutput}
      >
        {copied ? $i18n('console.copied') : $i18n('console.copy')}
      </IconButton>
    </div>
    <div id="program-output" bind:this={programEl}></div>
  </section>
</div>

<style>
  #console-panel {
    display: flex;
    flex-direction: column;
    background: var(--bg);
    border-left: 1px solid var(--border);
    height: 100%;
    overflow: hidden;
  }

  .zone-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-dim);
    background: var(--panel);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .status {
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
  }

  .status-compiling {
    color: var(--accent2);
  }
  .status-success {
    color: var(--success);
  }
  .status-error {
    color: var(--error);
  }
  .status-idle {
    color: var(--text-dim);
  }

  .console-build {
    flex-shrink: 0;
    max-height: 40%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .build-output {
    margin: 0;
    padding: 8px 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-dim);
    white-space: pre-wrap;
    word-break: break-word;
    overflow-y: auto;
  }

  .console-build.error .build-output {
    color: var(--error);
  }

  .console-program {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }

  #program-output {
    flex: 1;
    overflow: hidden;
    padding: 8px;
    user-select: text;
  }

  #program-output :global(.xterm) {
    height: 100%;
  }
  #program-output :global(.xterm-viewport) {
    border-radius: 0;
  }
</style>
