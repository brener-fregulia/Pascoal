# Integration Architecture

## Scope

Integrations isolate runtime or external-system concerns from ordinary frontend
domains.

Frontend integrations currently live under:

```text
src/integrations/
├── tauri/
├── git/
└── updater/
```

## Tauri IPC contract

`src/integrations/tauri/client.ts` is the frontend's explicit IPC boundary.

Frontend code invoking Rust commands should use its `invoke()` wrapper instead of
creating additional direct command bridges.

This keeps command transport centralized and makes command names, payloads, return
types, and runtime availability easier to evolve.

Direct use of Tauri plugin APIs is appropriate when a feature specifically needs
that plugin API, but Rust command invocation itself should remain centralized.

## Git integration contract

Git spans frontend and backend responsibilities.

Frontend:

```text
src/integrations/git/
├── GitPanel.svelte
├── DiffView.svelte
├── StageAllPromptModal.svelte
└── gitStore.ts
```

- Svelte files own Git UI/components;
- `gitStore.ts` owns Git frontend state and operations;
- the store follows the currently open workspace from `explorerStore`;
- backend Git operations are invoked through the Tauri client.

Backend:

```text
commands/git_commands.rs
        ↓
infrastructure/git.rs
        ↓
Git CLI
```

Tauri commands are thin adapters. Git CLI execution and parsing belong in
`infrastructure/git.rs`, not in Svelte components.

The Git panel is implemented but is not yet enabled as a production activity.
`ActivityBar.svelte` currently exposes Git only in development builds, while
`EditorArea.svelte` already knows how to render `GitPanel.svelte`.

Do not describe the Git panel as a production feature until that gate is removed
and validated.

## Updater contract

`src/integrations/updater/updateStore.ts` owns frontend update state and update
workflow coordination.

Updater UI remains in the component that presents the workflow, while the store
owns reusable update state/operations.

## Cross-domain integration rule

An integration may depend on domain state when the external capability needs
context from that domain.

Example: Git depends on the currently opened workspace.

The owning domain must not duplicate the integration's external-system logic in
order to consume it.

## Component rule

Integration `.svelte` files remain components.

A parent component may render an integration component without becoming the owner
of its internal behavior, just as `Titlebar.svelte` renders `Menu.svelte` without
owning menu behavior.

When integration UI grows, split focused components/stores instead of expanding
the nearest shell component.
