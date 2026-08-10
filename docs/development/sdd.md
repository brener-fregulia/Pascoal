# Spec-Driven Development

## Purpose

Pascoal uses Spec-Driven Development (SDD) so approved work can continue across
AI sessions without depending on conversation history.

The repository stores permanent technical context. GitHub stores approved work,
release scope, and workflow state.

## Sources of truth

Repository:

- implementation and tests;
- `AGENTS.md`;
- `docs/architecture/`;
- `docs/decisions/`;
- `docs/development/`.

GitHub:

- Milestones: release scope;
- Issues: Epics, Features, Fixes, Refactors, and Work Packages;
- Projects: workflow state and progress.

A session must never be the only place containing information required to
continue, validate, or release work.

## Lifecycle

```text
Idea
  ↓
Discovery
  ↓
Specification
  ↓
Owner approval
  ↓
GitHub materialization
  ↓
Implementation
  ↓
Validation
  ↓
Done
  ↓
Release
```

Use the smallest hierarchy that preserves useful context and traceability.

## Discovery

Discovery is analysis, not implementation.

The responsible agent must:

1. understand the requested outcome;
2. inspect relevant implementation and tests;
3. inspect relevant architecture and ADRs;
4. identify affected responsibilities, constraints, and non-goals;
5. ask questions needed to remove material ambiguity;
6. identify validation expectations;
7. determine whether decomposition is required.

Do not invent requirements to fill gaps.

## Specification

Use only sections that provide useful information:

- Context
- Goal
- Scope
- Out of scope
- Functional Requirements (`RF-###`)
- Non-Functional Requirements (`RNF-###`)
- Business Rules (`RN-###`)
- Acceptance Criteria
- Architecture impact
- Related ADRs
- Work Package decomposition

Before owner approval, the specification is a proposal.

## Work hierarchy

```text
Release / Milestone
│
├── Epic                         optional
│   └── Feature
│       └── Work Package
├── Feature
│   └── Work Package
├── Fix
│   └── Work Package
└── Refactor
    └── Work Package
```

### Release

A Release is a deliverable Pascoal version represented by a GitHub Milestone.

Versions follow `YEAR.RELEASE.PATCH`. A release may contain multiple Features,
Fixes, and Refactors.

### Epic

Optional parent used only when one idea produces multiple related Features that
benefit from shared context.

### Feature

One coherent functional capability or improvement. Its Issue is the primary
approved specification and may span multiple agent sessions.

### Fix

Correction of existing behavior. Complex fixes may contain multiple Work
Packages.

### Refactor

Structural work that preserves intended observable behavior unless its approved
specification states otherwise. It may be independent or a Work Package inside a
Feature.

### Work Package

The smallest planned execution unit. It must contain enough context to be
implemented and validated without relying on the session that created it.

Work Packages do not need to map one-to-one to commits.

## Feature issue

Recommended structure:

```text
Context
Goal
Scope / Out of scope
RF / RNF / RN
Acceptance Criteria
Architecture impact / Related ADRs
Work Packages
Release impact
```

Implementation details that belong to one Work Package should stay out of the
parent Feature.

## Work Package issue

Recommended structure:

```text
Objective
Scope / Out of scope
Related requirements
Relevant architecture / ADRs
Acceptance criteria
Implementation notes
Automated validation
Manual validation
Outcome
```

## Status model

| Status | Meaning |
|---|---|
| Backlog | Identified, but definition, dependencies, or ordering may still be unresolved. |
| Ready | Approved context is sufficient to start without relying on a previous session. |
| In Progress | Implementation, focused automated tests, and relevant automated validation are active. |
| Validation | Implementation and automated validation are complete; owner manual validation is pending. |
| Done | The owner accepted the Work Package after validation. |

Known required automated validation must pass before `Validation`.

Problems found during manual validation return the Work Package to
`In Progress`.

## Outcome record

Before `Done`, record only what future work or release preparation may need:

```text
Outcome
- implemented result;
- relevant deviation from the plan.

Automated validation
- relevant commands and results.

Manual validation
- relevant scenarios and results.

Related changes
- ADRs or architecture documentation updated.
```

Do not reproduce the code diff.

## Branches and commits

Features, Fixes, and independent Refactors may own development branches. Work
Packages normally share the parent branch and do not create branches by default.

Detailed branch rules belong in `docs/development/workflow.md`.

Commits remain concise implementation history and use Conventional Commits, for
example:

```text
refactor(explorer): split file tree node responsibilities
```

A short body may be added when useful. Detailed implementation and validation
context belongs in the Work Package.

## Architectural decisions during implementation

If implementation reveals a durable architectural decision with meaningful
alternatives:

1. record the question in the Work Package;
2. inspect existing ADRs;
3. stop the affected architectural choice;
4. propose the decision and obtain owner approval;
5. create or update the ADR;
6. continue implementation.

Agents must not establish architectural policy silently through code.

## Session handoff

Before ending a session with unfinished work, update the current Work Package
with:

- current status;
- completed and remaining work;
- relevant validation results;
- unresolved blockers or questions.

A new session reconstructs context from the repository and GitHub rather than
assuming previous conversation history.

## Reduced SDD

Small, isolated, low-risk changes may use a reduced process when they do not need
meaningful discovery, decomposition, or architectural decisions.

Examples include typo or translation corrections, broken documentation links,
and trivial bug fixes.

Reduced SDD must not bypass necessary specification.

## Guiding rule

Use enough process to preserve decisions, scope, validation, and continuity.
Do not add hierarchy or documentation that provides no useful project context.
