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
- Issues: self-contained Work Packages, Spikes, Bugs, and Refactors;
- Projects: workflow status and issue type (Pascoal Development, Project #3).

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
7. determine whether decomposition into several Issues is required.

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
- Issue decomposition

Before owner approval, the specification is a proposal.

## Work hierarchy

```text
Milestone (release scope)
└── Issue: Work Package | Spike | Bug | Refactor
```

There is no Epic or Feature level. An Issue is not required to belong to a
parent item.

### Milestone

A Milestone represents a deliverable Pascoal version and defines its release
scope. Versions follow `YEAR.RELEASE.PATCH`. Scope and dates remain
owner-controlled.

### Issue

An Issue is the unit of approved work. It must be self-contained: it carries
enough context to be implemented and validated without relying on the session
that created it. Its type is recorded in Project #3, which also tracks its
status.

| Type | Use |
|---|---|
| Work Package | Planned functional capability or improvement. |
| Spike | Time-boxed investigation that produces a decision or findings, not product behavior. |
| Bug | Correction of existing behavior. |
| Refactor | Structural work that preserves intended observable behavior unless its approved specification states otherwise. |

Split work into several Issues only when the parts are independently useful,
orderable, and validatable. Express ordering through the Dependencies section of
each Issue.

Issues do not need to map one-to-one to commits.

## Issue structure

Recommended structure for a Work Package; adapt it for a Spike, Bug, or Refactor:

```text
Objective
Scope / Out of scope
Related requirements
Relevant architecture / ADRs
Acceptance criteria
Dependencies
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
| Done | The owner accepted the Issue after validation. |

Known required automated validation must pass before `Validation`.

Problems found during manual validation return the Issue to `In Progress`.

## Outcome record

Before `Done`, record in the Issue only what future work or release preparation may need:

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

Branch usage is an owner decision recorded in the Issue or Milestone. The owner
may choose small, owner-validated commits directly on `main` for an initiative.
That choice does not authorize an agent to stage, commit, push, tag, or publish.

Detailed branch rules belong in `docs/development/workflow.md`.

Commits remain concise implementation history and use Conventional Commits, for
example:

```text
refactor(explorer): split file tree node responsibilities
```

A short body may be added when useful. Detailed implementation and validation
context belongs in the Issue.

## Architectural decisions during implementation

If implementation reveals a durable architectural decision with meaningful
alternatives:

1. record the question in the Issue;
2. inspect existing ADRs;
3. stop the affected architectural choice;
4. propose the decision and obtain owner approval;
5. create or update the ADR;
6. continue implementation.

Agents must not establish architectural policy silently through code.

## Session handoff

Before ending a session with unfinished work, update the current Issue with:

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
