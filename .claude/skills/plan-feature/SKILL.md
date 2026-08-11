---
name: plan-feature
description: Run read-only Pascoal discovery and produce an SDD specification proposal for a feature, fix, refactor, or larger idea before GitHub materialization.
argument-hint: "[idea, problem, task, issue, or objective]"
disable-model-invocation: true
---

# Plan feature

Analyze and specify:

$ARGUMENTS

## Procedure

1. Read `AGENTS.md`, `docs/development/sdd.md`,
   `docs/development/documentation-policy.md`, and relevant architecture/ADR
   documentation.
2. Use the `specification` subagent for repository-grounded discovery when the
   task is more than a trivial reduced-SDD change.
3. Inspect the closest relevant implementation, tests, configuration, and
   documentation.
4. Read relevant GitHub Issues, Milestones, or Project state when existing work
   may affect scope. Keep all GitHub operations read-only.
5. Describe current behavior from repository evidence.
6. Ask only material questions needed to remove ambiguity.
7. Classify the work as Feature, Fix, Refactor, or Epic plus Features.
8. Define useful RF, RNF, RN, acceptance criteria, architecture impact, and
   explicit non-goals.
9. Decompose the work into focused Work Packages only when decomposition improves
   implementation continuity or validation.
10. Define proportional automated and owner-manual validation.
11. Present the specification as a proposal for owner approval.

Do not edit files, implement behavior, create branches, modify Git state, or
materialize Issues, Milestones, or Project items.

## Output

Use only sections that add value:

- Classification
- Context
- Current behavior
- Goal
- Scope
- Out of scope
- Functional Requirements
- Non-Functional Requirements
- Business Rules
- Acceptance Criteria
- Architecture impact / Related ADRs
- Proposed Work Packages
- Validation expectations
- Release impact
- Open questions

End with:

`Status: Proposed - awaiting owner approval.`

After approval, GitHub materialization is a separate explicit step.
