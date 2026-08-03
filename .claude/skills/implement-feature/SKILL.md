---
name: Implement feature
description: Implement an approved Pascoal feature, fix, or refactor with focused scope and proportional validation.
argument-hint: "[approved task or plan]"
disable-model-invocation: true
---

# Implement feature

Implement:

$ARGUMENTS

## Procedure

1. Read `AGENTS.md`, `CLAUDE.md`, and the relevant workflow documentation.
2. Confirm the requested result and inspect the current affected code.
3. Use the `frontend` or `rust` subagent when domain isolation is useful; coordinate both for cross-layer work.
4. Implement only directly necessary behavior.
5. Include directly necessary regression tests or small documentation updates when required for a correct deliverable, while keeping independently reviewable stages separate when practical.
6. Preserve architecture, unrelated behavior, user changes, and cross-platform support.
7. Run the narrowest relevant validation, then broaden only when justified.
8. Review the resulting changes for scope and unintended effects.

Do not change versions, changelog, release notes, dependencies, or workflows unless the task explicitly requires them.

## Output

Report summary, files changed, validation results, manual checks, out-of-scope findings, and one Conventional Commit suggestion for the work performed. When the result naturally belongs in separate commits, state the recommended boundaries without executing them.
