# Pascoal

> A modern Pascal IDE for desktop - write, compile, and run Pascal programs.

[Português (BR)](docs/readme/pt-BR.md) · [Español (Latinoamérica)](docs/readme/es-419.md) · [Polski](docs/readme/pl.md)

---

## What is Pascoal?

Pascoal is a desktop Pascal IDE built with Tauri and Rust, designed to bring Pascal programming to a modern audience. Clean interface, real compilation via Free Pascal (FPC), an interactive program console, file explorer, cross-file search, and Git integration - all in one lightweight package.

It was born as a rebellion against outdated tools like Pascalzim, with the goal of making Pascal approachable and fun again - without the weight of Electron or the clutter of legacy UIs.

## Features

- **Modern editor** powered by CodeMirror 6 with Pascal syntax highlighting and reactive theming
- **Real compilation** via Free Pascal Compiler (FPC)
- **Interactive console** with separate build and program output zones - `readln` works
- **Multi-tab editing** - open multiple files simultaneously
- **File explorer** - open a folder and browse its Pascal files
- **Find and replace** - VSCode-style floating widget with match highlighting, plus cross-file search across an open folder
- **Git integration** - view status, stage/unstage, inspect diffs, commit, and initialize repositories, all from a dedicated panel
- **Native OS menu** - File and Help menus integrated into the titlebar, with direct links to report bugs or request features on GitHub
- **Three themes** - Dark, Light and Charcoal, with system detection
- **Native window controls** adapted per platform (macOS traffic lights, Windows/Linux style)
- **Auto-save before run** - configurable
- **Internationalized UI** - English, Português (BR), Español (Latinoamérica), and Polski, with persisted locale selection
- **Lightweight** - ~25MB RAM, ~5MB installers

## Requirements

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) >= 22
- [Free Pascal Compiler (FPC)](https://www.freepascal.org/download.html) installed and available in PATH
- [Git](https://git-scm.com/) installed and available in PATH (required for the Git panel)
- [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your platform

## Getting started

```bash
# Clone the repository
git clone https://github.com/brener-fregulia/Pascoal.git
cd Pascoal

# Install dependencies
npm install

# Run in development mode
cargo tauri dev

# Build for production
cargo tauri build
```

### Frontend only (UI development without Tauri)

```bash
npm run dev:ide
```

### Development tips

To speed up Rust rebuilds during development, install [sccache](https://github.com/mozilla/sccache):

```bash
cargo install sccache
```

Then set it as the Rust compiler wrapper in `src-tauri/.cargo/config.toml`:

```toml
[build]
rustc-wrapper = "sccache"
```

This is also used in CI to speed up builds on GitHub Actions runners.

### Running tests

```bash
npm test              # frontend + Rust + Pascal
npm run test:frontend # Vitest only
npm run test:rust     # cargo test only
npm run test:pascal   # Pascal integration tests (requires FPC)
```

## Project structure

```
src/
  renderer/
    ide/                    # Svelte + Vite frontend
      src/
        components/         # Svelte components (Titlebar, TabBar, Editor, Console, FileTree, SearchPanel, GitPanel, FindWidget, AboutModal...)
        icons/               # SVG icon components
        stores/              # Svelte stores (tabs, theme, console, runner, settings, explorerStore, searchStore, gitStore...)
        i18n/                # Locale files and translation store
        styles/              # Global CSS
src-tauri/
  src/
    lib.rs                  # App setup and command registration
    env.rs                  # FPC detection and documents directory
    fs.rs                   # File I/O, folder explorer, and cross-file search commands
    git.rs                  # Git status, stage, diff, commit, and init commands
    compiler.rs             # FPC compilation logic
    process.rs              # Process state, run_with_pipes, run_with_pty
    tests/                  # Rust unit tests
  tauri.conf.json
  Cargo.toml
tests/
  frontend/                 # Vitest tests
  pascal/                   # Pascal integration tests and scripts
docs/
  readme/                   # README translations
scripts/
  set-version.cjs           # Version bump script
```

## Tech stack

| | |
|---|---|
| Runtime | Tauri 2 |
| Backend | Rust |
| Frontend | Svelte 5 + Vite + TypeScript |
| Compiler | Free Pascal (FPC) |
| Editor | CodeMirror 6 |
| Console | xterm.js |
| Version control | Git (via CLI) |
| Tests | Vitest + cargo test |

## Roadmap

- [x] Recent files (Welcome screen)
- [x] Open Folder / Project
- [x] Git integration
- [x] Find and replace, cross-file search
- [x] GitHub Actions CI/CD
- [ ] Guided FPC installer (auto-install via winget/apt/pacman/dnf/zypper)
- [ ] Version checker / updater
- [ ] PTY terminal (PowerShell, bash, fish)
- [ ] Detached terminal window for running Pascal programs
- [ ] Settings persistence (editor font size, console position)
- [ ] Pascal Tree-sitter grammar (full syntax highlighting, indent guides, code outline)
- [ ] Playground mode
- [ ] Challenge mode with test cases

## Contributing

Contributions are welcome. Feel free to open issues or pull requests. Bug reports and feature requests use structured [GitHub Issue Forms](.github/ISSUE_TEMPLATE/) - available directly from the app's Help menu.

## License

[MIT](LICENSE) - Brener Fregulia, 2026