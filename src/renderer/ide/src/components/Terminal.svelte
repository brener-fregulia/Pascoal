<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { terminalStore, clearTerminalSignal } from "../stores/terminal";
  import X from "../icons/X.svelte";

  let terminalEl: HTMLDivElement;
  let term: any = null;
  let fitAddon: any = null;
  let unlistenOutput: (() => void) | null = null;
  let unlistenExit: (() => void) | null = null;

  // Clear xterm when signal fires
  $effect(() => {
    if ($clearTerminalSignal > 0) term?.clear();
  });

  onMount(() => {
    let resizeObserver: ResizeObserver;

    async function setup() {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");

      term = new Terminal({
        fontFamily: '"JetBrains Mono", "Cascadia Code", monospace',
        fontSize: 13,
        lineHeight: 1.5,
        theme: getTheme(),
        cursorBlink: true,
        convertEol: true,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalEl);
      fitAddon.fit();

      term.onData((data: string) => {
        if (window.__TAURI__ && $terminalStore.running) {
          // Manual echo — pipes don't echo input automatically
          if (data === "\r") {
            term.write("\r\n"); // Enter becomes newline
          } else if (data === "\x7f") {
            term.write("\b \b"); // Backspace
          } else {
            term.write(data); // Regular character
          }
          window.__TAURI__.core.invoke("send_input", {
            data: data === "\r" ? "\n" : data,
          });
        }
      });

      if (window.__TAURI__) {
        const { listen } = await import("@tauri-apps/api/event");

        unlistenOutput = await listen<string>("terminal-output", (event) => {
          term?.write(event.payload);
        });

        unlistenExit = await listen<number>("terminal-exit", (event) => {
          const code = event.payload;
          const msg =
            code === 0
              ? "\r\n\x1b[32mProcess finished with exit code 0\x1b[0m\r\n"
              : `\r\n\x1b[31mProcess finished with exit code ${code}\x1b[0m\r\n`;
          term?.write(msg);
          terminalStore.setRunning(false);
        });
      }

      resizeObserver = new ResizeObserver(() => fitAddon?.fit());
      resizeObserver.observe(terminalEl);

      window.dispatchEvent(new CustomEvent("terminal-ready"));
    }

    setup();

    return () => {
      resizeObserver?.disconnect();
    };
  });

  onDestroy(() => {
    unlistenOutput?.();
    unlistenExit?.();
    term?.dispose();
  });

  function getTheme() {
    const style = getComputedStyle(document.documentElement);
    const get = (v: string) => style.getPropertyValue(v).trim();
    return {
      background: get("--bg") || "#0D0D0D",
      foreground: get("--text") || "#F0F0F0",
      cursor: get("--accent") || "#E94560",
      black: "#000000",
      red: get("--error") || "#E94560",
      green: get("--success") || "#4CAF82",
      cyan: get("--accent2") || "#A8DADC",
      white: get("--text") || "#F0F0F0",
      brightBlack: get("--text-dim") || "#7A7A9A",
      brightWhite: get("--text") || "#F0F0F0",
    };
  }
</script>

<div id="terminal-panel">
  <div class="terminal-header">
    <span class="terminal-title">Terminal</span>
    <div class="terminal-actions">
      <button class="t-btn" on:click={() => term?.clear()} title="Clear">
        Clear
      </button>
      <button
        class="t-btn icon"
        on:click={() => terminalStore.hide()}
        title="Close"
      >
        <X size={10} />
      </button>
    </div>
  </div>
  <div id="xterm-container" bind:this={terminalEl}></div>
</div>

<style>
  #terminal-panel {
    display: flex;
    flex-direction: column;
    background: var(--bg);
    border-top: 1px solid var(--border);
    height: 100%;
    overflow: hidden;
  }

  .terminal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    height: 32px;
    background: var(--panel);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .terminal-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-dim);
  }

  .terminal-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .t-btn {
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-size: 11px;
    font-family: var(--font-ui);
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 3px;
    transition:
      color 0.15s,
      background 0.15s;
  }

  .t-btn:hover {
    color: var(--text);
    background: rgba(255, 255, 255, 0.06);
  }

  .t-btn.icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
  }

  #xterm-container {
    flex: 1;
    overflow: hidden;
    padding: 8px;
  }

  #xterm-container :global(.xterm) {
    height: 100%;
  }

  #xterm-container :global(.xterm-viewport) {
    border-radius: 0;
  }
</style>
