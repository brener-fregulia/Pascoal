# Development Workflow

## Purpose

This document defines the development workflow for Pascoal.

Pascoal is primarily maintained by one developer. The workflow should preserve control, traceability, and reviewable changes without requiring pull requests, branches, squash merges, or team ceremonies.

Mandatory safety, scope, and Git rules are in `AGENTS.md`. Test procedures are in `docs/development/testing.md`.

## Principles

- The repository is the permanent source of context.
- A task may include several directly necessary stages.
- Keep independently reviewable work separate when practical.
- Do not expand a task into unrelated work.
- Commits should represent meaningful, reversible changes.
- The repository owner performs Git and publication operations.
- Direct development on `main` is acceptable.
- Automation should reduce repetition without removing control.

## Workflow overview

A change may include:

| Stage | Purpose |
| --- | --- |
| Task definition | Establish the problem, result, and constraints |
| Planning | Understand current behavior and design the change |
| Implementation | Deliver the requested behavior |
| Manual validation | Confirm complete or native behavior |
| Testing | Protect behavior and regressions |
| Review | Find concrete defects and scope problems |
| Documentation and translation | Describe stable behavior |
| Release preparation | Prepare communication, versions, and checks |
| Git and publication | Record and publish the work |

Not every task requires every stage or a separate request for each one. A bug fix may include its regression test and an indispensable documentation correction. Keep the task focused and suggest separate commit boundaries when they improve review or reversal.

## 1. Task definition

A task may begin as an issue, Project item, prompt, bug report, planning note, architectural question, or observed regression.

Include only the context needed to establish scope:

- problem or objective;
- expected and relevant current behavior;
- constraints and non-goals;
- affected area or platform;
- validation expectations.

Small immediate changes do not require formal issues.

## 2. Planning

Planning is read-only when the request asks for a plan without implementation.

A useful plan should:

1. inspect relevant code, tests, configuration, and documentation;
2. describe current behavior;
3. define scope and non-goals;
4. identify affected files, layers, and data flow;
5. describe implementation steps;
6. identify risks, edge cases, and platform differences;
7. define validation and manual checks.

Recommended output:

```text
Objective
Current behavior
Scope and non-goals
Relevant files and layers
Implementation steps
Risks and edge cases
Validation
Open questions
```

Omit sections that add no value. Use verified repository details, not generic steps.

Implementation may follow immediately when the task requests planning and execution. A planning-only request must not modify files.

## 3. Implementation

Implement the requested behavior with the smallest coherent change.

- Inspect the current state before editing.
- Preserve established architecture and naming.
- Modify only required behavior and supporting code.
- Consider Windows and Linux where relevant.
- Run the narrowest useful existing validation.
- Report changed behavior, files, and remaining checks.

Directly necessary tests or documentation may be included. Avoid unrelated test expansion, documentation rewrites, translations, changelog entries, version changes, dependency upgrades, or workflow restructuring.

When implementation, tests, or documentation remain independently reviewable, suggest separate commits:

```text
feat(settings): add toolchain status page
test(settings): cover toolchain detection states
docs(settings): document toolchain status behavior
```

Do not create the commits.

## 4. Manual validation

Use manual validation where automated tests do not fully represent behavior, especially for:

- complete application flows;
- layout, responsiveness, keyboard use, and CodeMirror interactions;
- native dialogs, filesystems, processes, Git, and toolchains;
- Windows and Linux differences;
- preservation of unrelated behavior and user changes.

Report what was checked and what remains for the repository owner. Do not claim that the owner completed a check.

Problems return to the relevant implementation or testing work.

## 5. Testing

Testing may be part of implementation or a dedicated follow-up.

- Inspect the behavior and nearby tests.
- Add focused success, failure, boundary, and regression cases.
- Follow existing test patterns.
- Avoid production changes unless a small behavior-preserving adjustment is required for testability.
- Run relevant commands and report actual results.
- Identify remaining manual checks or difficult-to-test behavior.

Substantial production changes discovered during testing are implementation work and should remain independently reviewable when practical.

Commands, prerequisites, isolation, coverage, and E2E status are documented in `docs/development/testing.md`.

Typical commit:

```text
test(toolchain): cover compiler detection states
```

## 6. Technical review

Review is read-only unless corrections are also requested.

Compare the work with its task, accepted scope, current architecture, tests, validation, supported platforms, and preservation of unrelated behavior.

Prioritize:

1. destructive behavior, data loss, or security problems;
2. correctness and regressions;
3. cross-platform failures;
4. architectural boundary violations;
5. missing error handling or validation;
6. missing tests or accessibility behavior;
7. unnecessary complexity with real maintenance cost;
8. out-of-scope changes.

Each finding should state its location, issue, consequence, and recommended correction. Separate verified defects from optional suggestions. Avoid preference-only rewrites.

## 7. Documentation and translation

Update documentation only when behavior is stable enough to describe accurately.

| Source | Responsibility |
| --- | --- |
| `README.md` | Public overview, setup, downloads, and links |
| Translated READMEs | Localized public overview |
| `docs/development/` | Development processes |
| `docs/architecture/` | Current architecture |
| `docs/decisions/` | Significant decisions |
| `docs/features/` | Detailed feature behavior |
| `KNOWN_ISSUES.md` | Confirmed limitations |

Not every code change requires documentation.

Translations must preserve keys, placeholders, interpolation, markup, structure, and established terminology. Report ambiguous source text instead of guessing.

Documentation and translation may share a task when directly related. Suggest separate commits when they have distinct review concerns.

```text
docs(readme): update settings overview
i18n(settings): add toolchain status translations
```

## 8. Changelog and release notes

Update release communication only for completed work intended for a release.

- `CHANGELOG.md` records versioned changes in the existing format.
- In-application release notes provide concise, localized summaries.
- The GitHub Release body may be generated from the changelog.

Describe completed behavior, avoid unnecessary implementation detail, and use a version only when the target is known.

```text
docs(changelog): add version 2026.4.0 changes
docs(release): add version 2026.4.0 release notes
```

## 9. Release preparation

Start with a read-only check of:

- current and target versions;
- version-bearing files and scripts;
- changelog, release notes, and translations;
- required tests and environment prerequisites;
- release workflow expectations;
- working-tree state and unrelated changes.

Update release files only when requested, using verified repository scripts and conventions.

```text
chore(release): bump version to 2026.4.0
```

The repository owner creates commits and tags, pushes, monitors workflows, reviews artifacts, publishes the release, and validates updater behavior.

## Reduced workflow

A small, low-risk task may use:

```text
implementation
→ proportional validation
→ directly relevant tests when needed
→ documentation only when necessary
→ suggested commit boundary
```

This does not remove repository inspection, scope control, honest validation, preservation of user changes, or Git restrictions.

## Branches and pull requests

Branches are optional. Direct work on `main` is acceptable when scope is understood and the working state remains manageable.

Use a branch when work is a large restructuring, affects several architectural areas, may remain unstable, compares alternatives, or is difficult to reverse partially.

Pull requests are also optional. They may help with external contributions, large branches, experiments, GitHub review tools, or PR workflow validation.

Automation must not depend exclusively on PR comments because normal development may use direct pushes.

Agents do not create, switch, merge, or publish branches or pull requests without the authorization required by `AGENTS.md`.

## Commit strategy

Commits should reflect actual development stages, not an arbitrary number of files or prompts.

A feature may produce:

```text
feat(settings): add toolchain status page
test(settings): cover toolchain detection states
docs(readme): update settings overview
i18n(settings): add toolchain status translations
docs(changelog): add version 2026.4.0 changes
chore(release): bump version to 2026.4.0
```

Not every change needs every commit. Do not split inseparable work artificially or combine independently reviewable work merely to shorten history. Squashing is not required.

## Task tracking

- GitHub Issues: actionable bugs, features, research, maintenance, and documentation.
- GitHub Projects: status, priority, area, target, and progress.
- `docs/roadmap/`: strategic direction, not a duplicate backlog.
- `docs/architecture/`: current architecture.
- `docs/decisions/`: significant decisions.
- Prompts: temporary task instructions.
- Commits: completed history.

Use an issue when work needs planning, may be interrupted, spans stages, requires research, belongs to a future target, or benefits from acceptance criteria. Small immediate changes may remain outside Issues.

## Agent handoff

Provide only what the next agent needs:

- task and accepted scope;
- relevant plan, diff, commits, or changed files;
- validation results;
- limitations and unresolved findings.

Do not transfer a long conversation when the repository and a concise handoff are sufficient. The receiving agent must verify current repository state.

## Exceptions

Adapt the workflow when required, such as for an urgent security fix, regression test delivered with a bug fix, documentation-only release, or testability change.

State the reason, preserve focused reviewable changes where practical, and do not include unrelated work.
