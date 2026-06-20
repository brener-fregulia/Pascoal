<script lang="ts">
  import { tabStore } from "../stores/tabs";
  import { i18n } from "../i18n";

  const PASCAL_TEMPLATE = `program Untitled;\n\nbegin\n\nend.\n`;

  async function handleNewFile() {
    const tab = await tabStore.newTab(PASCAL_TEMPLATE);
    tabStore.activate(tab.id);
  }

  async function handleOpenFile() {
    if (!window.__TAURI__) return;
    try {
      const result = await window.__TAURI__.core.invoke('open_file') as [string, string] | null;
      if (result) {
        const [filePath, content] = result;
        const tab = await tabStore.openFile(filePath, content);
        tabStore.activate(tab.id);
      }
    } catch (e) {
      console.error("open_file failed:", e);
    }
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
      {$i18n('welcome.new_file')}
    </button>
    <button class="welcome-action" on:click={handleOpenFile}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      {$i18n('welcome.open_file')}
    </button>
    <button class="welcome-action" on:click={() => console.log("coming soon")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
      {$i18n('welcome.open_folder')}
    </button>
    <button class="welcome-action" on:click={() => console.log("coming soon")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="6" cy="18" r="2" />
        <path d="M6 8v8M8 6h7a2 2 0 0 1 2 2v2" />
      </svg>
      {$i18n('welcome.new_project_git')}
    </button>

    <hr class="divider" />
    <h2>{$i18n('welcome.section_walkthroughs')}</h2>
    <button class="welcome-action" on:click={() => console.log("coming soon")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
      {$i18n('welcome.open_playground')}
    </button>
    <button class="welcome-action" on:click={() => console.log("coming soon")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="6" cy="18" r="2" />
        <path d="M6 8v8M8 6h7a2 2 0 0 1 2 2v2" />
      </svg>
      {$i18n('welcome.configure_git')}
    </button>
  </div>

  <div class="welcome-section">
    <h2>{$i18n('welcome.section_recent')}</h2>
    <p class="empty">{$i18n('welcome.no_recent')}</p>
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

  .welcome-action:hover { color: var(--text); }

  .welcome-action svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .empty {
    font-size: 12px;
    color: var(--text-dim);
    font-style: italic;
  }
</style>
