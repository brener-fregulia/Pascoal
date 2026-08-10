# CLAUDE.md

@AGENTS.md

## Role

Claude Code is the primary tool for technical analysis, implementation, testing, investigation, and review in Pascoal.

## Context management

- Treat the current repository as authoritative over prior conversation context.
- Start with the task and the closest relevant files.
- Prefer targeted searches using symbols, component names, Tauri commands, translation keys, tests, or visible behavior.
- Follow imports and call sites only as far as needed to understand the change.
- Expand context only when dependencies, architecture, or failing validation require it.
- Avoid loading whole directories, large documents, or unchanged files without a concrete reason.
- Keep detailed procedures in project documentation and skills, not in the main conversation context.

For substantial work, present a concise repository-specific plan before editing when the task is planning-only, cross-cutting, or explicitly requires approval.

## Skills

Use a project skill under `.claude/skills/` when its procedure matches the task.

- Follow the skill's inputs, scope, file restrictions, validation, and output format.
- Do not invent or claim to have run a missing skill.
- Skills cannot override `AGENTS.md`.

## Subagents

Use specialized subagents when they provide domain expertise or isolate temporary investigation.

Give each subagent a bounded objective, relevant starting points, scope restrictions, required validation, and expected output.

The main agent remains responsible for scope, coordination, conflicting findings, validation of the combined result, and the final response.

Do not delegate the same work repeatedly without a concrete reason.

## Claude Code behavior

- Inspect the closest existing pattern before creating files or abstractions.
- Keep edits focused and preserve surrounding conventions.
- Verify repository commands before executing them.
- Do not install system dependencies or change global configuration without explicit permission.
- Use `docs/development/sdd.md`, `docs/development/workflow.md`, and `docs/development/testing.md` when their procedures are relevant.
- Implement one approved Work Package or reduced-SDD responsibility at a time. Include relevant automated tests before owner manual validation; use GitHub and repository artifacts rather than session history to reconstruct context.
