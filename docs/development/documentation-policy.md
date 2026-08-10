# Documentation Policy

## Purpose

This document defines where Pascoal information belongs and when documentation
should be updated.

The goal is to keep one primary source for each kind of information, avoid
duplicated maintenance, and document only confirmed behavior.

General agent rules are defined in `AGENTS.md`.
Development sequence is defined in `docs/development/workflow.md`.
Specification and work decomposition are defined in `docs/development/sdd.md`.

## Principles

- Document current, verified behavior.
- Use the narrowest appropriate source of truth.
- Link to detail instead of copying it.
- Keep public documentation concise and technical documentation maintainable.
- Preserve established terminology across source, documentation, and translations.
- Do not leave required project context only in conversation history.

## Sources of truth

| Source | Primary responsibility |
|---|---|
| Repository implementation | Current executable behavior |
| `README.md` | Public project overview and entry point |
| `docs/readme/` | Localized public README content |
| `CHANGELOG.md` | Versioned record of completed changes |
| In-application release notes | Concise localized release summary |
| `docs/development/` | Development, SDD, testing, documentation, and release procedures |
| `docs/architecture/` | Current technical architecture and boundaries |
| `docs/decisions/` | Significant architectural decisions and reasoning |
| `docs/features/` | Detailed behavior needing dedicated maintenance guidance |
| `docs/roadmap/` | Strategic direction not yet materialized as actionable work |
| GitHub Issues | Approved specifications and actionable work |
| GitHub Projects | Operational workflow state and progress |
| GitHub Milestones | Release scope and progress |

The repository is the permanent source of technical project truth. GitHub is the
operational source of truth for planned and active work.

Do not use the README as a detailed roadmap, backlog, architecture reference, or
implementation history.

## README

The README should present Pascoal to users and contributors. Keep it focused on:

- project purpose and major features;
- screenshots or short demonstrations;
- downloads, installation, and requirements;
- development setup summary and primary test commands;
- supported platforms and technologies;
- links to detailed documentation;
- project status and license.

Move detailed architecture, maintenance procedures, release checklists, and
long-term planning to their dedicated sources.

Update the README when public capabilities, installation, requirements,
supported platforms, primary commands, or project positioning change.

## Translated READMEs

Translated READMEs are semantic translations of the public README, not independent
documents.

When authoritative README content changes:

1. update and validate the English source;
2. update only affected sections in supported translations;
3. preserve links, commands, product names, and code blocks;
4. verify translations do not advertise unsupported behavior.

Minor technical documentation changes do not require translated README updates.

## Technical documentation

Use `docs/architecture/` for current layers, responsibilities, boundaries, data
flows, and platform integration.

Use `docs/features/` when feature behavior or maintenance guidance is too detailed
for the README or architecture overview.

Technical documents should:

- reference actual paths and abstractions;
- avoid copying large code blocks;
- distinguish platform-independent and platform-specific behavior;
- state known limitations;
- link to relevant ADRs;
- describe validated current behavior, not planned implementation;
- avoid duplicating Work Package execution history.

Create dedicated technical documentation only when it remains useful after the
individual implementation task is complete.

## Architectural decisions

Create an ADR under `docs/decisions/` when a decision has meaningful alternatives,
changes a durable boundary, affects future implementation choices, introduces an
important constraint, or is likely to be questioned again.

Do not create ADRs for routine implementation details or reversible refactors.

ADR format, status, naming, supersession, and agent requirements are defined in
`docs/decisions/README.md`.

Accepted ADRs are historical records. Supersede them instead of rewriting their
original reasoning.

## Changelog and release notes

`CHANGELOG.md` records completed release-relevant changes. Entries should describe
meaningful user or maintainer impact, avoid raw commit wording and unfinished work,
and use only categories containing entries.

Not every internal refactor needs a changelog entry. Include one when it has
relevant behavior, compatibility, maintenance, performance, reliability,
packaging, or architectural impact.

In-application release notes are shorter, localized, user-facing summaries. They
must describe only behavior present in the release and use the same version key in
every supported locale.

The GitHub Release body is derived from the matching changelog section.

## SDD artifacts

The SDD model is defined in `docs/development/sdd.md`.

Use GitHub Issues for approved operational specifications and Work Package
outcomes. Do not duplicate those specifications into repository documentation.

Use repository documentation for information that remains relevant beyond an
individual work item, especially current architecture, architectural decisions,
development procedures, and feature maintenance behavior.

Conversation history is supplemental context, not durable project documentation.

## Roadmap and task tracking

Use `docs/roadmap/` for strategic direction and areas not yet ready for actionable
specification.

Once work has approved scope, use GitHub:

- Milestones for Releases;
- Epic issues only when multiple related Features need shared context;
- Feature issues for approved functional specifications;
- Fix and Refactor issues for independently tracked work;
- Work Package sub-issues for focused execution units;
- Projects for workflow state and progress.

Do not duplicate the complete GitHub hierarchy in roadmap documents.
Small, low-risk changes may use Reduced SDD.

## Documentation changes by task type

| Change | Typical documentation |
|---|---|
| Internal implementation with no durable effect | Work Package outcome when useful |
| User-visible feature | GitHub Feature spec; README/feature docs when needed; changelog |
| Bug fix | Fix/Work Package tracking when needed; changelog when release-relevant |
| Reversible refactor | Work Package outcome when useful |
| Architecture change | Architecture docs and ADR when a durable decision is involved |
| New architectural decision | ADR and affected architecture docs |
| New or changed command | Relevant development or README reference |
| Installation or requirement change | README and translated READMEs |
| i18n key change | Locale files; docs only when public wording changes |
| SDD process change | `docs/development/sdd.md` |
| Development workflow change | `docs/development/workflow.md` |
| Release preparation | Changelog, localized release notes, version files |
| Testing or CI process change | `docs/development/testing.md` or related docs |

## Validation

For documentation changes, verify as applicable:

- referenced files, paths, commands, versions, and platform claims are accurate;
- Markdown, JSON, placeholders, and links are valid;
- architecture documentation matches the implementation;
- relevant ADRs were consulted;
- planned behavior is not presented as current;
- GitHub information is not unnecessarily duplicated;
- session-only knowledge was not left as required context;
- conflicting instructions were not introduced.

Code test suites are normally unnecessary for documentation-only changes unless
generated documentation or configuration is involved.

## Commit boundaries

Commit messages should remain concise and follow Conventional Commits.

Examples:

```text
feat(git): add repository status service
refactor(explorer): split file tree node responsibilities
docs(architecture): document git integration boundaries
docs(decisions): record tree-sitter ownership decision
```

A short body of one or two sentences may be added when useful.

Detailed implementation and validation context belongs in the Work Package.
Durable technical reasoning belongs in architecture documentation or ADRs.
