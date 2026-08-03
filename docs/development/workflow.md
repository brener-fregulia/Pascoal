# Development Workflow

## Purpose

This document defines the recommended development workflow for Pascoal.

Pascoal is currently maintained primarily by a single developer. The workflow is intentionally lightweight and does not require pull requests, mandatory branches, squash merges, or team-oriented ceremonies.

The goal is to preserve control, traceability, and clear development stages while using AI agents to reduce repetitive work.

## Core principles

The workflow follows these principles:

* the repository is the permanent source of project context;
* the repository owner retains full control of Git operations;
* implementation, tests, review, documentation, translations, and release preparation are separate stages;
* commits should represent meaningful development stages;
* direct development on the main branch is acceptable for normal changes;
* branches are useful for large, risky, or long-running changes;
* pull requests remain optional;
* agents must operate only within the scope of the current task;
* automation should reduce repetitive work without removing manual control.

## Why stages remain separate

Pascoal intentionally keeps implementation, tests, documentation, and release work in separate commits when practical.

This provides:

* clearer review boundaries;
* easier partial reversions;
* more useful repository history;
* better support for `git bisect`;
* isolation between behavioral and non-behavioral changes;
* easier identification of where regressions were introduced;
* more accurate Conventional Commit messages.

Agents must not combine stages merely to reduce the number of commits.

## Standard workflow

The standard workflow consists of the following stages:

1. planning;
2. implementation;
3. manual validation;
4. tests;
5. manual validation;
6. technical review;
7. documentation and translations;
8. changelog and release notes;
9. version preparation;
10. manual Git and release operations.

Not every task requires every stage.

Small fixes may use a reduced workflow, but the separation of responsibilities should still be preserved.

## Stage 1: task definition

A task may begin from:

* a GitHub Issue;
* a GitHub Project draft item;
* a structured prompt;
* a short repository document;
* a bug report;
* an observed regression;
* an architectural research question.

A task definition should describe, when relevant:

* the problem;
* the expected result;
* current behavior;
* affected area;
* known constraints;
* explicit non-goals;
* platform considerations;
* validation expectations.

The task does not need to be formal or extensive. It only needs enough information to establish a concrete scope.

## Stage 2: planning

The planning stage is read-only.

The agent should:

1. read the task;
2. inspect the relevant implementation;
3. inspect nearby tests;
4. inspect relevant architecture or feature documentation;
5. identify dependencies and affected layers;
6. describe the current behavior;
7. propose an implementation plan;
8. identify risks and edge cases;
9. define validation steps;
10. state what will not be changed.

The planning stage must not modify files.

A useful plan should identify concrete files, modules, symbols, commands, or application flows whenever the repository supports that level of certainty.

Generic plans that do not reflect the repository should be rejected or revised.

### Planning output

The expected output is:

```text
Objective

Current behavior

Proposed scope

Non-goals

Relevant files and layers

Implementation steps

Risks and edge cases

Validation plan

Open questions
```

The `Open questions` section may be omitted when no material ambiguity remains.

## Stage 3: implementation

Implementation begins only after the scope is understood and, when requested, the plan has been approved.

The implementation agent should:

1. inspect the current state of the relevant files;
2. implement only the approved behavior;
3. preserve existing architectural boundaries;
4. avoid unrelated refactoring;
5. evaluate Windows and Linux behavior where applicable;
6. run the narrowest relevant existing validations;
7. report all changed files;
8. suggest a Conventional Commit message.

Implementation must not silently include:

* new tests;
* documentation updates;
* translation updates;
* changelog entries;
* release notes;
* version bumps;
* dependency upgrades;
* workflow restructuring.

These may be included only when explicitly part of the approved task.

### Implementation commit

After manual review, the repository owner creates the implementation commit.

Typical commit types include:

```text
feat(scope): add new behavior
fix(scope): correct existing behavior
refactor(scope): restructure implementation without changing behavior
perf(scope): improve runtime performance
```

The agent only suggests the message. It does not execute the commit.

## Stage 4: manual implementation validation

The repository owner validates the implementation before creating or requesting tests.

Manual validation may include:

* verifying the user interface;
* testing application flows;
* reproducing the original problem;
* checking behavior on Windows;
* checking behavior on Linux;
* inspecting process or filesystem integration;
* verifying toolchain behavior;
* checking visual consistency;
* evaluating whether the implementation matches the approved scope.

Problems found during validation return the task to the implementation stage.

The implementation commit should represent behavior considered acceptable before the dedicated test stage begins.

## Stage 5: tests

The testing stage starts from an existing implementation.

The test agent should:

1. inspect the implementation or relevant diff;
2. inspect existing test conventions;
3. identify important scenarios;
4. add focused tests;
5. execute the relevant test commands;
6. run coverage when useful;
7. report uncovered or difficult-to-test behavior;
8. avoid rewriting production code without necessity;
9. suggest a `test(...)` commit message.

Relevant scenarios may include:

* expected successful behavior;
* invalid input;
* missing tools or files;
* operating-system errors;
* empty states;
* boundary conditions;
* regression cases;
* platform-specific behavior;
* asynchronous failures;
* state synchronization;
* IPC failures.

Tests should validate behavior rather than implementation details whenever practical.

### Production changes during testing

A test task may modify production code only when a small change is strictly required for testability.

Such a change must be:

* minimal;
* behavior-preserving;
* clearly reported;
* included in the scope of the test commit only when appropriate.

Substantial production changes should return to the implementation stage.

### Test commit

Typical message:

```text
test(scope): cover relevant behavior
```

The repository owner validates and creates the commit manually.

## Stage 6: technical review

The review stage is read-only by default.

The review agent should compare the completed work with:

* the original task;
* the approved plan;
* the implementation;
* the tests;
* relevant project conventions;
* cross-platform expectations.

The review should prioritize:

1. correctness;
2. regressions;
3. data loss or destructive behavior;
4. platform incompatibilities;
5. incorrect architectural boundaries;
6. missing error handling;
7. missing tests;
8. accessibility problems;
9. unnecessary complexity;
10. out-of-scope changes.

Review findings should be concrete and actionable.

Each finding should include:

* severity;
* file and location;
* observed issue;
* practical consequence;
* recommended correction.

Suggestions based only on personal style should not be presented as defects.

If fixes are required, they should return to the appropriate implementation or testing stage and receive their own commit when meaningful.

## Stage 7: documentation

Documentation is updated after behavior is stable.

The documentation stage should determine which sources actually require changes.

Possible targets include:

* `README.md`;
* translated READMEs;
* `docs/development/`;
* `docs/architecture/`;
* `docs/features/`;
* `docs/decisions/`;
* `KNOWN_ISSUES.md`;
* examples and command references.

Not every code change requires README changes.

Documentation should describe confirmed behavior, not intentions or implementation assumptions.

### Documentation commit

Typical messages include:

```text
docs(readme): update feature overview
docs(architecture): document application flow
docs(feature): describe toolchain detection
docs(development): update testing instructions
```

## Stage 8: translations

Translation work remains separate when it involves application locale files, translated READMEs, or localized release notes.

The translation stage should:

1. identify the authoritative source language;
2. inspect existing terminology;
3. compare supported locale keys or sections;
4. preserve placeholders and interpolation;
5. translate only confirmed behavior;
6. report ambiguous source wording;
7. verify key synchronization.

Translation changes may be committed separately from general documentation when that improves review and traceability.

Typical messages include:

```text
i18n(settings): add toolchain status translations
docs(i18n): synchronize translated readmes
```

## Stage 9: changelog and release notes

The changelog and release notes are updated when the change is intended for a release.

They serve different purposes:

* `CHANGELOG.md` records versioned technical and user-relevant changes;
* in-application release notes provide concise localized summaries;
* the GitHub Release body may be generated from the changelog.

Changelog entries should:

* use the repository's existing format;
* describe externally relevant changes;
* avoid exposing unnecessary implementation details;
* avoid promising unfinished work;
* use the target version only when it is known.

Release notes should be shorter and written for users rather than maintainers.

Typical commit messages include:

```text
docs(changelog): add version 2026.4.0 changes
docs(release): add version 2026.4.0 release notes
```

These may remain separate when they represent distinct review stages.

## Stage 10: version preparation

Version preparation occurs only when the target release is approved.

The release agent should first perform a read-only check and identify:

* the current version;
* the intended next version;
* all version-bearing files;
* relevant scripts;
* changelog readiness;
* release-note readiness;
* translation consistency;
* test commands;
* workflow expectations;
* working-tree state.

Version changes should use the existing repository scripts and conventions whenever possible.

The agent must not assume which files require changes without inspecting the current repository.

### Version commit

Typical message:

```text
chore(release): bump version to 2026.4.0
```

This commit should contain only the approved version preparation changes.

## Stage 11: manual Git and release operations

The repository owner performs all final Git and release operations.

These may include:

1. reviewing the working tree;
2. creating commits;
3. creating or switching branches;
4. merging;
5. creating the release tag;
6. pushing commits and tags;
7. monitoring GitHub Actions;
8. publishing or editing the GitHub Release;
9. validating generated artifacts;
10. verifying updater behavior.

Agents must not perform these operations unless a specific operation is explicitly requested in the current task.

A request to prepare a release is not permission to create a tag, push, or publish.

## Reduced workflow for small changes

Small, low-risk changes may use:

```text
implementation
→ validation
→ tests when relevant
→ commit
```

Examples may include:

* correcting a typo;
* adjusting an isolated style;
* fixing a simple translation;
* updating a broken link;
* changing a narrowly scoped configuration value.

A reduced workflow does not remove the requirements to:

* respect scope;
* inspect the relevant source;
* avoid unrelated changes;
* run proportional validation;
* preserve Git control.

## Branch strategy

Branches are optional for normal development.

Direct work on the main branch is acceptable when:

* the change is small or moderate;
* the scope is well understood;
* the working state remains manageable;
* partial work will not block other development;
* the repository owner prefers direct progression.

A separate branch is recommended when:

* the change is a large restructuring;
* multiple architectural areas are affected;
* the work will span a long period;
* the repository may remain temporarily broken;
* experimental alternatives must be compared;
* the change is difficult to revert partially.

Agents must not create or switch branches automatically.

## Pull requests

Pull requests are not mandatory.

They may be useful for:

* large restructuring;
* external contributions;
* reviewable experiments;
* comparison of a large branch with the main branch;
* GitHub-specific review tools;
* validating workflows triggered by pull requests.

The absence of a pull request does not reduce the need for tests, review, or clear commits.

Workflows must not depend exclusively on pull-request comments or pull-request-only reporting.

## Commit strategy

Commits should reflect actual development stages.

A typical feature history may be:

```text
feat(settings): add toolchain status page

test(settings): cover toolchain detection states

docs(readme): update settings feature overview

i18n(settings): add toolchain status translations

docs(changelog): add version 2026.4.0 changes

chore(release): bump version to 2026.4.0
```

Not every feature requires all of these commits.

Commits should not be split artificially when changes cannot be reviewed or reverted independently.

Likewise, meaningful stages should not be combined merely to produce a shorter history.

Squashing is not required.

## Task tracking

Use the appropriate source for each kind of information:

* GitHub Issues: actionable bugs, features, research, maintenance, and documentation work;
* GitHub Projects: status, priority, area, target, and progress;
* `docs/roadmap/`: strategic direction and longer-term themes;
* `docs/architecture/`: current architecture;
* `docs/decisions/`: significant decisions and their consequences;
* prompts: temporary task instructions;
* commits: completed repository history.

Do not duplicate the full backlog in the repository roadmap.

Not every small change requires an issue. An issue is most useful when the work:

* needs planning;
* may be interrupted;
* spans multiple stages;
* requires research;
* should remain visible in the backlog;
* represents a user-facing bug or feature;
* belongs to a future target;
* benefits from recorded acceptance criteria.

## Agent handoff

When one stage is handed to another agent or tool, provide only the context required for that stage.

Useful handoff material includes:

* task or issue;
* approved plan;
* relevant diff or commits;
* changed files;
* validation results;
* known limitations;
* unresolved findings.

Do not transfer an entire long conversation when the repository and a concise handoff provide the necessary context.

The receiving agent must verify repository state rather than assuming the handoff is perfectly current.

## Workflow exceptions

Exceptions are allowed when justified by the task.

Examples include:

* a bug fix that requires an immediate regression test;
* a documentation-only release;
* a refactor required before a small implementation;
* a testability change that touches production code;
* a security fix that requires an accelerated process.

When deviating from the standard workflow:

* state the reason;
* keep Git control with the repository owner;
* preserve focused commits where practical;
* do not use the exception to include unrelated work.
