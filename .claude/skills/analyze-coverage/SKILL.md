---
name: analyze-coverage
description: Generate and interpret Pascoal frontend or Rust coverage without changing thresholds or production code by default.
argument-hint: "[frontend, rust, files, or objective]"
disable-model-invocation: true
---

# Analyze coverage

Analyze coverage for:

$ARGUMENTS

## Procedure

1. Read `AGENTS.md` and `docs/development/testing.md`.
2. Verify current coverage scripts and required tooling.
3. Run only the requested or relevant frontend and Rust coverage commands.
4. Inspect totals and important uncovered branches, error paths, shared logic, and platform-sensitive behavior.
5. Distinguish low-value generated or boundary code from meaningful gaps.
6. Recommend focused tests rather than chasing a percentage.
7. Do not change thresholds, production code, tests, or workflow configuration unless explicitly requested.

Frontend and Rust coverage remain separate metrics.

## Output

Report commands, actual results, significant uncovered behavior, limitations of the report, recommended test priorities, and whether threshold or workflow work is justified. Omit a commit suggestion when no files changed.
