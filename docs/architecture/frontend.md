# Frontend Architecture

## Scope

The frontend lives under `src/` and uses Svelte 5, TypeScript, Vite, and
CodeMirror.

Its responsibilities are presentation, interactive UI state, editor state, and
coordination with backend capabilities through explicit integration boundaries.

## Domain boundaries

```text
src/
├── app/              application shell and top-level UI
├── editor/           editor, tabs, CodeMirror, editor views
├── language/pascal/  Pascal-specific frontend language integration
├── project/          workspace, explorer, and search
├── settings/         settings UI and frontend settings state
├── toolchain/        run/compile UI and console state
├── integrations/     external/runtime integration boundaries
├── shared/           reusable cross-domain UI/state
├── i18n/             translations and release-note localization
└── icons/            SVG Svelte components
```

A domain should own its behavior instead of placing unrelated responsibilities in
the nearest parent component.

## Svelte component contract

`.svelte` files are UI components or views.

A component may own:

- its rendering;
- local interaction state;
- behavior specific to that component;
- composition of smaller child components.

A component should not absorb another component's growing responsibility merely
because it renders that component.

Composition does not imply ownership.

For example, `Titlebar.svelte` renders `Menu.svelte`, but the contracts are
separate:

- `Titlebar.svelte` owns titlebar layout, drag regions, platform-specific window
  controls, and composition of the titlebar;
- `Menu.svelte` owns menu definitions, open/close state, menu-item interaction,
  recent-workspace menu entries, and dispatch/link behavior.

This separation keeps menu growth from turning the titlebar into the owner of menu
behavior.

Apply the same rule when another child responsibility starts growing inside a
parent component.

## State contract

Reusable or cross-component state belongs in focused TypeScript stores/modules
rather than being duplicated across components.

Current examples include:

- `editor/tabs.ts`;
- `project/explorerStore.ts`;
- `project/searchStore.ts`;
- `settings/settingsStore.ts`;
- `integrations/git/gitStore.ts`;
- `integrations/updater/updateStore.ts`;
- `toolchain/console.ts`.

Component-local state should stay local when no other component needs to own or
coordinate it.

## Shell contract

`App.svelte` is the application composition root for the frontend.

It composes the titlebar, activity bar, editor/settings area, status bar, and
application-level modals. It also wires application-level events that cross
domain boundaries.

Domain behavior should remain in its domain store, component, or integration
module instead of accumulating in `App.svelte`.

## Shared contract

`src/shared/` is for UI or state genuinely reused across domains.

Do not move code into `shared/` only to make imports shorter. Domain-specific code
should remain with its owning domain.

## Boundary rule

Frontend code that needs Rust/Tauri commands should use
`src/integrations/tauri/client.ts` rather than introducing another IPC access
path.

See `integrations.md` for external/runtime integration contracts.
