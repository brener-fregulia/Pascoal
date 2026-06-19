<script lang="ts">
  import { themeStore } from "../stores/theme";
  import IconButton from "./IconButton.svelte";
  import Folder from "../icons/Folder.svelte";
  import Search from "../icons/Search.svelte";
  import Git from "../icons/Git.svelte";
  import Play from "../icons/Play.svelte";
  import Sun from "../icons/Sun.svelte";
  import Settings from "../icons/Settings.svelte";

  let active = "explorer";

  const items = [
    { id: "explorer", label: "Explorer", icon: Folder },
    { id: "search", label: "Search", icon: Search },
    { id: "git", label: "Git", icon: Git },
    { id: "playground", label: "Playground", icon: Play },
  ];
</script>

<nav id="activity-bar">
  {#each items as item}
    <IconButton
      label={item.label}
      active={active === item.id}
      on:click={() => (active = item.id)}
    >
      <svelte:component this={item.icon} size={20} />
    </IconButton>
  {/each}

  <div class="spacer"></div>

  <IconButton label="Toggle theme" on:click={() => themeStore.cycle()}>
    <Sun size={20} />
  </IconButton>

  <IconButton label="Settings">
    <Settings size={20} />
  </IconButton>
</nav>

<style>
  #activity-bar {
    background: var(--sidebar);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    gap: 2px;
  }

  .spacer {
    flex: 1;
  }
</style>
