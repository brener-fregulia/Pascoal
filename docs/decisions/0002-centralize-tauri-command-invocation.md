# ADR-0002: Centralize frontend Tauri command invocation

Status: Accepted

## Context

Frontend code previously invoked Tauri commands from multiple call sites.

As the application grew, direct invocation spread command transport details across
components, stores, editor code, project code, toolchain code, and integrations.

The repository introduced a dedicated Tauri client and migrated existing command
call sites to it.

## Decision

Use `src/integrations/tauri/client.ts` as the explicit frontend boundary for Rust
Tauri command invocation.

Frontend code should call Rust commands through this client instead of introducing
new direct command-invocation paths.

Direct Tauri plugin APIs remain acceptable when a feature specifically needs a
plugin API rather than a Rust command.

## Alternatives considered

### Keep direct `invoke` calls at each call site

Rejected because it duplicates transport concerns and makes command usage harder
to evolve and audit.

### Wrap each domain independently

Rejected as the default because it would recreate multiple transport boundaries.
Domain modules may still expose higher-level operations while using the shared
Tauri client underneath.

## Consequences

- Rust command transport remains centralized.
- Domains remain responsible for their own higher-level behavior.
- New command call sites should extend the existing client contract.
- Tauri plugin APIs are not forced through the Rust-command wrapper.

## Related architecture

- `docs/architecture/frontend.md`
- `docs/architecture/integrations.md`
- `docs/architecture/backend.md`
