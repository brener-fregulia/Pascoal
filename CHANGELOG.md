# Changelog

All notable changes to Pascoal are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses `YEAR.FEAT.PATCH` versioning instead of Semantic Versioning.

## [Unreleased]

## [2026.2.0]

### Added
- In-app "What's new" note shown once after an update, with a link to
  the full changelog. Reachable anytime from Help → Release Notes.
- `CHANGELOG.md` itself, following Keep a Changelog - now powers the
  GitHub release description automatically.

### Changed
- Tagged releases now fail before building if `CHANGELOG.md` has no
  entry for that version, instead of publishing with a placeholder
  description.
- README (all four languages) updated to reflect the new domain-based
  project structure.

## [2026.1.1]

### Fixed
- Syntax highlighting now correctly distinguishes types, functions, and
  variables, powered by a real Tree-sitter Pascal parser instead of
  regex-based guessing.
- Compiler directives (`{$mode objfpc}`) no longer render as comments.

### Changed
- Tagged releases now publish automatically instead of sitting as a draft.

## [2026.1.0]

### Added
- Initial public release.
- Guided Free Pascal installer for Windows and Linux.
- Automatic updates via a signed updater.
- CodeMirror-based Pascal editor with a build/run console.

[unreleased]: https://github.com/brener-fregulia/Pascoal/compare/v2026.2.0...HEAD
[2026.2.0]: https://github.com/brener-fregulia/Pascoal/compare/v2026.1.1...v2026.2.0
[2026.1.1]: https://github.com/brener-fregulia/Pascoal/compare/v2026.1.0...v2026.1.1
[2026.1.0]: https://github.com/brener-fregulia/Pascoal/releases/tag/v2026.1.0