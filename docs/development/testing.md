# Testing

## Purpose

This document is the operational testing reference for Pascoal.

It defines active layers, commands, prerequisites, isolation, test selection, coverage, limitations, and result reporting. `package.json`, Cargo configuration, test configuration, and workflows remain authoritative.

General safety and validation rules are in `AGENTS.md`. Workflow guidance is in `docs/development/workflow.md`.

## Principles

- Test observable Pascoal behavior, not dependency internals.
- Run the narrowest relevant tests first.
- Add reliable regression tests for reproducible bugs.
- Keep frontend, Rust, and real-toolchain behavior in the appropriate layer.
- Consider Windows and Linux when platform behavior changes.
- Use isolated, deterministic test data.
- Treat coverage as a diagnostic signal, not proof of correctness.
- Use manual validation where automation is insufficient.

## Current commands

The current `package.json` defines:

| Command | Behavior |
| --- | --- |
| `npm run test:frontend` | Runs Vitest once from `src/` |
| `npm run test:frontend:watch` | Runs Vitest in watch mode |
| `npm run test:frontend:coverage` | Runs frontend tests with V8 coverage |
| `npm run test:rust` | Runs `cargo test --lib` from `src-tauri/` |
| `npm run test:rust:coverage` | Runs `cargo llvm-cov --lib --html` |
| `npm run test:pascal` | Runs the `pascal_runner` Rust integration test |
| `npm test` | Runs frontend, Rust library, and Pascal integration tests sequentially |
| `npm run test:e2e` | Invokes WebdriverIO; see **E2E status** |

Verify commands before use because configuration may change. `npm test` currently excludes coverage and E2E.

## Prerequisites

### Frontend

- Node.js and dependencies installed from the repository lockfile;
- the frontend test environment configured by the project.

### Rust

- the repository's Rust toolchain;
- platform build dependencies required by the tested code or environment.

### Rust coverage

- `cargo-llvm-cov` installed;
- compatible Rust instrumentation support.

The package command currently generates HTML only. Other formats require an explicit command or workflow change.

### Pascal integration

- Free Pascal Compiler installed and discoverable;
- permission to create and execute temporary artifacts.

When a prerequisite is missing, run narrower applicable tests and report the unavailable command and remaining checks.

## Active test layers

The active strategy consists of frontend tests, Rust library tests, Pascal integration tests, and manual desktop validation.

### Frontend tests

Use frontend tests for:

- Svelte components;
- TypeScript modules, utilities, state, and stores;
- CodeMirror integration and editor behavior;
- frontend validation and error states;
- mocked frontend boundaries to Tauri commands.

Prefer user-observable assertions: rendered state, interactions, loading, empty, disabled and error states, keyboard behavior, and accessibility attributes.

Do not reproduce dependency test suites or rely on incidental markup, generated classes, or private implementation details.

### Rust tests

Use Rust tests for:

- Tauri backend logic, services, and state;
- parsing, validation, paths, and configuration;
- filesystem and process integration;
- toolchain and Git integration;
- backend response and error mapping.

Tauri command tests should cover the application boundary: input, state, service invocation, output, serialization, and error mapping. Test lower-level logic in its own layer when possible.

### Pascal integration tests

Use Pascal integration tests when correctness depends on the real compiler or executable flow:

- compiler discovery and invocation;
- arguments, compilation results, and diagnostics;
- executable invocation and runtime output;
- temporary artifact creation and cleanup.

Do not replace the real integration with mocks when the integration itself is under test.

## E2E status

End-to-end testing is paused.

The repository contains a command and preliminary infrastructure, but E2E is not required for normal implementation, CI, coverage, release preparation, or a complete local test run.

Do not expand, activate, or require it unless a task specifically resumes E2E work. Validate complete desktop flows manually in the meantime.

Before activation, define supported platforms, build mode, isolation, setup and teardown, prerequisites, reliability, CI execution, artifacts, and critical flows.

## Selecting tests

| Change | Minimum relevant validation |
| --- | --- |
| Frontend utility, state, component, or editor behavior | Relevant frontend tests |
| Rust service, parser, state, or backend behavior | Relevant Rust tests |
| Frontend and Tauri contract | Relevant frontend and Rust tests |
| Compiler or Pascal execution | Rust and Pascal integration tests when FPC is available |
| Shared or cross-cutting behavior | All affected active layers |
| Platform-specific behavior | Affected platform and evaluation of the other supported platform |
| Documentation only | Verify commands, paths, links, examples, and terminology |

Run broader suites for shared code, IPC contracts, common state, filesystem or process behavior, or changes across several domains.

Use `npm test` when the full active aggregate suite is justified and prerequisites are available.

## Designing tests

Inspect the implementation and nearby tests before adding cases.

Relevant scenarios may include:

- expected success;
- invalid or empty input;
- missing files, directories, executables, or permissions;
- malformed external output or process failure;
- repeated invocation or stale asynchronous state;
- Unicode and paths containing spaces;
- Windows and Linux differences;
- cleanup after success or failure;
- the exact condition of a regression.

Select only scenarios that represent actual behavior and risk.

Test names should state the condition and result, such as `returns an unavailable status when the compiler cannot be found`, rather than `handles error`.

## Regression tests

A regression test should reproduce the original failure, assert expected behavior, and avoid unrelated implementation details. It should fail against the defective behavior when practical.

When no active layer can represent the regression reliably, document the reason and required manual validation. Do not activate an inactive layer solely for one unrelated regression.

## Isolation and test data

Tests must not modify or depend on:

- real user projects or personal directories;
- user Git configuration or repositories;
- non-isolated application settings;
- installed toolchains except in explicit integration tests;
- credentials, network services, or mutable external state.

Use temporary directories, deterministic fixtures, and platform-safe path APIs. Preserve Unicode and spaces, and clean up created resources.

Mocks and fakes are appropriate at boundaries such as Tauri invocation, filesystem adapters, process execution, Git, compiler execution, or timing. Do not mock the behavior under test.

## Production changes for testability

Tests may require a small behavior-preserving production change, such as extracting deterministic logic or separating parsing from process execution. Report it clearly.

Substantial redesign is implementation work and should remain independently reviewable when practical.

## Coverage

Current commands:

```text
npm run test:frontend:coverage
npm run test:rust:coverage
```

Use coverage to inspect weak error paths, branches, shared logic, state transitions, and platform-specific behavior.

Keep frontend and Rust coverage separate because their tools, scopes, and metrics differ.

Initial GitHub Actions reporting should prefer:

- `GITHUB_STEP_SUMMARY`;
- downloadable HTML reports;
- machine-readable LCOV or Cobertura reports when configured;
- separate frontend and Rust artifacts.

An external service is optional. Adopt one only when history, badges, commit comparison, or changed-code coverage justifies it.

### Thresholds

Do not choose arbitrary thresholds.

1. verify a stable baseline and included files;
2. inspect important uncovered paths;
3. choose conservative initial values;
4. prevent meaningful regression;
5. raise thresholds gradually when justified.

Do not lower a threshold merely to pass a workflow. Changed-code coverage is not an initial requirement.

## Manual validation

Manual validation is important for layout, responsiveness, keyboard and CodeMirror behavior, native windows and dialogs, filesystem and process integration, Git and toolchains, complete desktop flows, and platform differences.

Report separately automated tests, manual checks performed by the agent, and checks remaining for the repository owner.

## Handling failures

1. Reproduce the failure with the narrowest useful command.
2. Determine whether it comes from the change, environment, missing prerequisite, platform, flaky behavior, or existing repository state.
3. Correct the current change when responsible.
4. Report unresolved and unrelated failures.

Do not delete, skip, weaken, retry, or extend timeouts without understanding and documenting the cause.

## Reporting results

Report:

- behavior and scenarios covered;
- test and production files changed;
- commands executed and actual results;
- coverage results when collected;
- missing prerequisites or environment limits;
- manual validation completed and remaining;
- a suggested Conventional Commit message when tests remain independently reviewable.

```text
test(toolchain): cover compiler detection states
```

## Current limitations

- Complete desktop flows depend primarily on manual validation.
- Pascal integration tests require FPC.
- Rust coverage requires `cargo-llvm-cov` and currently produces HTML through the package command.
- GitHub Actions does not yet have a dedicated coverage workflow.
- CI runs frontend tests on Ubuntu and Rust library tests on Ubuntu and Windows; Pascal integration is not currently in CI.
- Windows and Linux do not yet have identical automated coverage.

Treat these as current constraints, not completed future infrastructure.
