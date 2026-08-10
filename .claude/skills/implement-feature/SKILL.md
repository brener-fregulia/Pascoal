---
name: implement-feature
description: Implement one approved Pascoal Work Package or reduced-SDD task with focused automated validation.
argument-hint: "[approved Work Package or reduced-SDD task]"
disable-model-invocation: true
---

# Implement feature

Implement:

$ARGUMENTS

## Procedure

1. Read `AGENTS.md`, `docs/development/sdd.md`, `docs/development/workflow.md`,
   and the relevant architecture or ADRs.
2. Reconstruct context from the approved GitHub item and current repository state.
3. Confirm that this run covers one Work Package or one reduced-SDD responsibility.
   Do not silently create or absorb additional work.
4. Inspect the affected implementation and nearby tests.
5. Use the `frontend` or `rust` subagent when domain isolation is useful.
6. Implement only the approved scope.
7. Add or update the focused automated tests required by the changed behavior.
8. Run the narrowest relevant validation, broadening only when the affected scope
   justifies it.
9. Review the result for regressions, architecture violations, platform impact,
   and out-of-scope changes.
10. Report the implementation as ready for owner manual validation only when
    required automated validation is not known to be failing.

Do not change versions, changelog, release notes, dependencies, workflows, GitHub
state, or Git state unless the current task explicitly authorizes it.

## Output

Report:

- implemented scope;
- files changed;
- automated validation and actual results;
- manual checks remaining for the repository owner;
- blockers, limitations, or out-of-scope findings;
- one concise Conventional Commit suggestion.

Do not claim the Work Package is `Done`; owner manual validation is the gate from
`Validation` to `Done`.
