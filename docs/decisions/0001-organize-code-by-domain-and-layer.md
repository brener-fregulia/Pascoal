# ADR-0001: Organize code by domain and layer

Status: Accepted

## Context

Pascoal evolved from a flatter structure where unrelated responsibilities were
close together. As the project grew, this made ownership less explicit and
increased coupling between UI, editor, language, project, toolchain, integration,
and backend concerns.

The repository was reorganized into explicit frontend domains and backend layers.

## Decision

Keep responsibilities grouped by domain on the frontend and by explicit
application/domain/infrastructure boundaries on the Rust backend.

Frontend responsibilities belong under focused areas such as `app/`, `editor/`,
`language/`, `project/`, `toolchain/`, `settings/`, and `integrations/`.

Backend responsibilities should preserve the separation between Tauri command
adapters, application use cases, domain behavior, infrastructure, and shared
runtime state.

Composition does not imply ownership. A parent component may render a child
without absorbing the child's growing responsibility.

## Alternatives considered

### Keep a flatter structure

Rejected because ownership becomes less clear as features grow and unrelated
responsibilities accumulate in large modules or components.

### Split only by file type

Rejected because grouping by technical type does not express feature/domain
ownership well enough for a growing IDE.

## Consequences

- New code should fit an existing responsibility before creating another module.
- Cross-domain shortcuts should be avoided when an established boundary exists.
- Large Svelte components should be split when child responsibilities become
  independently meaningful.
- Refactors may move code without changing observable behavior when they clarify
  ownership.

## Related architecture

- `docs/architecture/frontend.md`
- `docs/architecture/backend.md`
- `docs/architecture/editor-and-language.md`
- `docs/architecture/integrations.md`
