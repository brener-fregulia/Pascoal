# Pascoal

> A modern Pascal IDE for desktop - write, compile, and run Pascal programs.

[Português (BR)](docs/readme/pt-BR.md) · [Español (Latinoamérica)](docs/readme/es-419.md)

---

## What is Pascoal?

Pascoal is a desktop Pascal IDE built with Tauri and Rust, designed to bring Pascal programming to a modern audience. Clean interface, real compilation via Free Pascal (FPC), and an interactive program console - all in one lightweight package.

It was born as a rebellion against outdated tools like Pascalzim, with the goal of making Pascal approachable and fun again - without the weight of Electron or the clutter of legacy UIs.

## Features

- **Modern editor** powered by CodeMirror 6 with Pascal syntax highlighting and reactive theming
- **Real compilation** via Free Pascal Compiler (FPC)
- **Interactive console** with separate build and program output zones - `readln` works
- **Multi-tab editing** - open multiple files simultaneously
- **Three themes** - Dark, Light and Charcoal, with system detection
- **Native window controls** adapted per platform (macOS traffic lights, Windows/Linux style)
- **Auto-save before run** - configurable
- **Lightweight** - ~25MB RAM, ~5MB installers

## Requirements

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) >= 22
- [Free Pascal Compiler (FPC)](https://www.freepascal.org/download.html) installed and available in PATH
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
        components/         # Svelte components (Titlebar, TabBar, Editor, Console...)
        icons/              # SVG icon components
        stores/             # Svelte stores (tabs, theme, console, runner, settings)
        styles/             # Global CSS
src-tauri/
  src/
    lib.rs                  # App setup and command registration
    env.rs                  # FPC detection and documents directory
    fs.rs                   # File I/O commands
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
| Tests | Vitest + cargo test |

## Roadmap

- [ ] Open Folder / Project
- [ ] Git integration
- [ ] PTY terminal (PowerShell, bash, fish)
- [ ] Settings persistence
- [ ] Pascal Tree-sitter grammar (full syntax highlighting, indent guides, code outline)
- [ ] Playground mode
- [ ] Challenge mode with test cases
- [ ] GitHub Actions CI/CD

## Contributing

Contributions are welcome. Feel free to open issues or pull requests.

## License

[MIT](LICENSE) - Brener Fregulia, 2026