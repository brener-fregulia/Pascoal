# AGENTS.md

## Purpose

This file defines the mandatory rules for any AI agent working in the Pascoal repository.

Tool-specific instructions belong in files such as `CLAUDE.md` and `.claude/`. Detailed procedures belong in `docs/development/` and `.claude/skills/`.

## Source of truth

The repository is the permanent source of technical project context.
GitHub Issues, Projects, and Milestones are the operational source of truth for
approved work, workflow state, and release scope.

Before proposing or making changes:

- inspect the relevant implementation and nearby tests;
- verify commands, paths, configuration, and conventions in the repository;
- read only the documentation needed for the task;
- report conflicts between the request and the repository.

Do not invent files, APIs, behavior, requirements, commands, conventions, or validation results.

## Scope

Keep changes limited to the requested outcome and directly necessary supporting work.

Implement one approved Work Package or reduced-SDD responsibility at a time.
Do not silently decompose or expand approved scope during implementation.

Relevant automated tests are part of implementation completeness. Add or update
focused tests with the behavior they protect, then run the narrowest relevant
validation before owner manual validation. Tests may use the same commit as the
implementation or a separate commit when that improves review or reversal.

Do not expand into unrelated cleanup, refactoring, formatting, translations, dependencies, versions, changelog entries, or release work.

Preserve existing architecture, naming, and behavior unless the task requires a change. Report useful out-of-scope improvements separately.

SDD rules are in `docs/development/sdd.md`. Detailed execution guidance is in `docs/development/workflow.md`.

## Repository protection

- Preserve existing working-tree changes, including changes not created by the agent.
- Never discard, overwrite, revert, or reformat unrelated work.
- Inspect a file before replacing or deleting it.
- Prefer changing a generator or source file instead of generated output.
- Do not edit vendored files, build output, dependency directories, or local configuration unless the task specifically requires it.
- Do not expose, store, or print secrets, credentials, signing keys, tokens, or private environment values.
- Do not weaken security controls, tests, or warnings to make a task pass.
- Do not run destructive filesystem or data operations without explicit, specific authorization.

## Git policy

The repository owner retains control of Git and publication.

Inspection commands such as `git status`, `git diff`, `git log`, and `git show` are allowed when relevant.

Unless the user explicitly requests a specific operation for the current task, do not run Git or GitHub operations that modify:

- the working tree or index;
- branches or tags;
- commit history;
- remotes or synchronization state;
- pull requests, releases, or publication state.

This restriction includes commits, amendments, staging, checkout or restore operations, branch or tag management, merges, rebases, resets, stashes, pushes, pulls, conflict resolution, and release publication.

A general request to implement, test, prepare a release, or finish a task is not permission to perform these operations.

After changing files, suggest a Conventional Commit message when useful, but do not execute it.

## Architecture and dependencies

Before introducing a module, abstraction, command, store, service, directory, or dependency:

1. inspect the closest existing pattern;
2. identify the correct architectural layer;
3. prefer extending an established solution;
4. justify the addition with a current requirement.

Operating-system, filesystem, process, Git, and toolchain responsibilities should remain in the Tauri/Rust backend unless the existing architecture establishes another boundary.

Do not add, remove, replace, or upgrade dependencies unless required by the task. Before doing so, confirm that the repository has no sufficient existing solution and explain the maintenance and cross-platform impact.

Only update lockfiles as a consequence of an approved dependency change.

## Environment compatibility

Pascoal is developed on Windows and Linux.

For paths, filesystems, processes, shells, toolchains, Git, and automation:

- use platform-safe path handling;
- avoid hard-coded path separators and shell assumptions;
- preserve Unicode and paths containing spaces;
- handle missing external tools explicitly;
- evaluate both supported platforms when behavior may differ;
- prefer cross-platform tools already required by the project, especially Node.js or Rust.

Platform-specific code is acceptable when required, but application behavior should remain consistent where practical.

## Validation

Use the repository configuration as the source of truth for commands.

Run validation proportional to the affected scope. Detailed test guidance is in `docs/development/testing.md`.

- Do not claim a command, test, build, check, or manual validation passed unless it was actually completed.
- Do not hide failures or silently weaken checks.
- When validation cannot run, report the command, reason, substitute checks, and remaining manual work.
- Distinguish failures caused by the change from environment limitations or pre-existing repository failures when evidence allows.

## Documentation references

Use the existing documentation by responsibility:

- `README.md` and translated READMEs: public project overview;
- `CHANGELOG.md`: versioned changes;
- release notes: release-specific user communication;
- `docs/development/`: development processes;
- `docs/architecture/`: current architecture;
- `docs/decisions/`: significant decisions;
- `docs/features/`: detailed feature behavior;
- `docs/roadmap/`: strategic direction;
- GitHub Issues: approved specifications and Work Packages;
- GitHub Projects: workflow state and progress;
- GitHub Milestones: release scope.

Avoid maintaining the same information in multiple places.

## Final response

After changing files, report at minimum:

- summary of the changes;
- files changed;
- validation performed and actual results;
- limitations, manual checks, and relevant out-of-scope findings;
- one suggested Conventional Commit message when appropriate.

When no files changed, state that clearly.

## Instruction precedence

When instructions conflict, use this order:

1. safety, data protection, and non-destructive operation;
2. explicit user instructions for the current task;
3. this file;
4. tool-specific repository instructions;
5. relevant project documentation;
6. established source-code patterns.

A normally restricted operation requires an explicit, specific, and task-limited request. It cannot be authorized implicitly.
