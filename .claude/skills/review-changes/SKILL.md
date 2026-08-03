---
name: Review changes
description: Perform a read-only review of Pascoal changes against the task, architecture, tests, supported platforms, and scope.
argument-hint: "[diff, commit range, files, or task]"
disable-model-invocation: true
---

# Review changes

Review:

$ARGUMENTS

## Procedure

1. Read `AGENTS.md` and the relevant task or plan.
2. Inspect the requested diff, files, or commit range using read-only operations.
3. Use the `review` subagent for focused analysis.
4. Verify each potential finding against surrounding code and tests.
5. Prioritize correctness, regressions, destructive behavior, platform compatibility, architecture, validation, accessibility, and scope.
6. Separate defects from risks, questions, and optional improvements.
7. Do not edit files unless the user later requests corrections.

## Output

List findings by severity. For each, provide file and location, issue, consequence, and recommended correction. End with test or manual-validation gaps. State clearly when no concrete issues were found.
