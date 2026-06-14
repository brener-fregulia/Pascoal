# Pascoal

> A modern Pascal playground for desktop — write, compile, and run Pascal programs with style.

🌐 [Português (BR)](docs/readme/pt-BR.md)

---

## What is Pascoal?

Pascoal is a desktop Pascal IDE built with Electron, designed to bring Pascal programming to a modern audience. Clean interface, real compilation via Free Pascal (FPC), and interactive terminal — all in one place.

It was born as a rebellion against outdated tools like Pascalzim, with the goal of making Pascal approachable and fun again.

## Features

- **Modern editor** powered by Ace Editor with Pascal syntax highlighting
- **Real compilation** via Free Pascal Compiler (FPC)
- **Interactive terminal** with TTY support via node-pty
- **Cross-platform** — Windows and Linux (macOS planned)
- **Native window controls** adapted per platform (macOS traffic lights, Windows/Linux style)
- **i18n support** — Portuguese (BR) and English out of the box
- **Dark theme** with a clean, minimal aesthetic

## Requirements

- [Node.js](https://nodejs.org/) >= 22.12.0
- [Free Pascal Compiler (FPC)](https://www.freepascal.org/download.html) installed and available in PATH

## Getting started

```bash
# Clone the repository
git clone https://github.com/brener-fregulia/Pascoal.git
cd Pascoal

# Install dependencies
npm install

# Run in development mode (opens DevTools automatically)
npm run dev

# Run normally
npm start
```

## Project structure

```
src/
  main/
    constants.js        # Single source of truth for app constants
    fpc.js              # FPC detection and install prompts
    preload.js          # Electron context bridge
    main.js             # App entry point
    handlers/           # IPC handlers (app, activities, compiler, window)
    i18n/               # Main process translations (native dialogs)
  renderer/
    index.html
    css/                # Stylesheets per component
    js/                 # Renderer scripts
    partials/           # HTML templates rendered via Mustache
    i18n/               # Renderer translations (pt-BR, en-US)
docs/
  readme/               # Translations of this README
```

## Tech stack

| | |
|---|---|
| Runtime | Electron 42 |
| Compiler | Free Pascal (FPC) |
| Terminal | node-pty |
| Editor | Ace Editor |
| Templates | Mustache |

## Contributing

Contributions are welcome. Feel free to open issues or pull requests.

## License

[MIT](LICENSE) — Brener Fregulia, 2026
