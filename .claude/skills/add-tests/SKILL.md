---
name: add-tests
description: Add focused tests for existing Pascoal behavior or a completed change and report coverage or testability gaps.
argument-hint: "[behavior, diff, files, or regression]"
disable-model-invocation: true
---

# Add tests

Add tests for:

$ARGUMENTS

Pascoal's default workflow adds tests as a follow-up stage, after the user has manually validated the implemented behavior — not bundled with implementation. If it is unclear whether that validation happened yet, ask before proceeding rather than assuming.

## Procedure

1. Read `AGENTS.md` and `docs/development/testing.md`.
2. Inspect the implementation, relevant diff, and nearby test conventions.
3. Identify the smallest meaningful set of success, failure, boundary, platform, and regression scenarios.
4. Use the `testing` subagent when useful.
5. Add focused tests at the correct layer.
6. Modify production code only when a minimal behavior-preserving change is strictly required for testability.
7. Run the narrowest relevant command and expand validation only when justified.
8. Run coverage only when requested or materially useful.
9. Report remaining manual validation and environment limitations.

Do not activate or expand E2E testing unless explicitly requested.

## Output

Report scenarios covered, files changed, commands and actual results, coverage when collected, limitations, and one `test(...)` Conventional Commit suggestion.
