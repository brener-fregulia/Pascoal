# Editor and Pascal Language Architecture

## Scope

The editor is split between generic editor responsibilities under `src/editor/`
and Pascal-specific language behavior under `src/language/pascal/` and
`src-tauri/src/language/pascal/`.

The editor should not become the owner of Pascal parsing logic.

## Editor contracts

### `Editor.svelte`

Owns the live CodeMirror `EditorView` and editor-facing interaction lifecycle.

Its responsibilities include:

- mounting and destroying CodeMirror;
- applying current tab state;
- dispatching editor transactions;
- editor keyboard/menu actions;
- save/save-as interaction;
- editor-local find/replace UI;
- triggering run actions.

It should delegate persistent tab state, language extensions, project state,
toolchain behavior, and integrations to their owning modules.

### `tabs.ts`

Owns file-tab state and each tab's `EditorState`.

It owns open file tabs, the active tab/view, dirty state, path changes, and the
CodeMirror state preserved per tab.

### `editor-extensions.ts`

Composes generic CodeMirror extensions.

Pascal-specific behavior is supplied through explicit language extensions instead
of being implemented directly in the editor component.

### Editor views/components

`EditorArea.svelte` composes the side panel and main editor area.

`MainContent.svelte` composes editor tabs, Welcome, diff views, and the console.

`FindWidget.svelte` owns the editor find/replace widget.

These Svelte files are components/views; rendering a child does not transfer the
child feature's internal responsibility to its parent.

## Pascal frontend contract

`src/language/pascal/pascal-treesitter.ts` is the frontend adapter between
CodeMirror and backend Pascal analysis.

It:

- requests `highlight_pascal` through the Tauri client;
- converts returned highlight spans into CodeMirror decorations;
- debounces document analysis;
- ignores stale analysis responses.

It does not parse Pascal itself.

## Pascal backend contract

The current path is:

```text
CodeMirror document
    ↓
src/language/pascal/pascal-treesitter.ts
    ↓
Tauri: highlight_pascal
    ↓
commands/language_commands.rs
    ↓
application/analyze_document.rs
    ↓
language/pascal/
    ↓
Tree-sitter highlighting
```

`commands/language_commands.rs` is the IPC adapter.

`application/analyze_document.rs` is the document-analysis use-case boundary.

`language/pascal/` owns the actual Pascal structural analysis.

Future diagnostics, symbols, or other document analysis should extend this
language/application boundary rather than putting parsing logic into Svelte or
CodeMirror components.

## Contract rule

Editor infrastructure may consume language results, but language analysis remains
independent from UI component structure.

Tree-sitter is the current structural source for Pascal highlighting; do not add a
parallel regex highlighting path.
