# AGENTS.md

## Purpose

This file defines the shared rules for any AI agent working in the Pascoal repository.

Tool-specific instructions belong in files such as `CLAUDE.md` and `.claude/`. Detailed procedures belong in `docs/development/` and `.claude/skills/`.

## Source of truth

The repository is the permanent source of project context.

Before proposing or making changes:

* inspect the relevant implementation;
* inspect nearby tests;
* verify commands and paths in the repository;
* follow existing conventions;
* read only the documentation relevant to the task.

Do not assume technologies, APIs, files, commands, behavior, architecture, or test results.

When a prompt conflicts with the repository, report the conflict.

## General rules

Agents must:

* understand the requested result;
* remain within the approved scope;
* preserve unrelated behavior;
* follow existing architecture and naming;
* avoid speculative abstractions;
* avoid unrelated refactors and formatting;
* consider Windows and Linux when applicable;
* run proportional validation;
* report changed files and validation results;
* suggest one Conventional Commit message after changing files.

Potential improvements outside the task must be reported separately, not implemented.

## Development stages

Pascoal separates:

* planning;
* implementation;
* testing;
* review;
* documentation;
* translations;
* release preparation.

Do not combine stages unless explicitly requested.

Detailed workflow rules are defined in:

```text
docs/development/workflow.md
```

### Planning

Planning tasks are read-only.

A plan should identify:

* objective;
* current behavior;
* scope and non-goals;
* relevant files or layers;
* implementation steps;
* risks;
* validation strategy.

### Implementation

Implementation tasks may modify only the production code required by the approved scope.

Unless explicitly requested, do not modify:

* tests;
* documentation;
* translations;
* changelog;
* release notes;
* versions;
* release workflows.

### Testing

Testing tasks should add or update focused tests for an existing implementation.

Production code may change only when a small behavior-preserving adjustment is strictly required for testability.

Detailed testing rules are defined in:

```text
docs/development/testing.md
```

### Review

Review tasks are read-only by default.

Focus on concrete:

* bugs;
* regressions;
* architectural inconsistencies;
* cross-platform problems;
* missing validation;
* missing tests;
* unnecessary complexity;
* out-of-scope changes.

Distinguish defects from optional suggestions.

### Documentation and translation

Documentation must describe confirmed behavior.

Translations must preserve keys, placeholders, interpolation, structure, and established terminology.

Do not invent functionality or reorganize files unnecessarily.

### Release preparation

Release preparation may verify or update release-related files only when explicitly requested.

It must never create tags, push changes, or publish releases.

## Git policy

The repository owner retains full control of Git.

Agents must not execute Git write or history-changing operations unless the user explicitly requests that exact operation in the current task.

This includes:

```text
git commit
git commit --amend
git push
git pull
git merge
git rebase
git reset
git restore
git checkout
git switch
git branch
git tag
git stash
git clean
```

Agents must not:

* create, delete, or switch branches;
* create or delete tags;
* discard working-tree changes;
* resolve conflicts automatically;
* alter Git history;
* merge pull requests;
* publish releases.

Read-only commands such as `git status`, `git diff`, `git log`, and `git show` are allowed when relevant.

Never assume the working tree is clean.

## Commit messages

After changing files, suggest exactly one Conventional Commit message describing only the current stage.

Examples:

```text
feat(settings): add toolchain status page
test(settings): cover toolchain detection states
docs(readme): update settings overview
docs(changelog): add version 2026.4.0 changes
chore(release): bump version to 2026.4.0
```

Do not execute the commit.

## Cross-platform requirements

Pascoal targets Windows and Linux.

For paths, filesystem, processes, shells, Git, toolchains, and operating-system integration:

* use platform-safe path handling;
* avoid hard-coded separators;
* avoid assuming a specific shell;
* preserve Unicode and paths containing spaces;
* handle missing external tools;
* follow existing Rust backend abstractions;
* evaluate both supported platforms when behavior may differ.

Prefer cross-platform automation using tools already required by the project, such as Node.js or Rust.

## Architecture

Before introducing a module, abstraction, command, store, service, dependency, or directory:

1. inspect existing patterns;
2. identify the correct layer;
3. prefer extending established behavior;
4. avoid bypassing architectural boundaries;
5. justify the addition with a current requirement.

Operating-system and filesystem responsibilities belong in the Tauri/Rust backend.

Tauri commands should remain focused on the application boundary.

Do not duplicate behavior already provided by an existing layer.

## Dependencies

Do not add, remove, replace, or upgrade dependencies unless explicitly required.

Before adding one:

* confirm no existing solution is sufficient;
* evaluate maintenance and cross-platform impact;
* explain why it is necessary;
* add it only to the appropriate layer.

Do not regenerate lockfiles without an approved dependency change.

## Validation

The repository configuration is the source of truth for commands.

Verify command definitions before running them.

End-to-end testing is currently paused and is not an active requirement unless the task explicitly concerns E2E work.

Do not claim a test or validation passed unless it was executed successfully.

When validation cannot run, report:

* the command not executed;
* the reason;
* any substitute validation;
* remaining manual checks.

Do not hide or ignore failures.

## Documentation responsibilities

Use:

* `README.md` for the public overview;
* translated READMEs for localized public documentation;
* `CHANGELOG.md` for versioned changes;
* release notes for release-specific communication;
* `docs/development/` for development processes;
* `docs/architecture/` for current architecture;
* `docs/decisions/` for significant decisions;
* `docs/features/` for detailed feature documentation;
* `docs/roadmap/` for strategic direction;
* GitHub Issues and Projects for actionable work.

Avoid duplicating the same information across files.

## Safety

Do not:

* expose or store secrets;
* weaken security controls;
* delete user data without explicit approval;
* run destructive filesystem commands;
* overwrite local configuration without inspection;
* disable tests or warnings merely to obtain a passing result;
* edit generated or vendored files when their source can be changed instead.

## Final response

After changing files, report:

### Summary

What changed and why.

### Files changed

Files created, modified, or deleted.

### Validation

Commands executed and their actual results.

### Notes

Limitations, manual checks, and out-of-scope findings.

### Suggested commit

Exactly one Conventional Commit message for the current stage.

When no files changed, state that clearly and omit the commit suggestion unless requested.

## Instruction precedence

When instructions conflict:

1. explicit user instruction for the current task;
2. safety and repository-protection rules;
3. this file;
4. tool-specific repository instructions;
5. relevant project documentation;
6. established source-code patterns.

Permission for one task does not imply permission for Git operations, destructive actions, or release publication.
