---
name: prepare-release
description: Check or update Pascoal release preparation files without creating tags, pushing, or publishing.
argument-hint: "[check|update] [target version]"
disable-model-invocation: true
---

# Prepare release

Prepare release using:

$ARGUMENTS

## Procedure

1. Read `AGENTS.md` and `docs/development/release-process.md`.
2. Determine whether the requested mode is `check` or `update`.
3. Confirm current version, target version, previous release, and intended scope.
4. Use the `release` subagent when useful.
5. Verify changelog section and comparison links.
6. Verify localized release-note keys and semantic consistency.
7. Identify all current version-bearing files and the existing version script.
8. Verify required tests, builds, workflow behavior, artifact expectations, and signing prerequisites.
9. In `check` mode, remain read-only.
10. In `update` mode, change only explicitly approved release files and use repository scripts where appropriate.

Never create or modify tags, push, publish, delete releases, alter history, or expose signing secrets.

## Output

Report target, readiness checklist, files inspected or changed, validation results, risks, remaining manual actions, and one stage-specific Conventional Commit suggestion when files changed.
