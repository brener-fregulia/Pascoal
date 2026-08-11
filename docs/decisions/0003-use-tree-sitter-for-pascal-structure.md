# ADR-0003: Use Tree-sitter as the Pascal structural source

Status: Accepted

## Context

Pascoal syntax highlighting previously had a legacy frontend highlighting path in
addition to Tree-sitter-based analysis.

Running parallel structural/highlighting paths created conflicting marks and made
future Pascal analysis harder to evolve consistently.

The Tree-sitter implementation was introduced, moved behind language/application
boundaries, decoupled from generic editor infrastructure, and the legacy
highlighting override was removed.

## Decision

Use Tree-sitter as the structural source for Pascal highlighting and future
syntax-aware analysis built on the same language boundary.

Generic editor components consume analysis results but do not parse Pascal.

Pascal analysis belongs behind the frontend language adapter and the Rust
language/application boundary.

Do not add a parallel regex-based structural highlighting path.

## Alternatives considered

### Keep the legacy regex highlighting path

Rejected because parallel sources can disagree and duplicate language knowledge.

### Put Pascal parsing directly in CodeMirror/Svelte components

Rejected because it couples language analysis to UI structure and makes future
diagnostics, symbols, navigation, or LSP-oriented work harder to evolve.

## Consequences

- Tree-sitter is the current structural source for Pascal highlighting.
- Editor infrastructure remains language-consumer code rather than parser code.
- Future structural features should extend the Pascal analysis boundary.
- A replacement parser strategy would require a new ADR that supersedes this one.

## Related architecture

- `docs/architecture/editor-and-language.md`
- `docs/architecture/backend.md`
