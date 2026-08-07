---
name: plan-feature
description: Produce a repository-specific, read-only plan for a Pascoal feature, fix, refactor, or investigation before implementation.
argument-hint: "[task, issue, or objective]"
disable-model-invocation: true
---

# Plan feature

Plan the following work without modifying files:

$ARGUMENTS

## Procedure

1. Read `AGENTS.md`, `CLAUDE.md`, and `docs/development/workflow.md`.
2. Inspect the closest relevant implementation, tests, configuration, and documentation.
3. Describe current behavior using repository evidence.
4. Define the required scope and explicit non-goals.
5. Identify affected layers, files, symbols, interfaces, and platform concerns.
6. Propose concrete implementation steps in dependency order.
7. Identify edge cases, regression risks, and directly necessary tests or documentation.
8. Define proportional validation.
9. Surface only material unresolved questions.

Do not edit files, create branches, or perform Git write operations.

## Output

Use:

- Objective
- Current behavior
- Scope
- Non-goals
- Relevant files and layers
- Implementation steps
- Risks and edge cases
- Validation plan
- Open questions, when necessary
