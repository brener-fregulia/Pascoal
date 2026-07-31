# Changelog

All notable changes to Pascoal are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses `YEAR.FEAT.PATCH` versioning instead of Semantic Versioning.

## [Unreleased]

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

[unreleased]: https://github.com/brener-fregulia/Pascoal/compare/v2026.1.1...HEAD
[2026.1.1]: https://github.com/brener-fregulia/Pascoal/compare/v2026.1.0...v2026.1.1
[2026.1.0]: https://github.com/brener-fregulia/Pascoal/releases/tag/v2026.1.0