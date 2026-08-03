# Testing

## Purpose

This document defines the active testing strategy for Pascoal.

It covers:

* the current test layers;
* when each test command should be used;
* how test scope should be selected;
* the current status of E2E testing;
* the role of coverage;
* how validation results should be reported.

The repository configuration remains the source of truth for exact commands and behavior. Always verify `package.json`, Cargo configuration, test configuration, and workflows before relying on this document.

## Principles

Testing in Pascoal should remain proportional to the change.

* Test observable project behavior rather than library internals.
* Run the narrowest relevant tests first.
* Add regression tests for reproducible bugs when practical.
* Keep frontend, Rust, and external-tool behavior in their appropriate test layers.
* Consider Windows and Linux when platform behavior is affected.
* Treat coverage as a diagnostic tool, not a target by itself.
* Do not claim that a test passed unless it was executed successfully.
* Automated tests complement, but do not replace, manual validation.

## Current commands

The repository currently defines test entry points such as:

```text
npm run test:frontend
npm run test:frontend:watch
npm run test:frontend:coverage
npm run test:rust
npm run test:rust:coverage
npm run test:pascal
npm run test:e2e
npm test
```

Verify their current definitions in `package.json` before use.

The existence of a script does not necessarily mean that it is part of the active CI or release workflow.

## Active test layers

The active testing strategy currently includes:

* frontend tests;
* Rust tests;
* Pascal integration tests;
* manual application validation.

End-to-end testing is currently paused.

## Frontend tests

Use frontend tests for behavior implemented in:

* Svelte components;
* TypeScript modules;
* application state and stores;
* CodeMirror integrations;
* editor commands and utilities;
* frontend validation and error handling.

Relevant commands:

```text
npm run test:frontend
npm run test:frontend:watch
npm run test:frontend:coverage
```

`test:frontend:watch` is intended for interactive local development, not final validation or CI.

Frontend tests should focus on Pascoal-specific behavior. Do not reproduce tests for Svelte, CodeMirror, or other dependencies.

Component tests should prefer user-observable behavior, including:

* rendered states;
* interactions;
* loading, empty, disabled, and error states;
* keyboard behavior;
* accessibility attributes;
* state synchronization.

Avoid assertions that depend unnecessarily on internal component structure or fragile CSS selectors.

## Rust tests

Use Rust tests for behavior implemented in:

* Tauri backend logic;
* application services;
* state;
* filesystem and process integration;
* toolchain detection;
* Git integration;
* path handling;
* parsing and validation;
* backend error mapping.

Relevant commands:

```text
npm run test:rust
npm run test:rust:coverage
```

Tests that interact with the operating system must use isolated test data and must not modify:

* real user projects;
* user Git configuration;
* application settings;
* personal directories;
* installed toolchains.

Where behavior differs by platform, cover Windows and Linux where practical.

Tauri command tests should validate command boundaries, inputs, outputs, state access, and error mapping. Lower-level logic should normally be tested in the layer where it is implemented.

## Pascal integration tests

Use Pascal integration tests for behavior that requires the real Pascal toolchain, including:

* compiler detection;
* compiler invocation;
* arguments;
* compilation results;
* diagnostics;
* executable invocation;
* runtime output;
* temporary artifacts.

Relevant command:

```text
npm run test:pascal
```

These tests may require Free Pascal Compiler to be installed and available.

When FPC is unavailable:

* do not report the tests as passing;
* state that the command was not executed;
* report the missing prerequisite;
* run narrower tests that do not require FPC when useful.

Tests must use temporary files and must not depend on real user projects.

## Aggregate test command

The aggregate command is:

```text
npm test
```

Inspect its current definition before assuming which suites it includes.

It may depend on external tools such as FPC. Distinguish failures caused by missing environment requirements from product regressions.

## E2E status

End-to-end testing is currently paused.

The repository may contain an E2E command, preliminary configuration, dependencies, or existing experiments. These do not make E2E an active requirement.

E2E tests are currently not required for:

* normal implementation tasks;
* the dedicated testing stage;
* CI;
* coverage reporting;
* release preparation;
* the definition of a complete local test run.

Agents must not modify, expand, activate, or require E2E infrastructure unless the task explicitly concerns E2E testing.

While E2E remains paused, complete desktop application flows should be validated manually.

When E2E work resumes, its scope, supported platforms, isolation strategy, CI behavior, reliability expectations, and critical flows must be defined in a dedicated task.

## Selecting tests

Run tests according to the affected behavior.

### Frontend-only change

Run the relevant frontend tests.

### Rust-only change

Run the relevant Rust tests.

### Frontend and backend change

Run both frontend and Rust tests.

### Compiler or Pascal execution change

Run Rust tests and Pascal integration tests when FPC is available.

### Platform-specific change

Run tests on the affected operating system and evaluate whether the other supported platform also requires validation.

### Documentation-only change

Code tests are normally unnecessary. Verify:

* paths;
* command names;
* examples;
* links;
* terminology;
* consistency with repository configuration.

Broader suites are appropriate when shared code, IPC contracts, common state, filesystem behavior, or multiple architectural areas are affected.

## Adding tests

A test task should:

1. inspect the implemented behavior or relevant diff;
2. inspect nearby test conventions;
3. identify the important success, failure, boundary, and regression scenarios;
4. add focused tests;
5. run the narrowest relevant command;
6. expand validation only when justified;
7. report remaining manual checks;
8. suggest one `test(...)` Conventional Commit message.

Useful scenarios may include:

* successful behavior;
* invalid or empty input;
* missing file or executable;
* malformed external output;
* process failure;
* permission failure;
* repeated invocation;
* stale asynchronous state;
* Unicode;
* paths containing spaces;
* Windows and Linux differences;
* cleanup after failure.

Only include scenarios relevant to the changed behavior.

## Regression tests

A reproducible bug should receive a regression test when an active test layer can represent it reliably.

The test should:

* reproduce the original failure;
* validate the expected behavior;
* avoid depending on unrelated implementation details;
* fail against the defective implementation when practical.

When automated coverage is not practical, report the reason and describe the necessary manual validation.

Do not create or expand E2E infrastructure only to cover one regression while E2E remains paused.

## Production changes during testing

A testing task may modify production code only when a small behavior-preserving change is required for testability.

Examples include:

* extracting deterministic logic;
* introducing an existing dependency through a testable boundary;
* separating parsing from process execution.

The change must be minimal and clearly reported.

Substantial production changes must return to the implementation stage.

## Coverage

Coverage is used to find weakly tested behavior, especially:

* error paths;
* branches;
* shared logic;
* critical state transitions;
* platform-specific behavior.

Current coverage commands include:

```text
npm run test:frontend:coverage
npm run test:rust:coverage
```

Verify their current output formats and requirements before use.

Frontend and Rust coverage should remain separate. Combining them into one percentage would require an explicit and justified methodology.

Initial coverage improvements should prefer native GitHub Actions features:

* `GITHUB_STEP_SUMMARY`;
* downloadable HTML reports;
* machine-readable reports such as LCOV or Cobertura;
* separate frontend and Rust artifacts.

An external coverage service is optional and should be adopted only when its historical reporting, badges, commit comparison, or changed-code coverage provides sufficient value.

## Thresholds

Do not introduce arbitrary coverage thresholds.

Before setting thresholds:

1. generate a stable baseline;
2. confirm which files are included;
3. inspect important uncovered paths;
4. define conservative values;
5. prevent meaningful regressions;
6. increase thresholds gradually when justified.

Do not reduce a threshold only to make a workflow pass without investigating the change.

Changed-code coverage is not an initial requirement.

## Manual validation

Manual validation remains important, especially for:

* visual behavior;
* responsive layout;
* CodeMirror interactions;
* keyboard behavior;
* native windows and dialogs;
* filesystem and process integration;
* Git and toolchain integration;
* complete application flows;
* behavior currently outside stable automated E2E coverage.

Agents must distinguish between:

* automated tests executed;
* static checks performed;
* manual checks they performed;
* manual checks still required from the repository owner.

Do not claim that the repository owner completed a manual validation.

## Handling failures

When a test fails:

1. inspect the actual error;
2. reproduce it with the narrowest command possible;
3. determine whether it comes from the current change, the environment, a missing dependency, platform behavior, or a pre-existing problem;
4. correct the current change when responsible;
5. report unresolved or unrelated failures clearly.

Do not delete, skip, weaken, retry, or increase the timeout of a failing test without understanding and justifying the underlying cause.

## Validation report

A testing task should report:

### Summary

What behavior was tested.

### Files changed

Test files and any strictly necessary production changes.

### Scenarios covered

The relevant success, failure, boundary, and regression cases.

### Validation

Commands executed and their actual results.

### Coverage

Coverage results when coverage was executed.

### Manual validation

Application behavior that still requires manual checking.

### Notes

Environment limitations, missing tools, platform gaps, or follow-up work.

### Suggested commit

One Conventional Commit message for the testing stage.

Example:

```text
test(toolchain): cover compiler detection states
```

## Current limitations

Current known limitations include:

* E2E testing is paused;
* complete desktop flows depend primarily on manual validation;
* Pascal integration tests require FPC;
* Rust coverage may require additional tooling;
* coverage reporting in GitHub Actions is not yet fully structured;
* Windows and Linux may not yet have identical automated coverage.

These limitations should guide future improvements without being treated as already implemented infrastructure.
