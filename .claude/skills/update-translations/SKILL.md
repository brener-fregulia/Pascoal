---
name: Update translations
description: Synchronize scoped Pascoal i18n, translated documentation, or localized release notes from an authoritative source.
argument-hint: "[keys, source text, locales, or changed file]"
disable-model-invocation: true
---

# Update translations

Translate or synchronize:

$ARGUMENTS

## Procedure

1. Read `AGENTS.md` and `docs/development/documentation-policy.md`.
2. Inspect the authoritative source and current locale structure.
3. Identify supported locales and established terminology.
4. Use the `translation` subagent when useful.
5. Preserve keys, order where meaningful, nesting, placeholders, interpolation, markup, and semantic intent.
6. Change only the requested keys or sections unless synchronization requires additional directly related entries.
7. Validate syntax, key parity, placeholder parity, and terminology.
8. Report unresolved source ambiguity rather than guessing.

## Output

Report source language, locales updated, files changed, ambiguities, validation performed, and one appropriate `i18n(...)` or `docs(i18n): ...` commit suggestion.
