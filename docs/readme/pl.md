# Pascoal

> Nowoczesne IDE Pascala na desktop: pisz, kompiluj i uruchamiaj programy w Pascalu.

[English](../../README.md) · [Português (BR)](pt-BR.md) · [Español (Latinoamérica)](es-419.md)

---

## Czym jest Pascoal?

Pascoal to desktopowe IDE Pascala zbudowane przy użyciu Tauri i Rusta. Projekt ma na celu przybliżenie programowania w Pascalu współczesnym użytkownikom: z czystym interfejsem, prawdziwą kompilacją przez Free Pascal Compiler (FPC) oraz interaktywną konsolą z oddzielnym wyjściem kompilacji i programu.

Projekt powstał jako alternatywa dla przestarzałych narzędzi, takich jak Pascalzim. Celem jest sprawienie, aby Pascal znów był przystępny, wygodny i przyjemny w użyciu — bez ciężaru Electrona i bez chaosu starych interfejsów.

## Funkcje

* **Nowoczesny edytor** z CodeMirror 6, podświetlaniem składni Pascala i reaktywnymi motywami
* **Prawdziwa kompilacja** przez Free Pascal Compiler (FPC)
* **Interaktywna konsola** z oddzielnymi sekcjami dla wyjścia kompilacji i wyjścia programu — `readln` działa
* **Edycja w wielu kartach** — otwieraj kilka plików jednocześnie
* **Trzy motywy** — Dark, Light i Charcoal, z automatycznym wykrywaniem motywu systemowego
* **Natywne kontrolki okna** dostosowane do platformy: macOS, Windows i Linux
* **Automatyczne zapisywanie przed uruchomieniem** — konfigurowalne
* **Lekka aplikacja** — około 25 MB RAM i instalatory około 5 MB

## Wymagania

* [Rust](https://rustup.rs/) stable
* [Node.js](https://nodejs.org/) >= 22
* [Free Pascal Compiler (FPC)](https://www.freepascal.org/download.html) zainstalowany i dostępny w PATH
* [Wymagania Tauri](https://tauri.app/start/prerequisites/) dla twojej platformy

## Pierwsze kroki

```bash
# Sklonuj repozytorium
git clone https://github.com/brener-fregulia/Pascoal.git
cd Pascoal

# Zainstaluj zależności
npm install

# Uruchom w trybie deweloperskim
cargo tauri dev

# Zbuduj wersję produkcyjną
cargo tauri build
```

### Tylko frontend

Rozwój UI bez Tauri:

```bash
npm run dev:ide
```

### Uruchamianie testów

```bash
npm test              # frontend + Rust + Pascal
npm run test:frontend # tylko Vitest
npm run test:rust     # tylko cargo test
npm run test:pascal   # testy integracyjne Pascala, wymagają FPC
```

## Struktura projektu

```txt
src/
  renderer/
    ide/                 # Frontend Svelte + Vite
      src/
        components/      # Komponenty Svelte (Titlebar, TabBar, Editor, Console...)
        icons/           # Komponenty ikon SVG
        stores/          # Store'y Svelte (tabs, theme, console, runner, settings)
        styles/          # Globalny CSS

src-tauri/
  src/
    lib.rs               # Konfiguracja aplikacji i rejestracja komend
    env.rs               # Wykrywanie FPC i katalogu dokumentów
    fs.rs                # Komendy I/O plików
    compiler.rs          # Logika kompilacji przez FPC
    process.rs           # Stan procesu, run_with_pipes, run_with_pty
  tests/                 # Testy jednostkowe Rust
  tauri.conf.json
  Cargo.toml

tests/
  frontend/              # Testy Vitest
  pascal/                # Testy integracyjne Pascala i skrypty

docs/
  readme/                # Tłumaczenia README

scripts/
  set-version.cjs        # Skrypt do zmiany wersji
```

## Stack technologiczny

|            |                              |
| ---------- | ---------------------------- |
| Runtime    | Tauri 2                      |
| Backend    | Rust                         |
| Frontend   | Svelte 5 + Vite + TypeScript |
| Kompilator | Free Pascal (FPC)            |
| Edytor     | CodeMirror 6                 |
| Konsola    | xterm.js                     |
| Testy      | Vitest + cargo test          |

## Roadmap

* [ ] Otwieranie folderu / projektu
* [ ] Integracja z Git
* [ ] Terminal PTY (PowerShell, bash, fish)
* [ ] Trwałe przechowywanie ustawień
* [ ] Gramatyka Tree-sitter dla Pascala (pełne podświetlanie, prowadnice wcięć, outline)
* [ ] Tryb Playground
* [ ] Tryb wyzwań z przypadkami testowymi
* [ ] CI/CD z GitHub Actions

## Współtworzenie

Wkład w projekt jest mile widziany.

Możesz otwierać issues i pull requesty.

## Licencja

[MIT](../../LICENSE) - Brener Fregulia, 2026
