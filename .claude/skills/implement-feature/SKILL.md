---
name: implement-feature
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
3. If the request bundles more than one independently reviewable responsibility, break it into sub-items before writing any code. Implement and report one sub-item at a time — do not combine them into a single pass or commit unless the user explicitly asks for all of them together. Say up front which sub-item this run covers and which remain.
4. Use the `frontend` or `rust` subagent when domain isolation is useful; coordinate both for cross-layer work.
5. Implement only directly necessary behavior for the current sub-item.
6. Do not add tests. Testing is a separate stage, started via the `add-tests` skill only after the user has manually validated this behavior — do not add tests here even if they seem "directly necessary," unless the user explicitly asked for both together in this request. Small, directly necessary documentation updates may still be included when required for a correct deliverable.
7. Preserve architecture, unrelated behavior, user changes, and cross-platform support.
8. Run the narrowest relevant validation, then broaden only when justified.
9. Review the resulting changes for scope and unintended effects.

Do not change versions, changelog, release notes, dependencies, or workflows unless the task explicitly requires them.

## Output

Report summary, files changed, validation results, manual checks, out-of-scope findings, and one Conventional Commit suggestion scoped to this sub-item alone. List any remaining sub-items not covered by this run. When the result still naturally belongs in more than one commit, state the recommended boundaries without executing them.
