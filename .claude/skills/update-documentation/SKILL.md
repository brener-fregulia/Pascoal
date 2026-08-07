---
name: update-documentation
description: Update only the Pascoal documentation required by confirmed code or process changes.
argument-hint: "[change, diff, files, or documentation objective]"
disable-model-invocation: true
---

# Update documentation

Document:

$ARGUMENTS

## Procedure

1. Read `AGENTS.md` and `docs/development/documentation-policy.md`.
2. Inspect the confirmed implementation, diff, tests, or process being documented.
3. Determine the correct source of truth before editing.
4. Use the `documentation` subagent when useful.
5. Update only documents affected by the confirmed change.
6. Verify commands, paths, links, supported platforms, versions, and terminology.
7. Avoid duplicating details already owned by another document.
8. Identify translated content that requires a separate translation stage.

Do not alter production code, tests, versions, or release workflows unless explicitly included.

## Output

Report documents evaluated, files changed, facts verified, follow-up translation needs, validation performed, and one `docs(...)` Conventional Commit suggestion.
