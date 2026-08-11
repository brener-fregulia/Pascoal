# Backend Architecture

## Scope

The desktop backend lives under `src-tauri/src/` and owns operating-system,
filesystem, process, Git, toolchain, settings persistence, and Pascal analysis
responsibilities that should not be implemented in the web frontend.

## Layers

```text
src-tauri/src/
├── lib.rs
├── commands/
├── application/
├── infrastructure/
├── language/
├── project/
├── toolchain/
└── state/
```

## `lib.rs` contract

`lib.rs` is the backend composition root.

It owns:

- Tauri application setup;
- plugin registration;
- shared managed state registration;
- Tauri command registration.

It should not become the implementation location for individual use cases or
OS-level behavior.

## `commands/` contract

Tauri commands are IPC adapters.

They translate the frontend command boundary into backend calls and should remain
thin.

A command may delegate:

- to an `application/` use case when coordination or domain workflow exists;
- directly to a focused backend/infrastructure operation when the command is only
  a thin exposure of that operation.

Commands should not become a second implementation layer for filesystem,
process, Git, language, or toolchain logic.

## `application/` contract

`application/` owns use-case coordination.

Current use cases include document analysis, file/workspace management, settings,
toolchain checks/install, and program execution.

Application code may coordinate domain and infrastructure modules, but should not
contain presentation concerns.

## Domain contracts

`language/`, `project/`, and `toolchain/` own backend behavior specific to those
domains.

Examples:

- `language/pascal/` owns Pascal analysis implementation;
- `project/` owns project/workspace and explorer-related backend behavior;
- `toolchain/` owns compiler, installer, and process execution responsibilities.

Keep domain rules in their domain rather than in Tauri command adapters.

## `infrastructure/` contract

`infrastructure/` owns OS-facing primitives and external process interaction.

Current responsibilities include:

- environment detection;
- filesystem primitives;
- Git CLI execution;
- platform behavior;
- settings persistence.

Infrastructure should not own frontend/UI behavior.

## `state/` contract

`state/` contains shared backend runtime state that must survive across command
calls, such as process state.

Do not introduce global/shared state when local ownership is sufficient.

## Dependency direction

The intended direction is:

```text
Tauri IPC
   ↓
commands
   ↓
application / focused backend operation
   ↓
domain and infrastructure
```

Do not make lower layers depend on Svelte/frontend concerns.

Cross-layer shortcuts require an explicit reason and must not duplicate an
existing contract.
