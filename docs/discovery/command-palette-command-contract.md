# Command Palette Command Contract

Status: Approved by the owner (Spike [#11](https://github.com/brener-fregulia/Pascoal/issues/11)).
Implementation: pending, tracked by [#12](https://github.com/brener-fregulia/Pascoal/issues/12).

This document records the findings and the approved decision of Spike #11. It
uses three labels to keep facts apart from plans:

- **Existing** - behavior present in the repository when the Spike was approved.
- **Approved** - contract the owner accepted for the implementation.
- **Future** - work that belongs to #12 or later and does not exist yet.

Interfaces shown here are proposals. None of them exists in the code base.

## 1. Context and goal

Pascoal exposes frequent commands through the titlebar menu, keyboard shortcuts,
the Welcome screen, the Activity Bar, and the status bar. Issue #12 adds a
keyboard-first Command Palette that must reuse those commands without
duplicating their implementation.

The Spike had to choose the smallest command boundary that serves menus,
shortcuts, and the palette, and to produce bounded implementation slices.

## 2. Existing command model

**Existing.**

- `src/app/Menu.svelte` is a Svelte component, not a native menu. Each `action`
  item calls `emit(item.event, item.payload)` from `@tauri-apps/api/event` in
  `handleItem`. The event is received by frontend listeners; no `menu-*` event
  is handled in Rust. Without the Tauri runtime, menu actions do nothing.
- Handlers live with the state they act on:
  - `src/App.svelte` listens to application-level events (files, workspaces,
    Find in Files, Welcome, About, release notes, version history).
  - `src/editor/Editor.svelte` listens to editor events in
    `setupMenuListeners` and handles editor shortcuts in a `document`-level
    `handleKeydown`.
  - `src/project/FileTree.svelte` listens to `menu-cut`, `menu-copy`, and
    `menu-paste`; `src/shared/activeFocus.ts` decides whether the editor or
    the explorer handles them.
- `menu-save-file` and `menu-save-file-as` are handled in `App.svelte` by
  dispatching a synthetic `Ctrl+S` / `Ctrl+Shift+S` `KeyboardEvent`, which
  `Editor.svelte` then handles. `save()` and `saveAs()` are private to the
  editor because they read the CodeMirror `view`.
- `runActiveFile()` in `src/toolchain/runner.ts` is a module function shared by
  the Run button and `F5`.
- `activePanel` is local `$state` in `App.svelte`, bound to
  `src/app/ActivityBar.svelte`. It is not a store.
- `src/app/rightPanel.ts` exposes `rightPanelStore.toggle()`. The availability
  rule (`available || open`) is enforced only by the button in
  `src/app/Statusbar.svelte`.
- `src/app/Welcome.svelte` already reuses `menu-open-folder` and
  `menu-open-recent-workspace` through `emit`. It duplicates the new-file and
  open-file logic of `App.svelte` instead.

### Inventory

| Command | Event / id | Executor | Current triggers | Dependencies | Available when | Reuse path |
|---|---|---|---|---|---|---|
| New file | `menu-new-file` | `App.svelte` -> `tabStore.newTab` | Menu, Welcome (copy) | Tauri listener | Tauri runtime | Emit event |
| Open file | `menu-open-file` | `App.svelte` -> `invoke('open_file')` | Menu, Welcome (copy) | Tauri | Tauri runtime | Emit event |
| Open folder | `menu-open-folder` | `App.svelte` -> `explorerStore.openFolder`, then `activePanel = 'explorer'` | Menu, Welcome, empty FileTree | Tauri | Tauri runtime | Emit event |
| Open recent workspace | `menu-open-recent-workspace` (path payload) | `App.svelte` | Menu, Welcome | Tauri | A recent entry exists | Emit event |
| Save | `menu-save-file` -> synthetic `Ctrl+S` | `Editor.svelte` `save()` | `Ctrl+S`, Menu | Tauri, editor `view`, active tab | Editor mounted, active tab | Emit event |
| Save As | `menu-save-file-as` -> synthetic `Ctrl+Shift+S` | `Editor.svelte` `saveAs()` | `Ctrl+Shift+S`, Menu | Tauri, `view`, `explorerStore` folder | As Save | Emit event |
| Run | none | `runActiveFile()` | `F5` (editor), Run button | Tauri, `tabStore`, `settingsStore`, `consoleStore` | Tauri; without a tab it only shows the console | Direct call |
| Find | `menu-find` | `Editor.svelte` (`showFind`) | `Ctrl+F` (editor), Menu | `FindWidget.svelte`, CodeMirror | Editor mounted and visible | Emit event |
| Replace | `menu-replace` | `Editor.svelte` | `Ctrl+H` (editor), Menu | CodeMirror | As Find | Emit event |
| Find in Files | `menu-find-in-files` | `App.svelte` `openFindInFiles()` | `Ctrl+Shift+F` (App), Menu | `searchFocusTick` | Always; without a workspace search returns no results | Emit event |
| Toggle Explorer / Search | none | `ActivityBar.svelte` `handleItemClick` | Activity Bar click | `activePanel` in `App.svelte` | Always | App-provided context |
| Toggle right panel | none | `rightPanelStore.toggle()` | Status bar button | `rightPanelStore` | `available \|\| open` | Direct call with the same guard |
| Undo / Redo | `menu-undo` / `menu-redo` | `Editor.svelte` | CodeMirror keymap, Menu | CodeMirror `view` | Editor mounted | Not in #12 |
| Cut / Copy / Paste | `menu-cut` / `menu-copy` / `menu-paste` | `Editor.svelte` or `FileTree.svelte`, chosen by `activeFocusStore` | Menu, native shortcuts | `editorClipboard.ts`, tree selection | Depends on focus | Not in #12 |
| Toggle line comment | `menu-toggle-comment` | `Editor.svelte` | `Ctrl+/` (CodeMirror), Menu | CodeMirror | Editor mounted | Emit event |
| Zoom in / out / reset | none | `Editor.svelte` `zoomBy` / `resetZoom` (private) | `Ctrl+=`, `Ctrl+-`, `Ctrl+0`, `Ctrl`+wheel | `settingsStore` | Editor mounted | Not in #12 |
| Welcome, About, Release Notes, Version History | `menu-show-welcome`, `menu-about`, `menu-release-notes`, `menu-version-history` | `App.svelte` | Menu | App state or stores | Tauri runtime | Not in #12 |

The only existing application-level shortcut is `Ctrl+Shift+F` in
`App.svelte` `handleKeydown`. The right panel has no shortcut, as stated in
`docs/architecture/frontend.md`. Git and Playground entries exist only in
development builds (`ActivityBar.svelte`).

## 3. Alternatives considered

### A - Reuse the existing event model only

The palette emits the same `menu-*` events.

- Advantages: no duplicated execution; identical behavior to the menu; the
  pattern is already used by `Welcome.svelte`; tests can mock `emit` as
  `tests/frontend/components/Menu.test.ts` does.
- Risks: labels and events stay in a private array in `Menu.svelte`, so the
  palette would need a second untyped list; there is no availability
  metadata, so events can be emitted with no mounted listener (for example
  `menu-save-file` in the Settings view); Run, Explorer/Search, and the right
  panel have no events, and adding events only for the palette would increase
  coupling to the Tauri runtime.

### B - Typed registry that owns execution

A central module defines and executes every command.

- Advantages: one typed source of metadata; availability can be tested as
  plain functions.
- Risks: executing save, find, and editor commands centrally would require
  extracting editor internals that depend on the CodeMirror `view`, and
  turning `activePanel` into a store. That is a refactor of the editor and the
  shell, outside the scope of #12, and it would weaken the ownership rules in
  `docs/architecture/frontend.md`.

Neither alternative changes platform behavior; both are frontend-only.

## 4. Approved decision

**Approved.** Use a hybrid approach:

- a minimal typed catalog of commands with stable identifiers;
- presentation and availability metadata in the catalog;
- execution delegated to existing handlers:
  - commands that already have a `menu-*` event emit that event;
  - operations that already have a reusable API are called directly
    (`runActiveFile()`, `rightPanelStore.toggle()`);
  - operations owned by `App.svelte` (`activePanel`) are reached through a
    context provided by the App.

There is no global execution service, and editor responsibilities stay in
`Editor.svelte`.

Rationale:

- `Welcome.svelte` already reuses `menu-*` events so that side effects such as
  switching to the Explorer stay in one handler.
- Handlers remain with the component or store that owns the state, as required
  by `docs/architecture/frontend.md`. `App.svelte` only composes the palette.
- No dependency and no change to ADR-0002 are required: `emit` is a Tauri
  plugin API, not a Rust command invocation.

`Menu.svelte` keeps its own item list and handlers during #12. Making the menu
consume the catalog is a future improvement, conditional on a concrete need.

## 5. Command contract

**Approved contract, future implementation.** The shape below is illustrative.

```ts
// Proposal only - not present in the repository.
export type CommandId =
  | 'file.new'
  | 'file.open'
  | 'workspace.open'
  | 'search.findInFiles'
  | 'file.save'
  | 'file.saveAs'
  | 'edit.find'
  | 'edit.replace'
  | 'edit.toggleLineComment'
  | 'run.activeFile'
  | 'view.toggleExplorer'
  | 'view.toggleSearch'
  | 'view.toggleRightPanel'

export interface CommandContext {
  activePanel: string | null
  setActivePanel(panel: string | null): void
}

export interface Command {
  id: CommandId
  labelKey: string
  keywords?: string[]
  shortcut?: string
  isAvailable(ctx: CommandContext): boolean
  run(ctx: CommandContext): void | Promise<void>
}
```

- `id` is stable, untranslated, and unique.
- `labelKey` reuses existing translation keys where they exist (`menu.*`,
  `activity.*`, `editor.run`, `right_panel.toggle`).
- `shortcut` is display-only. Existing shortcuts stay handled where they are
  handled today.
- `run` may be synchronous or asynchronous.
- The catalog contains only commands that exist in the application. No
  placeholder commands are added to demonstrate the palette.

## 6. Contextual availability

**Approved.**

- Unavailable commands are hidden from the result list.
- Availability is evaluated again at execution time. If the context changed
  and the command is no longer available, it is not executed.
- Availability is derived from existing state:
  - commands that emit events require the Tauri runtime
    (`isTauriAvailable()` in `src/integrations/tauri/client.ts`);
  - editor commands require that the editor is mounted and visible: the active
    panel is not `settings` (in that view `App.svelte` does not render
    `EditorArea.svelte`), `tabStore` `activeView` is `editor`, and an active
    tab exists;
  - the right-panel toggle follows the status bar rule:
    `rightPanelStore.available || rightPanelStore.open`;
  - Run preserves the current `runActiveFile()` behavior, including showing
    the console when no tab is active.

## 7. Search, i18n, and ordering

**Approved.**

- Search uses the labels of the selected application locale (`en` or
  `pt-BR`) from `src/i18n/index.ts`.
- Matching ignores case and diacritics.
- No simultaneous bilingual search, no fuzzy search, and no new dependency.
- Results with an empty query follow the catalog order. Filtering keeps the
  catalog order among matching commands.
- New translation keys are limited to the palette UI (for example the input
  placeholder and the empty-result message) and must exist in both locales;
  `tests/frontend/i18n/locale-parity.test.ts` already checks parity.

## 8. Shortcuts, accessibility, and focus

**Approved.**

- The palette opens with `Ctrl+Shift+P` on Windows and Linux. `F1` is not
  added in the first version.
- The shortcut is handled at the application level in `App.svelte`, like the
  existing `Ctrl+Shift+F`.
- The CodeMirror `defaultKeymap` used by `src/editor/editor-extensions.ts` does
  not bind `Shift-Mod-p`. The behavior of the shortcut in WebView2 (Windows)
  and WebKitGTK (Linux) must be validated manually on both systems.
- Keyboard navigation: arrow keys move the selection, `Enter` executes,
  `Escape` closes. The list follows the combobox/listbox pattern with
  `aria-activedescendant`.

Focus and shortcut safety requirements:

- Editor shortcuts must not run while the palette is open. The palette handles
  the relevant key events on its own element and stops their propagation, so
  the `document` listener in `Editor.svelte` and the `window` listeners in
  other components do not receive them.
- The palette does not open while a modal is active. Modals are controlled
  both by local state in `App.svelte` (`showAbout`, `showVersionHistory`) and by
  stores (FPC missing, update available, What's New); both kinds must be
  considered.
- The previously focused element is stored when the palette opens and focus
  is restored to it when the palette closes.
- On execution, the palette closes and restores focus first, then runs the
  command, so the command can set its own focus (for example `view.focus()`
  in `Editor.svelte`, the `FindWidget.svelte` input, or the `SearchPanel.svelte`
  input).
- Execution failures are caught and logged, consistent with the existing
  handlers. A failure never leaves the palette open or focus trapped.
- Reused handlers keep their current behavior.

Each of these requirements needs focused automated tests in #12.

## 9. Risks and planned mitigations

| Risk | Evidence | Mitigation |
|---|---|---|
| `Escape` in the palette also closes the find widget and other overlays | `Editor.svelte` closes `FindWidget` on `Escape` at `document` level; `Menu.svelte`, `Statusbar.svelte`, `FileTree.svelte`, and the modals listen on `window` | Stop propagation of keys handled by the palette |
| Editor shortcuts fire while typing in the palette | `Editor.svelte` registers `handleKeydown` on `document` (`Ctrl+S`, `Ctrl+F`, `Ctrl+H`, `F5`, zoom) | Same as above; tested explicitly |
| Event emitted with no mounted listener | `EditorArea.svelte` is not rendered in the Settings view (`App.svelte`) | Availability excludes editor commands in that view |
| Editor hidden but mounted | In the Welcome view the editor stays mounted with `display: none`; `tabStore.getActive()` ignores `activeView` | Availability requires `activeView === 'editor'`; existing handler behavior is not changed |
| Palette opened over a modal | Modal state is split between `App.svelte` and stores; `Ctrl+Shift+F` already opens search behind modals | Explicit modal-blocking predicate in the App |
| Tauri runtime unavailable | `Menu.svelte` and the `App.svelte` listeners require Tauri | Event-based commands are unavailable without the runtime |
| Clipboard routing depends on focus | `activeFocusStore` selects editor or explorer | Cut, Copy, and Paste are excluded from #12 |
| Editor listeners register asynchronously | `setupMenuListeners` awaits `listen` after mount; the editor remounts when leaving Settings | Low risk; covered by availability and manual validation |
| Right-panel guard exists only in the UI | `rightPanelStore.toggle()` does not check `available` | The catalog applies the same guard as `Statusbar.svelte` |

## 10. Slices for #12

**Future.** `Menu.svelte` keeps its current handlers throughout.

### Slice 1 - Catalog and basic palette

- Typed catalog.
- Search UI.
- `Ctrl+Shift+P` shortcut.
- Keyboard navigation.
- Focus management and modal blocking.
- Commands: New File, Open File, Open Folder, Find in Files, through their
  existing events.
- Focused tests: unique ids and existing label keys, case- and
  diacritic-insensitive filtering, `Enter` emits the expected event, `Escape`
  closes and restores focus, no execution without Tauri, no opening over a
  modal.

### Slice 2 - Editor commands

- Save, Save As, Find, Replace, Toggle Line Comment, through their existing
  events.
- Availability guards and conflict prevention.
- Focused tests: hidden in Settings and without an active editor tab;
  `Escape` in the palette does not close the find widget; editor shortcuts
  typed in the palette do not run.

### Slice 3 - Run and panels

- Run through `runActiveFile()`.
- Toggle Explorer and Search through the App context.
- Toggle the right panel with the existing availability rule, preserving the
  stored visibility and width preferences of `src/app/rightPanel.ts`.
- Focused tests: right-panel toggle unavailable without space; panel toggles
  update `activePanel`; Run calls `runActiveFile()`.

Each slice ends with focused automated tests, then owner manual validation on
Windows 11 and Linux.

## 11. Non-goals and future improvements

Non-goals for #12:

- a global command execution service;
- refactoring `Menu.svelte`, editor handlers, or stores;
- fuzzy search, bilingual search, or new dependencies;
- `F1` as an additional shortcut;
- showing unavailable commands;
- recent-command history, configurable keybindings, go-to-file, or symbol
  search;
- Cut, Copy, Paste, Undo, Redo, zoom, Welcome, About, release notes, version
  history, and development-only commands.

Future improvements, subject to a concrete need and owner approval:

- `Menu.svelte` consuming labels and events from the catalog;
- removing the new-file and open-file duplication between `App.svelte` and
  `Welcome.svelte`.
