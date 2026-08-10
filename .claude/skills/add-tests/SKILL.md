---
name: add-tests
description: Add focused Pascoal tests for existing behavior, regressions, missing coverage, or testability gaps.
argument-hint: "[behavior, diff, files, regression, or coverage gap]"
disable-model-invocation: true
---

# Add tests

Add tests for:

$ARGUMENTS

## Procedure

1. Read `AGENTS.md` and `docs/development/testing.md`.
2. Inspect the implementation, relevant diff, and nearby test conventions.
3. Identify the smallest meaningful success, failure, boundary, platform, and
   regression scenarios.
4. Use the `testing` subagent when useful.
5. Add focused tests at the correct layer.
6. Modify production code only when a minimal behavior-preserving change is
   strictly required for testability.
7. Run the narrowest relevant command and expand validation only when justified.
8. Run coverage only when requested or materially useful.
9. Report environment limits and remaining manual validation.

Do not activate or expand E2E testing unless explicitly requested.

This skill may be used independently for test backfills or gaps. During normal SDD
implementation, relevant tests are part of the Work Package's `In Progress` stage
and do not need to wait for owner manual validation.

## Output

Report scenarios covered, files changed, commands and actual results, coverage
when collected, limitations, and a concise Conventional Commit suggestion when
the test work is independently reviewable.
