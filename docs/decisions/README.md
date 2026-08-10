# Architectural Decision Records

## Purpose

This directory contains Architectural Decision Records (ADRs) for significant
technical decisions in Pascoal.

ADRs preserve reasoning that constrains future development so maintainers and
agents do not repeatedly reopen settled questions without new requirements or
evidence.

## When to create an ADR

Create an ADR when a decision:

- establishes or changes a durable architectural boundary;
- has meaningful alternatives or non-obvious tradeoffs;
- affects future implementation choices;
- introduces an important long-term constraint;
- adopts or rejects a significant technology or architectural strategy;
- is likely to be questioned again.

Typical subjects include parser strategy, AST ownership, LSP adoption, editor
integration, Tauri IPC boundaries, persistence, Git architecture, project and
workspace architecture, and Playground architecture.

Do not create ADRs for routine implementation details, small reversible
refactors, formatting, naming, or one-off bug fixes.

## Naming

Use a sequential identifier and a descriptive filename:

```text
0001-use-example-architecture.md
0002-keep-example-responsibility-in-rust.md
```

Numbers are never reused.

## Status

Every ADR uses one of these statuses:

- `Proposed`
- `Accepted`
- `Superseded`
- `Deprecated`
- `Rejected`

`Accepted` decisions are current constraints.

When a decision changes, create a new ADR and mark the previous one
`Superseded`. Do not rewrite accepted history.

## ADR structure

Use this structure:

```markdown
# ADR-NNNN: Decision title

Status: Proposed

## Context

## Decision

## Alternatives considered

## Consequences

## Related architecture

## Related work
```

Omit optional sections only when they contain no useful information.

## Relationship with architecture documentation

`docs/architecture/` describes the current system.

`docs/decisions/` preserves why significant architectural constraints exist.

An ADR may remain after the architecture it describes has changed because it is a
historical record.

## Relationship with SDD

A Feature, Fix, Refactor, or Work Package may reveal that an architectural
decision is required.

When implementation encounters a decision with meaningful alternatives or durable
architectural impact:

1. inspect existing ADRs;
2. stop the affected architectural choice;
3. document the question and alternatives;
4. obtain owner approval;
5. create or update the ADR;
6. continue implementation using the accepted decision.

Agents must not establish new architectural policy silently through code.

## Agent requirements

Before proposing a new architectural approach, agents must:

1. inspect the current implementation;
2. inspect relevant architecture documentation;
3. inspect relevant accepted, superseded, and rejected ADRs;
4. determine whether the question has already been decided.

An accepted decision may be reconsidered only when new requirements, evidence, or
constraints justify doing so.
