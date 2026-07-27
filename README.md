# Pascoal

> A modern Pascal IDE for desktop - write, compile, and run Pascal programs.

[Português (BR)](docs/readme/pt-BR.md) · [Español (Latinoamérica)](docs/readme/es-419.md) · [Polski](docs/readme/pl.md)

---

## What is Pascoal?

Pascoal is a desktop Pascal IDE built with Tauri and Rust, designed to bring Pascal programming to a modern audience. Clean interface, real compilation via Free Pascal (FPC), an interactive program console, file explorer, and cross-file search - all in one lightweight package.

It was born as a rebellion against outdated tools like Pascalzim, with the goal of making Pascal approachable and fun again - without the weight of Electron or the clutter of legacy UIs.

## Download

Grab the latest installer for your platform from the [Releases page](https://github.com/brener-fregulia/Pascoal/releases/latest):

- **Windows** - `Pascoal_x.x.x_x64-setup.exe`
- **Linux** - `.deb` (Debian/Ubuntu), `.rpm` (Fedora/openSUSE), or `.AppImage` (any distro)

> **Windows SmartScreen warning:** Pascoal's installer isn't code-signed yet, so Windows may show "Windows protected your PC" the first time you run it. This is normal for new, unsigned applications - click **More info** → **Run anyway** to proceed. The warning fades away over time as more people download and run Pascoal.

## Features

- **Modern editor** powered by CodeMirror 6 with Pascal syntax highlighting and reactive theming
- **Real compilation** via Free Pascal Compiler (FPC)
- **Interactive console** with separate build and program output zones - `readln` works
- **Multi-tab editing** - open multiple files simultaneously
- **File explorer** - open a folder and browse its Pascal files
- **Find and replace** - VSCode-style floating widget with match highlighting, plus cross-file search across an open folder
- **Guided FPC installer** - detects if Free Pascal isn't installed and offers to install it automatically via winget, apt, pacman, dnf, or zypper
- **Auto-update** - checks for new versions and installs them automatically, with a manual "check for updates" option
- **Native OS menu** - File and Help menus integrated into the titlebar, with direct links to report bugs or request features on GitHub
- **Three themes** - Dark, Light and Charcoal, with system detection
- **Native window controls** adapted per platform (macOS traffic lights, Windows/Linux style)
- **Auto-save before run** - configurable
- **Internationalized UI** - English, Português (BR), Español (Latinoamérica), and Polski, with persisted locale selection
- **Lightweight** - ~170MB RAM on Windows (WebView2), ~270MB on Linux (WebKitGTK), small installers

## Requirements

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) >= 22
- [Free Pascal Compiler (FPC)](https://www.freepascal.org/download.html) - not required beforehand, Pascoal detects if it's missing and offers to install it for you
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
src/                       # Svelte + Vite frontend
  components/              # Svelte components (Titlebar, TabBar, Editor, Console, FileTree, SearchPanel, GitPanel, FindWidget, AboutModal...)
  icons/                   # SVG icon components
  stores/                  # Svelte stores (tabs, theme, console, runner, settings, explorerStore, searchStore, gitStore...)
  i18n/                    # Locale files and translation store
  styles/                  # Global CSS
src-tauri/
  src/
    lib.rs                  # App setup and command registration
    env.rs                  # FPC detection and documents directory
    fs.rs                   # File I/O, folder explorer, and cross-file search commands
    git.rs                  # Git status, stage, diff, commit, and init commands
    compiler.rs             # FPC compilation logic
    installer.rs            # FPC package manager detection and guided install
    winproc.rs              # Suppress console window flashes on Windows
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
- [x] Find and replace, cross-file search
- [x] GitHub Actions CI/CD
- [x] Guided FPC installer (auto-install via winget/apt/pacman/dnf/zypper)
- [x] Version checker / updater
- [ ] Git integration (implemented, not enabled for the first release)
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