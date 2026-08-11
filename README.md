# Pascoal

> A modern Pascal IDE for desktop - write, compile, and run Pascal programs.

[Português (BR)](docs/readme/pt-BR.md) · [Español (Latinoamérica)](docs/readme/es-419.md) · [Polski](docs/readme/pl.md)

---

## What is Pascoal?

Pascoal is a lightweight desktop IDE for Pascal, built with Tauri, Rust, Svelte,
TypeScript, and CodeMirror.

It focuses on a modern interface, real Free Pascal compilation, interactive
program execution, project navigation, and a development experience suitable for
students and Pascal developers.

## Download

Download the latest release from the
[Releases page](https://github.com/brener-fregulia/Pascoal/releases/latest).

- **Windows** - `Pascoal_x.x.x_x64-setup.exe`
- **Linux** - `.deb`, `.rpm`, or `.AppImage`

> **Windows SmartScreen:** Pascoal is not currently code-signed, so Windows may
> display a SmartScreen warning on first launch.

## Features

- CodeMirror 6 editor with structural Pascal highlighting powered by Tree-sitter
- Free Pascal Compiler (FPC) integration
- Interactive program console with `readln` support
- Multi-tab editing
- File explorer with file and folder operations
- Find/replace and cross-file search
- Guided FPC installation
- Automatic application updates
- In-app release notes and version history
- Native-style File, Edit, and Help menus
- Settings for appearance, language, Git identity, and toolchain status
- Dark, Light, and Charcoal themes
- English, Português (BR), Español (Latinoamérica), and Polski UI
- Windows and Linux support

## Requirements

For development:

- [Rust](https://rustup.rs/) stable
- [Node.js](https://nodejs.org/) 22 or newer
- [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your platform

FPC does not need to be installed beforehand for normal use; Pascoal can detect a
missing compiler and guide its installation.

## Getting started

```bash
git clone https://github.com/brener-fregulia/Pascoal.git
cd Pascoal
npm install
cargo tauri dev
```

Build for production:

```bash
cargo tauri build
```

Frontend-only development:

```bash
npm run dev:ide
```

## Testing

```bash
npm test
npm run test:frontend
npm run test:rust
npm run test:pascal
```

See [Testing](docs/development/testing.md) for the complete testing policy.

## Development

Pascoal uses explicit architecture contracts and a Spec-Driven Development
workflow.

- [Architecture](docs/architecture/README.md)
- [Architectural decisions](docs/decisions/README.md)
- [Spec-Driven Development](docs/development/sdd.md)
- [Development workflow](docs/development/workflow.md)
- [Testing](docs/development/testing.md)
- [Release process](docs/development/release-process.md)
- [Documentation policy](docs/development/documentation-policy.md)
- [Changelog](CHANGELOG.md)
- [Pascoal Development project](https://github.com/users/brener-fregulia/projects/3)

Agent-specific repository rules are defined in [AGENTS.md](AGENTS.md).

## Tech stack

| | |
|---|---|
| Runtime | Tauri 2 |
| Backend | Rust |
| Frontend | Svelte 5 + Vite + TypeScript |
| Compiler | Free Pascal (FPC) |
| Editor | CodeMirror 6 |
| Console | xterm.js |
| Version control | Git |
| Tests | Vitest + cargo test |

## Contributing

Contributions are welcome. Bug reports and feature requests can be opened through
the repository's [GitHub Issues](https://github.com/brener-fregulia/Pascoal/issues).

Development work should follow the repository documentation and architecture
contracts linked above.

## License

[MIT](LICENSE) - Brener Fregulia, 2026
