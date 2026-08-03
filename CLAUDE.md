# CLAUDE.md

@AGENTS.md

## Role

Claude Code is the primary tool for technical analysis, implementation, testing, investigation, and review in Pascoal.

Use the repository as the source of truth. Do not rely on previous conversation context when the current repository can provide the required information.

## Context discipline

Keep the active context focused on the current task.

* Start from the task description and the closest relevant files.
* Prefer targeted searches over broad repository exploration.
* Inspect related code, tests, configuration, and documentation only when needed.
* Expand the investigation when dependencies or architectural boundaries require it.
* Do not repeatedly read unchanged files without a concrete reason.
* Do not load complete directories or large documents merely for general context.

Detailed procedures should remain in skills and project documentation rather than this file.

## Before changing files

For substantial or cross-cutting work:

1. confirm the requested objective;
2. inspect the current implementation and nearby tests;
3. identify the affected layers;
4. present a concise, repository-specific plan;
5. identify material risks or ambiguities;
6. wait for approval when the task is planning-only or approval was requested.

Small and explicit corrections may be applied directly when no separate planning stage was requested.

Never implement during a planning-only task.

## Repository navigation

Use the current repository structure rather than memorized paths.

When locating behavior, search using concrete identifiers such as:

* symbols;
* component names;
* Tauri commands;
* translation keys;
* test descriptions;
* visible application text;
* configuration values.

Follow imports and call sites only as far as necessary to understand the affected behavior.

Before executing a command, verify it in the current repository configuration.

## Skills

Use a project skill under `.claude/skills/` when its procedure matches the task.

Skills may define workflows for:

* feature planning;
* implementation;
* testing;
* review;
* documentation;
* translation;
* coverage analysis;
* release preparation.

Follow each skill's scope, allowed files, prohibited files, validations, and response format.

A skill does not override `AGENTS.md`, especially its Git and safety rules.

When no matching skill exists, follow `AGENTS.md` and the relevant project documentation directly. Do not invent or claim to have executed an unavailable skill.

## Subagents

Use specialized subagents when delegation provides useful domain expertise or keeps temporary exploration out of the main context.

Delegate a bounded objective with:

* the expected result;
* relevant starting points;
* scope restrictions;
* required validations;
* expected output.

Do not delegate the same work to multiple agents without a concrete reason.

The main agent remains responsible for:

* coordinating the task;
* preserving scope;
* resolving conflicting findings;
* validating the combined result;
* presenting the final response.

## Editing

Before introducing a new abstraction or file, inspect the closest existing pattern.

When editing:

* preserve surrounding conventions;
* keep diffs focused;
* avoid unrelated formatting;
* avoid speculative extension points;
* do not rewrite working code solely by preference;
* do not suppress warnings or weaken tests;
* do not modify generated output when its source can be changed;
* do not expand the task into documentation, tests, translations, or release work unless requested.

Detailed stage boundaries are defined in:

```text
docs/development/workflow.md
```

## Validation

Run the narrowest relevant validation first and expand only when the affected scope requires it.

Testing guidance is defined in:

```text
docs/development/testing.md
```

Do not claim a command passed unless it completed successfully.

When validation fails:

1. inspect the actual error;
2. determine whether it comes from the change, environment, or existing repository state;
3. avoid unrelated changes intended only to silence the failure;
4. report unresolved failures and remaining manual checks.

Do not install system dependencies or modify global configuration without explicit permission.

## Git

The Git policy in `AGENTS.md` is mandatory.

Do not infer permission to commit, amend, push, pull, merge, rebase, switch branches, create branches, create tags, discard changes, or publish releases.

Suggest the appropriate Conventional Commit message without executing it.

## Final response

Follow the response format defined in `AGENTS.md`.

Keep the report proportional to the task. Report useful outcomes, validations, limitations, and out-of-scope findings rather than narrating every inspected file or internal reasoning step.
