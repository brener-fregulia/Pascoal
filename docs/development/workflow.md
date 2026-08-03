# Development Workflow

## Purpose

This document defines the standard development workflow for Pascoal.

Pascoal is primarily maintained by a single developer. The process should preserve control, traceability, and clear development stages without introducing mandatory pull requests, branches, squash merges, or team ceremonies.

Shared agent rules, including Git restrictions, are defined in `AGENTS.md`.

Testing details are defined in:

```text
docs/development/testing.md
```

## Principles

The workflow follows these principles:

* the repository is the permanent source of project context;
* the repository owner controls all Git operations;
* development stages remain separate when they represent independently reviewable work;
* commits should reflect meaningful stages;
* direct development on the main branch is acceptable;
* branches and pull requests are optional;
* automation should reduce repetitive work without removing manual control;
* agents should receive only the context required for the current stage.

## Standard stages

A complete change may pass through:

1. task definition;
2. planning;
3. implementation;
4. manual validation;
5. tests;
6. technical review;
7. documentation and translations;
8. changelog and release notes;
9. release preparation;
10. manual Git and publication.

Not every task requires every stage.

Small changes may use a reduced workflow when the risk and scope justify it.

## 1. Task definition

A task may originate from:

* a GitHub Issue;
* a GitHub Project item;
* a structured prompt;
* a bug report;
* a short planning document;
* an architectural question;
* an observed problem.

A useful task definition should include, when relevant:

* the problem;
* expected behavior;
* current behavior;
* affected area;
* constraints;
* non-goals;
* platform considerations;
* validation expectations.

The task does not need to be extensive. It only needs enough information to establish a concrete scope.

## 2. Planning

Planning is read-only.

The agent should:

1. inspect the relevant implementation;
2. inspect nearby tests and documentation;
3. describe the current behavior;
4. define the proposed scope;
5. identify non-goals;
6. identify affected files or layers;
7. propose implementation steps;
8. identify risks and edge cases;
9. define the validation strategy.

A useful plan should be repository-specific rather than a generic checklist.

Expected structure:

```text
Objective
Current behavior
Scope
Non-goals
Relevant files or layers
Implementation steps
Risks and edge cases
Validation
Open questions
```

`Open questions` may be omitted when no material ambiguity remains.

No files should be changed during a planning-only task.

## 3. Implementation

Implementation begins after the scope is understood and, when requested, the plan is approved.

The implementation agent should:

* inspect the current relevant files;
* implement only the approved behavior;
* preserve architectural boundaries;
* avoid unrelated refactoring;
* consider Windows and Linux where applicable;
* execute relevant existing validation;
* report changed files;
* suggest one Conventional Commit message.

Unless explicitly requested, implementation must not include:

* new tests;
* documentation;
* translations;
* changelog entries;
* release notes;
* version changes;
* dependency upgrades;
* workflow restructuring.

Existing tests may be executed during implementation.

After review, the repository owner creates the implementation commit manually.

Typical commit types:

```text
feat(scope): add behavior
fix(scope): correct behavior
refactor(scope): restructure implementation
perf(scope): improve performance
```

## 4. Manual validation

Manual validation confirms that the implementation matches the intended behavior before the dedicated testing stage.

It may include:

* reproducing the original problem;
* validating the user interface;
* checking editor behavior;
* testing files, processes, Git, or toolchains;
* checking Windows or Linux behavior;
* verifying visual consistency;
* confirming that the scope was respected.

Problems found during validation return to the implementation stage.

Agents should report any manual checks that still require the repository owner.

## 5. Tests

The testing stage starts from an existing implementation.

The testing agent should:

* inspect the implementation or relevant diff;
* inspect existing test conventions;
* identify important scenarios;
* add focused tests;
* execute relevant test commands;
* run coverage when useful or requested;
* report difficult-to-test behavior;
* suggest one `test(...)` commit message.

Production code may change only when a small behavior-preserving adjustment is strictly required for testability.

Substantial production changes return to the implementation stage.

Testing procedures and the current E2E status are defined in:

```text
docs/development/testing.md
```

After validation, the repository owner creates the test commit manually.

Example:

```text
test(toolchain): cover compiler detection states
```

## 6. Technical review

Technical review is read-only by default.

The reviewer should compare the completed work with:

* the original task;
* the approved plan;
* the implementation;
* the tests;
* project conventions;
* platform expectations.

The review should prioritize:

1. correctness;
2. regressions;
3. destructive or unsafe behavior;
4. cross-platform problems;
5. architectural inconsistencies;
6. missing error handling;
7. missing tests;
8. accessibility problems;
9. unnecessary complexity;
10. out-of-scope changes.

Findings should include:

* severity;
* file or location;
* concrete issue;
* practical consequence;
* recommended correction.

Verified defects must be distinguished from optional suggestions.

Required corrections return to the appropriate implementation or testing stage.

## 7. Documentation and translations

Documentation is updated after behavior is stable.

Possible targets include:

* `README.md`;
* translated READMEs;
* `docs/development/`;
* `docs/architecture/`;
* `docs/features/`;
* `docs/decisions/`;
* `KNOWN_ISSUES.md`.

Not every implementation requires README changes.

Documentation must describe confirmed behavior rather than planned or assumed functionality.

Translations should remain synchronized with the authoritative source while preserving:

* keys;
* placeholders;
* interpolation;
* markup;
* existing terminology.

Documentation and translation work may use separate commits when that improves review and traceability.

Examples:

```text
docs(readme): update settings overview
docs(architecture): document toolchain flow
i18n(settings): add toolchain status translations
docs(i18n): synchronize translated readmes
```

## 8. Changelog and release notes

Changelog and release-note work begins when a change is intended for a release.

Their responsibilities differ:

* `CHANGELOG.md` records versioned changes;
* in-application release notes provide concise localized summaries;
* the GitHub Release body may be generated from the changelog.

Entries should:

* follow the existing repository format;
* describe completed behavior;
* avoid unnecessary internal details;
* avoid promising unfinished functionality;
* use a target version only when it is known.

Examples:

```text
docs(changelog): add version 2026.4.0 changes
docs(release): add version 2026.4.0 release notes
```

## 9. Release preparation

Release preparation begins only after the intended content is approved.

It should first verify:

* current and target versions;
* version-bearing files;
* version scripts;
* changelog readiness;
* release-note readiness;
* translation consistency;
* required tests;
* workflow expectations;
* working-tree state.

Files should only be changed when explicitly requested.

Version changes should use existing repository scripts and conventions.

Example:

```text
chore(release): bump version to 2026.4.0
```

The agent must not create a tag, push, or publish a release.

A dedicated release-process document may provide the detailed checklist.

## 10. Manual Git and publication

The repository owner performs final Git and release operations, including:

* reviewing the working tree;
* creating commits;
* managing branches;
* creating the version tag;
* pushing commits and tags;
* monitoring GitHub Actions;
* reviewing generated artifacts;
* publishing or editing the GitHub Release;
* validating updater behavior.

Preparing a release does not grant an agent permission to perform these operations.

## Reduced workflow

Small, low-risk tasks may use:

```text
implementation
→ validation
→ tests when relevant
→ commit
```

Examples include:

* correcting a typo;
* updating an isolated translation;
* fixing a broken link;
* adjusting a small style;
* changing a narrow configuration value.

A reduced workflow still requires:

* repository inspection;
* scope control;
* proportional validation;
* preservation of Git control;
* a focused commit message.

## Branches

Branches are optional for normal development.

Direct work on the main branch is acceptable when:

* the scope is understood;
* the change is small or moderate;
* the working state remains manageable;
* the developer prefers direct progression.

A branch is useful when:

* the change is a large restructuring;
* multiple architectural areas are affected;
* work may remain temporarily unstable;
* alternatives need to be compared;
* partial reversal would be difficult.

Agents must not create or switch branches automatically.

## Pull requests

Pull requests are not mandatory.

They may be useful for:

* large restructuring;
* external contributions;
* experiments;
* reviewing a long-running branch;
* using GitHub review tools;
* validating pull-request workflows.

The absence of a pull request does not remove the need for tests, review, or clear commits.

Automation must not depend exclusively on pull-request comments.

## Commit strategy

Commits should represent actual development stages.

A feature may produce:

```text
feat(settings): add toolchain status page
test(settings): cover toolchain detection states
docs(readme): update settings overview
i18n(settings): add toolchain status translations
docs(changelog): add version 2026.4.0 changes
chore(release): bump version to 2026.4.0
```

Not every change requires all these commits.

Do not split inseparable work artificially, but do not combine independently reviewable stages merely to shorten history.

Squashing is not required.

## Task tracking

Use each source for its intended purpose:

* GitHub Issues: actionable work;
* GitHub Projects: status, priority, area, and progress;
* `docs/roadmap/`: strategic direction;
* `docs/architecture/`: current architecture;
* `docs/decisions/`: significant decisions;
* prompts: temporary task instructions;
* commits: completed history.

Not every small change needs an issue.

Issues are most useful when work:

* requires planning;
* may be interrupted;
* spans multiple stages;
* needs research;
* belongs to a future target;
* should remain visible in the backlog;
* benefits from acceptance criteria.

Do not duplicate the full backlog in the roadmap.

## Agent handoff

When transferring work between agents or tools, provide only the context needed for the next stage.

Useful handoff information includes:

* task or issue;
* approved plan;
* relevant diff or commits;
* changed files;
* validation results;
* known limitations;
* unresolved findings.

Do not transfer an entire long conversation when the repository and a concise handoff are sufficient.

The receiving agent must verify the current repository state.

## Exceptions

The workflow may be adjusted when the task justifies it.

Examples include:

* a bug fix that requires an immediate regression test;
* a documentation-only release;
* a refactor required before implementation;
* a testability change touching production code;
* an urgent security correction.

When deviating from the standard workflow:

* state the reason;
* preserve repository-owner Git control;
* keep changes focused;
* avoid unrelated work;
* preserve meaningful commit boundaries where practical.
