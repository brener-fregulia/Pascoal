# Documentation Policy

## Purpose

This document defines where Pascoal information belongs and when documentation should be updated.

The goal is to keep one primary source for each kind of information, avoid duplicated maintenance across languages, and document only confirmed behavior.

General agent rules are defined in `AGENTS.md`. The development sequence is defined in `docs/development/workflow.md`.

## Principles

- Document current, verified behavior.
- Use the narrowest appropriate source of truth.
- Link to detailed information instead of copying it.
- Update documentation when behavior, commands, requirements, or maintenance procedures change.
- Do not update unrelated documents merely because a release is being prepared.
- Keep public documentation concise and technical documentation maintainable.
- Preserve established terminology across source, documentation, and translations.

## Sources of truth

| Source | Primary responsibility |
|---|---|
| `README.md` | Public project overview and entry point |
| `docs/readme/` | Localized versions of public README content |
| `CHANGELOG.md` | Versioned record of completed changes |
| In-application release notes | Concise localized summary for a specific release |
| `docs/development/` | Development, testing, documentation, and release procedures |
| `docs/architecture/` | Current technical structure and boundaries |
| `docs/decisions/` | Significant decisions, alternatives, and consequences |
| `docs/features/` | Detailed behavior of features needing dedicated maintenance guidance |
| `docs/roadmap/` | Strategic direction and major themes |
| GitHub Issues | Actionable units of work |
| GitHub Projects | Status, priority, area, target, and progress |

Do not use the README as the detailed roadmap or backlog.

## README

The README should present Pascoal to users and contributors. It may include:

- project purpose;
- current major features;
- screenshots or short demonstrations;
- downloads and installation;
- requirements;
- development setup summary;
- primary test commands;
- supported platforms;
- technologies;
- links to detailed documentation;
- project status and license.

Move detailed architecture, maintenance procedures, release checklists, and long-term planning to their dedicated sources.

A code change requires a README update only when it changes public capabilities, installation, requirements, supported platforms, primary commands, or important project positioning.

## Translated READMEs

Translated READMEs should remain semantic translations of the public README, not independent documents.

When authoritative README content changes:

1. update and validate the English source;
2. identify the affected sections;
3. update only those sections in supported translations;
4. preserve links, commands, product names, and code blocks;
5. verify that translated documents do not advertise unsupported behavior.

Minor technical documentation changes do not require translated README updates.

## Technical documentation

Use `docs/architecture/` for how the system works now, including major layers, boundaries, data flows, and platform integration.

Use `docs/features/` when a feature has behavior or maintenance requirements too detailed for the README or general architecture overview.

Technical documents should:

- reference actual paths and abstractions;
- avoid copying large code blocks that will become stale;
- distinguish platform-independent and platform-specific behavior;
- state known limitations;
- link to decisions when architecture depends on them.

Do not create one document per source directory by default.

## Architectural decisions

Create an ADR under `docs/decisions/` when a decision:

- has meaningful alternatives;
- changes or establishes a durable boundary;
- affects future implementation choices;
- has non-obvious tradeoffs;
- is likely to be questioned later.

Examples include parser strategy, AST ownership, LSP adoption, IPC boundaries, persistence design, or Playground architecture.

Do not create ADRs for routine implementation details, reversible refactors, or preferences already established by nearby code.

An ADR should record:

- status;
- context;
- decision;
- alternatives considered;
- consequences.

ADRs describe the decision at the time it was made. Supersede them rather than rewriting history when the decision changes.

## Changelog

`CHANGELOG.md` records completed changes intended for releases.

Entries should:

- follow the existing format;
- describe meaningful user or maintainer impact;
- avoid raw commit wording;
- avoid unfinished work and roadmap promises;
- use only categories containing entries;
- keep implementation detail only when maintainers need it.

Not every internal refactor needs a changelog entry. Include it when it affects behavior, compatibility, maintenance, performance, reliability, packaging, or architecture in a relevant way.

## Release notes

In-application release notes are concise and localized. They should summarize the most relevant user-facing changes for one version.

They must:

- use the same version key in every supported locale;
- remain shorter than the changelog;
- preserve meaning across languages;
- omit internal implementation detail;
- describe only behavior present in the release.

The GitHub Release body is derived from the matching changelog section and should not require a separately maintained copy.

## Roadmap and task tracking

Use `docs/roadmap/` for strategic direction, major themes, and areas not yet ready for actionable issues.

Use GitHub Issues and Projects for work that has scope, status, priority, ownership, acceptance criteria, or a target.

Do not duplicate the complete issue backlog in a roadmap document.

A small immediate change does not require an issue when it can be completed and reviewed without losing useful planning context.

## Documentation changes by task type

| Change | Typical documentation |
|---|---|
| Internal implementation with no observable effect | Usually none |
| User-visible feature | README or feature docs when discoverability requires it; changelog for release |
| Bug fix | Changelog when release-relevant; feature docs only if documented behavior changed |
| Architecture change | Architecture document and possibly ADR |
| New or changed command | Relevant development or README command reference |
| Installation or requirement change | README and translated READMEs |
| i18n key change | Application locale files; documentation only when public wording changes |
| Release preparation | Changelog, localized release notes, version files |
| Testing or CI process change | `docs/development/testing.md` or related development documentation |

## Validation

For documentation changes, verify as applicable:

- referenced files and paths exist;
- commands match current scripts;
- versions and platform claims are accurate;
- Markdown fences and tables are balanced;
- JSON locale files parse;
- placeholders and interpolation match across locales;
- links are correct;
- duplicated or conflicting instructions were not introduced.

Code test suites are normally unnecessary for documentation-only changes unless generated documentation or configuration is involved.

## Commit boundaries

Keep independently reviewable documentation stages separate when practical.

Examples:

```text
docs(readme): update settings overview
docs(architecture): document toolchain flow
i18n(settings): add toolchain status translations
docs(changelog): add version 2026.4.0 changes
docs(release): add version 2026.4.0 release notes
```

Combine directly related changes when splitting them would not improve review, traceability, or reversal.
