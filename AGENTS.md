# AGENTS.md

## Purpose

This file defines the shared rules for AI agents working in the Pascoal repository.

These instructions apply regardless of the model, provider, editor, or agent framework being used. Tool-specific behavior belongs in the corresponding tool configuration, such as `CLAUDE.md` or `.claude/`.

Pascoal is an actively developed desktop IDE for Pascal. Changes must preserve the existing architecture, remain focused on the requested task, and work on both Windows and Linux whenever the affected functionality is expected to be cross-platform.

## Repository as the source of truth

The repository is the permanent source of project context.

Before proposing or making changes, inspect the relevant source files, tests, configuration, scripts, workflows, and documentation. Do not infer technologies, commands, paths, conventions, or behavior from assumptions.

Use the narrowest relevant context for the task. Do not read or load unrelated parts of the repository without a concrete reason.

When repository content conflicts with a prompt, report the conflict before proceeding. Do not silently replace the repository's current behavior with an assumed design.

## Project overview

Pascoal is a desktop IDE for Pascal built with a Svelte and TypeScript frontend and a Rust backend using Tauri.

The repository includes, among other areas:

* application layout and workspace behavior;
* editor integration and CodeMirror functionality;
* Pascal language support;
* project and file management;
* settings and toolchain integration;
* Git integration;
* internationalization;
* Tauri commands and operating-system integrations;
* frontend, Rust, Pascal integration, and end-to-end tests;
* public and technical documentation;
* release and versioning automation.

This overview is not a substitute for inspecting the current repository structure.

## General working rules

Agents must:

1. understand the requested outcome before editing files;
2. inspect the existing implementation and nearby tests;
3. present a plan before substantial or cross-cutting changes;
4. follow the existing architecture and naming conventions;
5. modify only what is required by the current task;
6. preserve unrelated behavior;
7. avoid speculative abstractions;
8. avoid cosmetic refactors unrelated to the requested result;
9. consider Windows and Linux behavior where applicable;
10. run the relevant available validations;
11. report files changed and validations performed;
12. suggest one Conventional Commit message for the current stage.

Agents must not invent files, commands, APIs, functionality, requirements, test results, or repository conventions.

When information is missing or ambiguous, inspect the repository first. If the ambiguity remains material to the implementation, explain it explicitly.

## Scope control

Every task must have a defined scope.

Changes outside that scope are prohibited unless they are strictly necessary for the requested behavior. When an out-of-scope change is necessary, explain the reason before making it whenever possible and report it clearly in the final response.

Do not perform opportunistic cleanup merely because a file is being edited.

Examples of unrelated changes to avoid include:

* renaming unrelated symbols;
* reformatting entire files;
* reorganizing directories;
* replacing established patterns with personal preferences;
* updating dependencies;
* rewriting working tests;
* changing public text;
* changing translations;
* updating versions;
* modifying release notes.

Potential improvements that are not required for the task should be reported separately rather than implemented.

## Separation of development stages

Pascoal intentionally separates implementation, tests, review, documentation, translations, changelog updates, and release preparation.

Unless a task explicitly combines stages, preserve the following boundaries.

### Planning

Planning tasks must not modify files.

They should produce:

* the understood objective;
* relevant existing behavior;
* proposed scope;
* explicit non-goals;
* likely files involved;
* implementation steps;
* risks and edge cases;
* validation strategy;
* unresolved questions, when material.

### Implementation

Implementation tasks may modify production code required by the approved scope.

They must not modify, unless explicitly requested:

* documentation;
* translations;
* `CHANGELOG.md`;
* release notes;
* version files;
* release workflows;
* unrelated tests.

Existing relevant tests may be executed during implementation. New tests normally belong to the dedicated testing stage.

### Testing

Testing tasks should analyze an existing implementation and add or update tests for its behavior.

They should:

* cover relevant successful, failure, boundary, and regression scenarios;
* follow existing test patterns;
* avoid rewriting the implementation merely to match a preferred test style;
* report code that is difficult to test;
* make production changes only when strictly required for testability and clearly report them.

Testing tasks must not update documentation, translations, changelog entries, release notes, or versions.

### Review

Review tasks are read-only by default.

They should identify concrete:

* bugs;
* regressions;
* missing validation;
* architectural inconsistencies;
* cross-platform problems;
* accessibility problems;
* unnecessary complexity;
* duplication with practical impact;
* missing tests;
* out-of-scope changes.

Reviews must distinguish verified defects from suggestions. Do not request rewrites based only on stylistic preference.

### Documentation

Documentation tasks may update only the documentation required by confirmed behavior.

Do not describe planned or assumed functionality as implemented.

Public documentation, technical documentation, changelog entries, and release notes have different purposes and must not be treated as interchangeable.

### Translation

Translation tasks must inspect the existing locale files and terminology before translating.

They must:

* preserve keys, placeholders, markup, and interpolation syntax;
* keep supported locale files synchronized when requested;
* follow established terminology;
* avoid reorganizing locale files without need;
* avoid inventing features or behavior;
* report genuine ambiguities instead of silently guessing.

### Release preparation

Release preparation verifies and, only when explicitly requested, updates the files required for a release.

It must not create tags, push changes, publish releases, or alter Git history.

## Git policy

The repository owner retains full control of Git operations.

Agents must not execute write or history-changing Git operations unless the user explicitly requests that exact operation in the current task.

Prohibited operations include, but are not limited to:

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

Agents must also not:

* create or delete branches;
* change branches;
* create or delete tags;
* amend commits;
* discard working-tree changes;
* resolve conflicts automatically;
* alter Git history;
* publish GitHub releases;
* merge pull requests.

Read-only inspection is permitted when relevant, including commands such as:

```text
git status
git diff
git diff --stat
git log
git show
git branch --show-current
git rev-parse
git tag --list
```

Read-only Git commands must not be used to justify unrelated repository exploration.

Never assume the working tree is clean. Never discard changes that may belong to the user.

## Commit messages

After completing a stage that changed files, suggest exactly one Conventional Commit message describing only the work performed in that stage.

Examples:

```text
feat(settings): add toolchain status page
test(settings): cover toolchain detection states
docs(readme): update settings feature overview
docs(changelog): add version 2026.4.0 changes
chore(release): bump version to 2026.4.0
```

Do not include implementation, tests, documentation, translations, and version changes in the same suggested commit unless the current task explicitly performed all of them as one approved stage.

Do not execute the commit.

## Cross-platform requirements

Pascoal is developed on Windows 11 and CachyOS/Linux.

For functionality that interacts with the operating system, filesystem, processes, commands, paths, environment variables, toolchains, or Git:

* evaluate Windows and Linux behavior;
* use platform-safe path handling;
* avoid hard-coded path separators;
* avoid assuming a specific shell;
* avoid assuming GNU utilities exist on Windows;
* avoid assuming PowerShell exists or is configured on Linux;
* preserve Unicode and paths containing spaces;
* handle missing external tools gracefully;
* follow existing abstractions in the Rust backend.

Shared automation should preferably use tools already required by the project, such as Node.js or Rust, when that provides a maintainable cross-platform solution.

Platform-specific implementations are acceptable when the operating systems genuinely require different behavior, but they must expose consistent application behavior where practical.

## Architecture rules

Before introducing a new module, abstraction, dependency, command, store, service, or directory:

1. inspect how the same responsibility is handled elsewhere;
2. determine the correct architectural layer;
3. prefer extending an existing pattern when appropriate;
4. avoid bypassing established boundaries;
5. justify new abstractions with a current requirement.

Frontend code must not reproduce operating-system responsibilities that belong in the Tauri/Rust backend.

Tauri commands should remain focused on the application boundary rather than accumulating unrelated business logic.

Shared behavior should not be duplicated across components or commands when an established reusable layer already exists.

Architecture documentation under `docs/architecture/` describes current structure. Architectural decisions under `docs/decisions/` record significant choices and their consequences. Neither should be replaced by temporary chat context.

## Dependencies

Do not add, remove, replace, or upgrade dependencies unless the task explicitly requires it or the existing implementation cannot reasonably satisfy the requirement.

Before adding a dependency:

* inspect whether the repository already contains an equivalent solution;
* evaluate maintenance and cross-platform implications;
* prefer the existing project stack;
* explain why the dependency is necessary;
* limit the dependency to the appropriate frontend or Rust layer.

Do not regenerate lockfiles unless required by an approved dependency change.

## Testing and validation

Use the scripts currently defined by the repository as the source of truth.

Common test entry points currently include:

```text
npm run test:frontend
npm run test:frontend:coverage
npm run test:rust
npm run test:rust:coverage
npm run test:pascal
npm run test:e2e
npm test
```

Before using a command, verify its current definition in `package.json`, workflow files, or the relevant project configuration.

Select validation proportionally:

* frontend changes: relevant frontend tests and static checks;
* Rust changes: relevant Rust tests;
* Pascal execution changes: Pascal integration tests when the environment supports them;
* cross-layer changes: validate both affected layers;
* user-interface flows: consider end-to-end tests when applicable;
* documentation-only changes: verify links, paths, examples, and consistency.

Do not claim a command passed unless it was actually executed successfully.

When a validation cannot be executed, report:

* the command not run;
* the concrete reason;
* any substitute validation performed;
* what still requires manual verification.

Do not silently ignore failures. Distinguish failures caused by the change from environment or pre-existing failures when evidence allows.

## Documentation sources of truth

Avoid duplicating the same information across multiple files.

Use these responsibilities:

* `README.md`: public project overview and entry point;
* translated READMEs: localized versions of the public overview;
* `CHANGELOG.md`: versioned record of relevant changes;
* release notes: concise user-facing changes for a specific release;
* `docs/development/`: development and maintenance processes;
* `docs/architecture/`: current technical architecture;
* `docs/decisions/`: significant architectural decision records;
* `docs/features/`: detailed behavior of features that require dedicated documentation;
* `docs/roadmap/`: high-level strategic direction, not task tracking;
* GitHub Issues and Projects: actionable work, priorities, and progress.

Do not use the README as a detailed operational roadmap.

## Security and destructive actions

Do not:

* expose tokens, credentials, private keys, or local secrets;
* insert secrets into tracked files;
* weaken security controls to make a task easier;
* delete user data or project files without explicit approval;
* run destructive filesystem commands;
* overwrite local configuration without inspecting it;
* disable tests, checks, or warnings merely to obtain a passing result.

Treat updater keys, signing credentials, release secrets, GitHub tokens, and local environment files as sensitive.

## Generated and external files

Before editing a file, determine whether it is:

* handwritten source;
* generated output;
* vendored content;
* build output;
* dependency metadata;
* user-local configuration.

Prefer changing the source or generator rather than manually editing generated output.

Do not modify build artifacts or dependency directories unless explicitly required.

## Final response format

After changing files, provide a concise report with:

### Summary

What was changed and why.

### Files changed

A list of files created, modified, or deleted, with each file's purpose.

### Validation

Commands executed and their results.

### Notes

Relevant limitations, manual checks, follow-up work, or out-of-scope findings.

### Suggested commit

Exactly one Conventional Commit message for the current stage.

When no files were changed, state that clearly and omit the commit suggestion unless the user specifically asks for one.

## Instruction precedence

When instructions conflict, use this order:

1. the user's explicit instruction for the current task;
2. safety and repository-protection rules;
3. this `AGENTS.md`;
4. tool-specific repository instructions;
5. relevant technical documentation;
6. established source-code patterns;
7. general model preferences.

A task-specific instruction may expand the allowed scope, but agents must not infer permission for Git operations, destructive actions, release publication, or unrelated changes.
