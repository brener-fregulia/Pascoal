# Development Workflow

## Purpose

This document defines how approved Pascoal work is executed.

The specification and decomposition model is defined in
`docs/development/sdd.md`. Testing details are in
`docs/development/testing.md`. Mandatory safety and Git rules are in `AGENTS.md`.

Pascoal is primarily maintained by one developer. The workflow should preserve
control, traceability, resumability across agent sessions, and reviewable changes
without adding unnecessary team ceremony.

## Principles

- The repository is the source of technical truth.
- GitHub is the operational source of truth for approved work and progress.
- Implement one approved Work Package or reduced-SDD responsibility at a time.
- Relevant automated tests are part of implementation completeness.
- Owner manual validation is the gate before `Done`.
- Keep `main` stable; planned Feature, Fix, and independent Refactor work uses a
  dedicated branch.
- Work Packages normally share the branch of their parent item.
- Commits stay concise; detailed execution history belongs in the Work Package.
- The repository owner retains control of Git and publication.

## Operational flow

```text
Approved specification
        ↓
Work Package: Ready
        ↓
Branch from main
        ↓
In Progress
  implementation
  + automated tests
  + automated validation
        ↓
Validation
  owner manual checks
        ↓
Done
```

A failed automated check or owner validation returns the Work Package to
`In Progress`.

## 1. Start or resume work

Before editing:

1. identify the approved Feature, Fix, or Refactor;
2. identify the current Work Package;
3. inspect its scope, acceptance criteria, and status;
4. inspect relevant architecture and ADRs;
5. inspect the current implementation and nearby tests;
6. verify that unresolved questions do not block implementation.

A Work Package should enter `Ready` only when another agent session could begin
from persistent repository and GitHub context without depending on conversation
history.

Reduced-SDD work may skip formal GitHub decomposition when allowed by
`docs/development/sdd.md`.

## 2. Branch model

`main` is the stable integration branch.

Planned work uses a branch created from `main`:

```text
feature/<name>
fix/<name>
refactor/<name>
```

Examples:

```text
feature/git-panel
fix/runner-rebuild
refactor/file-tree
```

A Feature's Work Packages normally use the same `feature/<name>` branch.
Likewise, Work Packages belonging to a Fix or independent Refactor share their
parent branch.

Do not create a branch per Work Package by default.

Small reduced-SDD documentation or maintenance work may be performed directly on
`main` when the repository owner explicitly chooses that simpler path.

Branch creation, switching, merging, pushing, pulling, and publication remain
repository-owner operations unless explicitly authorized for the current task by
`AGENTS.md`.

Pull requests are optional for owner-managed work. Use them when review,
experimentation, external contribution, or GitHub review tooling provides value.

## 3. In Progress

`In Progress` is the implementation stage.

For the current Work Package:

- inspect the current state before editing;
- preserve established architecture and naming;
- implement only approved scope;
- consider Windows and Linux where relevant;
- add or update focused automated tests for changed behavior;
- run the narrowest relevant validation;
- broaden validation only when the affected scope justifies it;
- review the resulting diff for regressions and unrelated changes.

Do not add unrelated cleanup, refactors, formatting, translations, dependencies,
versions, changelog entries, or release work.

Testing must not encode guessed behavior. If requirements or acceptance criteria
are ambiguous, resolve the ambiguity instead of choosing behavior through a test.

A Work Package is ready to leave `In Progress` when:

- its approved scope is implemented;
- required focused automated tests exist;
- required automated validation is not known to be failing;
- remaining manual checks are identified.

## 4. Validation

`Validation` is the repository owner's manual acceptance stage.

Use manual validation especially for:

- complete application flows;
- layout, responsiveness, keyboard use, and CodeMirror interactions;
- native dialogs, filesystem, processes, Git, and toolchains;
- Windows and Linux differences;
- behavior that active automated layers cannot represent reliably.

Before handoff, the agent reports:

- what was implemented;
- automated checks and actual results;
- known limitations;
- exact manual checks still required.

Do not claim owner validation was completed.

If manual validation finds a problem, return the Work Package to `In Progress`,
correct the behavior and relevant tests, then validate again.

## 5. Done and Work Package outcome

`Done` means the repository owner accepted the Work Package.

After validation, keep the Work Package outcome concise and useful:

```text
Outcome
- implemented result;
- relevant deviation from the original plan.

Automated validation
- relevant commands and results.

Manual validation
- validated scenarios and platforms.

Related changes
- architecture or ADR updates when applicable.
```

Do not reproduce the code diff or conversation transcript.

A parent Feature, Fix, or Refactor is complete only when its required Work
Packages and acceptance criteria are complete.

## 6. Architecture and documentation

Implementation must respect current `docs/architecture/` and accepted
`docs/decisions/`.

If work reveals a durable architectural decision with meaningful alternatives,
follow the ADR process before silently establishing the choice through code.

Update permanent documentation only when the validated change affects information
that remains useful beyond the Work Package.

Documentation ownership is defined in
`docs/development/documentation-policy.md`.

## 7. Technical review

Review compares the work with:

- approved scope and acceptance criteria;
- current architecture and ADRs;
- automated tests and validation;
- supported platforms;
- preservation of unrelated behavior.

Prioritize correctness, destructive behavior, regressions, cross-platform
failures, architectural violations, missing error handling, missing tests, and
out-of-scope changes.

Review is read-only unless corrections are explicitly requested.

## 8. Commit strategy

Use concise Conventional Commits.

Examples:

```text
feat(git): add repository status service
fix(runner): terminate previous run before rebuilding
refactor(explorer): split file tree node responsibilities
test(editor): cover document navigation states
```

A commit may contain implementation and its directly related tests when they form
one coherent change.

Use a separate `test(...)` commit when test work is independently useful, such as
coverage backfill or a focused regression suite.

Do not split work only to satisfy a process rule. Do not combine independent
responsibilities only to shorten history.

The Work Package, not the commit message, stores detailed implementation and
validation context.

Agents suggest commit messages but do not execute commits unless explicitly
authorized.

## 9. Release relationship

Features, Fixes, and Refactors intended for a release belong to the corresponding
GitHub Milestone.

A release may contain multiple Features, Fixes, and Refactors.

Release preparation follows:

```text
docs/development/release-process.md
```

Release communication should use completed GitHub work and repository
documentation as structured context, with commit history and diffs used to verify
what actually reached the release revision.

## Reduced workflow

A small, low-risk change may use:

```text
scope confirmation
→ implementation + relevant automated tests
→ proportional automated validation
→ owner manual validation when needed
→ concise commit
```

Reduced SDD does not remove repository inspection, scope control, architecture
constraints, honest validation, preservation of user changes, or Git restrictions.
