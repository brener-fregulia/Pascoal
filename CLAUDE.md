# CLAUDE.md

@AGENTS.md

## Claude Code role

Claude Code is the primary implementation and technical analysis agent for Pascoal.

Use the repository as the source of truth. Inspect the relevant implementation, tests, configuration, scripts, workflows, and documentation before proposing or applying changes.

Do not rely on previous chat context when the repository can provide the required information.

## Context discipline

Keep the active context focused on the current task.

Do not inspect the entire repository for every request. Start from the task description and inspect only the files and documentation needed to understand the affected behavior.

Expand the investigation only when:

* the current implementation depends on another area;
* an architectural boundary must be confirmed;
* tests reveal related behavior;
* the requested change is explicitly cross-cutting;
* repository documentation points to additional required context.

Prefer targeted searches and file reads over loading large directories or unrelated documentation.

Do not repeatedly read files already examined during the same task unless they may have changed or a specific detail must be verified.

## Before editing

For any substantial change:

1. restate the understood objective;
2. identify the relevant existing behavior;
3. inspect nearby implementation and tests;
4. present a concise implementation plan;
5. identify any material ambiguity or cross-platform risk;
6. wait for approval when the user requested a planning stage.

Small, explicit, low-risk corrections may be applied directly when no separate planning stage was requested.

Do not begin implementation during a planning-only task.

## Task boundaries

Follow the stage separation defined in `AGENTS.md`.

In particular:

* implementation tasks must not silently add documentation, translations, changelog entries, release notes, or version bumps;
* testing tasks must focus on tests for an existing implementation;
* review tasks are read-only unless corrections are explicitly requested;
* release preparation must never create tags, push, or publish releases;
* no task grants implicit permission for Git write operations.

When a useful improvement falls outside the current scope, report it separately instead of implementing it.

## Repository navigation

Use the current repository structure rather than memorized paths.

Before using a command:

* verify it in `package.json`, Cargo configuration, workflow files, scripts, or relevant documentation;
* confirm whether required external tools are available;
* consider whether the command behaves consistently on Windows and Linux.

When locating functionality:

* search by symbol, command name, translation key, event, Tauri command, test description, or visible behavior;
* inspect the closest existing implementation before designing a new abstraction;
* follow imports and call sites only as far as necessary to establish the behavior.

Do not assume a file belongs to a layer solely from its name.

## Delegation

Use specialized subagents when they provide useful context isolation or domain expertise.

Typical delegation targets include:

* frontend and Svelte work;
* Rust and Tauri work;
* tests and coverage;
* technical review;
* documentation;
* translation and i18n;
* release preparation.

Delegate a bounded objective with:

* the expected result;
* relevant files or starting points;
* files or areas that must not be changed;
* required validations;
* expected response format.

Do not delegate the same responsibility to multiple agents without a concrete reason.

The main agent remains responsible for:

* coordinating the task;
* resolving conflicts between findings;
* maintaining scope;
* validating the combined result;
* presenting the final response.

Do not use subagents merely to create more activity or duplicate analysis.

## Skills

Use project skills under `.claude/skills/` when a matching reusable procedure exists.

Skills define task workflows such as:

* planning a feature;
* implementing an approved change;
* adding tests;
* reviewing changes;
* updating documentation;
* updating translations;
* analyzing coverage;
* preparing a release.

Follow the skill's declared:

* purpose;
* expected inputs;
* allowed files;
* prohibited files;
* validation steps;
* final response format.

A skill does not override the Git restrictions or scope rules in `AGENTS.md`.

When no appropriate skill exists, follow `AGENTS.md` and the relevant documentation directly. Do not invent a skill name or pretend that an unavailable procedure was executed.

## Plans

Plans should be concrete and repository-specific.

A useful implementation plan identifies:

* current behavior;
* files or layers likely to change;
* intended data or control flow;
* platform-specific considerations;
* tests or validations;
* explicit non-goals.

Avoid generic steps such as:

* update the code;
* add error handling;
* test the feature;
* update as needed.

Do not include documentation, translations, changelog, or release work in an implementation plan unless the current task explicitly includes those stages.

## Editing behavior

Before creating a new file or abstraction, inspect whether an equivalent pattern already exists.

When editing:

* preserve the existing style of the surrounding code;
* keep diffs focused;
* avoid unrelated formatting changes;
* do not rewrite working code solely for preference;
* do not add compatibility layers without a demonstrated need;
* do not add speculative extension points;
* do not suppress warnings or tests to make validation pass;
* do not replace explicit project conventions with generic best practices.

If generated files must change, modify their source or generator when possible.

## Frontend work

For frontend tasks, inspect the relevant:

* Svelte components;
* TypeScript modules;
* stores and application state;
* editor integrations;
* styles;
* accessibility behavior;
* frontend tests;
* i18n usage.

Preserve established Svelte, TypeScript, CodeMirror, component, state-management, and styling patterns.

Do not move operating-system or filesystem responsibilities into the frontend when they belong in the Tauri/Rust backend.

Do not introduce visible text directly into components when the existing behavior requires localization.

Translation updates remain a separate stage unless explicitly included.

## Rust and Tauri work

For Rust and Tauri tasks, inspect the relevant:

* commands;
* application services;
* infrastructure adapters;
* state;
* filesystem and process integrations;
* toolchain detection;
* Git integration;
* unit and integration tests.

Keep Tauri commands focused on the application boundary.

Place operating-system behavior in the appropriate backend layer and evaluate both Windows and Linux behavior.

Do not assume shell commands, executable locations, path formats, environment variables, or process behavior without verification.

Handle missing tools and operating-system errors explicitly when required by the existing behavior.

## Testing

Run the narrowest relevant validations first.

Expand to broader validation when:

* multiple layers changed;
* shared behavior was modified;
* a regression risk affects unrelated callers;
* the task explicitly requests full validation;
* release preparation requires it.

Do not claim tests, builds, checks, or coverage passed unless they were executed successfully.

When a command fails:

1. inspect the actual error;
2. determine whether it was caused by the change, the environment, or a pre-existing condition;
3. avoid changing unrelated code merely to silence the failure;
4. report unresolved failures clearly.

Do not install missing system dependencies, modify global configuration, or alter the developer environment without explicit permission.

## Git safety

The Git policy in `AGENTS.md` is mandatory.

Claude Code must not infer permission to commit, amend, push, pull, merge, rebase, switch branches, create branches, create tags, discard changes, or publish releases.

Even when Claude Code identifies that a commit or tag is the natural next step, it must only suggest the corresponding Conventional Commit message or manual action.

Never use permission-bypass options to avoid these restrictions.

## Final response

Use the final response format defined in `AGENTS.md`.

Keep the report proportional to the task.

Do not provide a long narrative of every file inspected or every internal reasoning step. Report the decisions, changes, validations, limitations, and out-of-scope findings that are useful to the repository owner.
