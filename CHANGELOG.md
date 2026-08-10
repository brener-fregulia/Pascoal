# Changelog

All notable changes to Pascoal are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses `YEAR.FEAT.PATCH` versioning instead of Semantic Versioning.

## [Unreleased]

## [Git panel — Unreleased]

Implemented but not yet enabled - hidden behind `import.meta.env.DEV`
until Git support ships to end users. This section intentionally does
not use the `[Unreleased]` heading above, so a version bump can't
accidentally sweep it into a numbered release: `scripts/extract-changelog.cjs`
(and any straight rename of the `[Unreleased]` heading) treats this
`## [...]` line as its own section boundary. Keep it here, under this
same heading, until the feature is confirmed for release - then fold
it into that release's version section and delete this heading.

### Added
- Git panel (Source Control), reachable from the sidebar: view,
  stage/unstage/discard changes, commit, and initialize a repository.
  Diffs open as their own read-only tab in the editor, side by side,
  instead of inline in the panel.
- Link a project folder to an existing GitHub repository, plus Push,
  Pull, and Sync. An indicator next to the branch name shows how many
  commits you're ahead or behind, kept current by a background check
  every few minutes.
- When committing with nothing staged, Pascoal offers to stage
  everything for you - configurable in Settings to always ask, always
  stage, or never.

### Fixed
- `git status` parsing now uses a more reliable format, fixing file
  names with accented characters and renamed files being handled
  incorrectly.

## [2026.4.0]

### Added
- Edit menu in the titlebar's native menu bar: Undo, Redo, Cut, Copy,
  Paste, Find, Replace, Find in Files, and the new Toggle Line Comment
  command - each action respects whether focus is on the editor or
  the file explorer. Replace now also opens directly with `Ctrl+H`,
  and Find in Files with `Ctrl+Shift+F`.
- Create, rename, and delete files and folders directly from the
  Explorer - toolbar buttons, right-click menu, or `F2`/`Delete`
  shortcuts. Deleted items go to the OS trash/recycle bin, with a
  permanent-delete fallback when that's unavailable.
- Cut, copy, and paste files and folders in the Explorer, with
  shortcuts scoped so they don't interfere with the code editor.
- Select Explorer items and right-click for a context menu (open,
  reveal in file manager, copy path), or press Enter on a focused row
  to open a file / expand a folder.
- Reopen the last workspace automatically on startup - configurable
  in Settings - plus a Recent Workspaces list, with full paths, on
  the Welcome screen and in the File menu.
- Editor zoom - `Ctrl+Scroll` or `Ctrl+`/`Ctrl-` to resize the code
  font, remembered between sessions.
- The Welcome tab can now be closed like any other tab, and reopened
  anytime from Help → Welcome, now the first item in that menu.
- The Explorer/Search side panel can be resized by dragging its edge,
  and remembers its width between sessions. Drag it far enough left
  and it collapses, like VS Code.
- The app window should remember its size and position between launches,
  starting maximized on the very first run.

### Fixed
- The code editor lost its scrollbar on longer files.
- Typing into a running program's console showed each character
  twice, on Linux only.
- `Ctrl+/` (Toggle Line Comment) now inserts `//` line comments
  instead of `(* *)` block comments.

### Security
- File and folder operations are now authorized against the open
  workspace root, preventing them from reaching outside the current
  folder. Added a restrictive Content-Security-Policy, and opening
  URLs or revealing files in the OS file manager now goes through a
  vetted plugin instead of raw process spawns.

## [2026.3.0]

### Added
- Settings panel, reachable from the sidebar - a dedicated screen with
  Themes, Language, Git, and Toolchain sections.
- Git identity (name/email) can now be configured directly in Settings,
  without touching a terminal - useful for anyone new to git. Supports
  a separate identity per project alongside the usual user-wide one.
- Toolchain status page showing whether Free Pascal and git are
  installed, their version, and their location on disk, with a
  one-click install for FPC and a download link for git when missing.

### Changed
- Theme selection moved into the new Settings panel. The old cycle
  icon in the sidebar and the clickable theme name in the status bar
  were removed in favor of it.
- Language selection is now also available from Settings, alongside
  the existing picker in the status bar.

## [2026.2.1]

### Added
- In-app version history (Help → Version History) - browse every past
  release's notes, not just the latest one.

### Changed
- Update notification now shows the same translated, curated note used
  in "What's new" instead of the raw GitHub release body, falling back
  to it only when a version has no translated note.

### Fixed
- CI and release workflows now grant the `actions: write` permission,
  so sccache and rust-cache can actually persist between runs instead
  of silently failing to write and recompiling everything from scratch
  every time.

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

[unreleased]: https://github.com/brener-fregulia/Pascoal/compare/v2026.4.0...HEAD
[2026.4.0]: https://github.com/brener-fregulia/Pascoal/compare/v2026.3.0...v2026.4.0
[2026.3.0]: https://github.com/brener-fregulia/Pascoal/compare/v2026.2.1...v2026.3.0
[2026.2.1]: https://github.com/brener-fregulia/Pascoal/compare/v2026.2.0...v2026.2.1
[2026.2.0]: https://github.com/brener-fregulia/Pascoal/compare/v2026.1.1...v2026.2.0
[2026.1.1]: https://github.com/brener-fregulia/Pascoal/compare/v2026.1.0...v2026.1.1
[2026.1.0]: https://github.com/brener-fregulia/Pascoal/releases/tag/v2026.1.0