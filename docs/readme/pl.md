# Pascoal

> Nowoczesne IDE Pascala na komputery stacjonarne — pisz, kompiluj i uruchamiaj programy w Pascalu.

[English](../../README.md) · [Português (BR)](pt-BR.md) · [Español (Latinoamérica)](es-419.md)

---

## Czym jest Pascoal?

Pascoal to desktopowe IDE Pascala stworzone przy użyciu Tauri i Rusta, zaprojektowane z myślą o przybliżeniu programowania w Pascalu współczesnym użytkownikom. Czysty interfejs, prawdziwa kompilacja za pomocą Free Pascal Compiler (FPC), interaktywna konsola programu, eksplorator plików, wyszukiwanie w wielu plikach oraz integracja z Git — wszystko w jednym lekkim pakiecie.

Projekt powstał jako bunt przeciwko przestarzałym narzędziom, takim jak Pascalzim, z celem uczynienia Pascala ponownie przystępnym i przyjemnym w użyciu — bez ciężaru Electrona i bałaganu starych interfejsów.

## Funkcje

- **Nowoczesny edytor** oparty na CodeMirror 6 z podświetlaniem składni Pascala i reaktywnymi motywami
- **Prawdziwa kompilacja** za pomocą Free Pascal Compiler (FPC)
- **Interaktywna konsola** z oddzielnymi sekcjami dla kompilacji i wyjścia programu — `readln` działa
- **Edycja w wielu kartach** — otwieraj wiele plików jednocześnie
- **Eksplorator plików** — otwieraj foldery i przeglądaj pliki Pascala
- **Znajdź i zamień** — pływający widget w stylu VS Code z podświetlaniem wyników oraz wyszukiwaniem we wszystkich plikach otwartego folderu
- **Integracja z Git** — przegląd statusu, stage/unstage, podgląd diffów, commity i inicjalizacja repozytoriów z poziomu dedykowanego panelu
- **Natywne menu systemowe** — menu Plik i Pomoc zintegrowane z paskiem tytułu oraz bezpośrednie odnośniki do zgłaszania błędów i propozycji funkcji na GitHubie
- **Trzy motywy** — Dark, Light i Charcoal z automatycznym wykrywaniem motywu systemowego
- **Natywne kontrolki okna** dostosowane do platformy (traffic lights w macOS, styl Windows/Linux)
- **Automatyczne zapisywanie przed uruchomieniem** — konfigurowalne
- **Interfejs wielojęzyczny** — English, Português (BR), Español (Latinoamérica) i Polski z zapamiętywaniem wybranego języka
- **Lekka aplikacja** — około 25 MB pamięci RAM i instalatory o rozmiarze około 5 MB

## Wymagania

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) >= 22
- [Free Pascal Compiler (FPC)](https://www.freepascal.org/download.html) zainstalowany i dostępny w zmiennej PATH
- [Git](https://git-scm.com/) zainstalowany i dostępny w zmiennej PATH (wymagany dla panelu Git)
- [Wymagania Tauri](https://tauri.app/start/prerequisites/) dla Twojej platformy

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

### Tylko frontend (rozwój UI bez Tauri)

```bash
npm run dev:ide
```

### Wskazówki dla programistów

Aby przyspieszyć ponowne kompilacje Rusta podczas pracy, zainstaluj [sccache](https://github.com/mozilla/sccache):

```bash
cargo install sccache
```

Następnie ustaw go jako wrapper kompilatora Rust w `src-tauri/.cargo/config.toml`:

```toml
[build]
rustc-wrapper = "sccache"
```

Jest on również używany w CI do przyspieszenia kompilacji w GitHub Actions.

### Uruchamianie testów

```bash
npm test              # frontend + Rust + Pascal
npm run test:frontend # tylko Vitest
npm run test:rust     # tylko cargo test
npm run test:pascal   # testy integracyjne Pascala (wymagają FPC)
```

## Struktura projektu

```text
src/
  renderer/
    ide/                    # Frontend Svelte + Vite
      src/
        components/         # Komponenty Svelte (Titlebar, TabBar, Editor, Console, FileTree, SearchPanel, GitPanel, FindWidget, AboutModal...)
        icons/              # Komponenty ikon SVG
        stores/             # Store'y Svelte (tabs, theme, console, runner, settings, explorerStore, searchStore, gitStore...)
        i18n/               # Pliki lokalizacji i store tłumaczeń
        styles/             # Globalny CSS
src-tauri/
  src/
    lib.rs                  # Konfiguracja aplikacji i rejestracja komend
    env.rs                  # Wykrywanie FPC i katalog dokumentów
    fs.rs                   # Komendy I/O plików, eksplorator folderów i wyszukiwanie w wielu plikach
    git.rs                  # Komendy Git: status, stage, diff, commit i init
    compiler.rs             # Logika kompilacji FPC
    installer.rs            # Wykrywanie menedżera pakietów FPC i instalacja z przewodnikiem
    process.rs              # Stan procesów, run_with_pipes, run_with_pty
    tests/                  # Testy jednostkowe Rust
  tauri.conf.json
  Cargo.toml
tests/
  frontend/                 # Testy Vitest
  pascal/                   # Testy integracyjne Pascala i skrypty
docs/
  readme/                   # Tłumaczenia README
scripts/
  set-version.cjs           # Skrypt aktualizacji wersji
```

## Stos technologiczny

| | |
|---|---|
| Runtime | Tauri 2 |
| Backend | Rust |
| Frontend | Svelte 5 + Vite + TypeScript |
| Kompilator | Free Pascal (FPC) |
| Edytor | CodeMirror 6 |
| Konsola | xterm.js |
| Kontrola wersji | Git (przez CLI) |
| Testy | Vitest + cargo test |

## Roadmap

- [x] Ostatnie pliki (ekran powitalny)
- [x] Otwieranie folderu / projektu
- [x] Integracja z Git
- [x] Znajdź i zamień, wyszukiwanie w wielu plikach
- [x] GitHub Actions CI/CD
- [ ] Kreator instalacji FPC (automatyczna instalacja przez winget/apt/pacman/dnf/zypper)
- [ ] Terminal PTY (PowerShell, bash, fish)
- [ ] Oddzielne okno terminala do uruchamiania programów Pascala
- [ ] Zapamiętywanie ustawień (rozmiar czcionki edytora, położenie konsoli)
- [ ] Gramatyka Pascala oparta na Tree-sitter (pełne podświetlanie składni, prowadnice wcięć, outline kodu)
- [ ] Tryb Playground
- [ ] Tryb Challenge z zestawami testów

## Współtworzenie

Wkład w projekt jest mile widziany. Zachęcamy do otwierania issues i pull requestów. Zgłoszenia błędów i propozycje nowych funkcji korzystają z ustrukturyzowanych formularzy GitHub Issue Forms, dostępnych bezpośrednio z menu Pomoc w aplikacji.

## Licencja

[MIT](../../LICENSE) - Brener Fregulia, 2026