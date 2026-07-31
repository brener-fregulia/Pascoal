# Pascoal

> Nowoczesne IDE Pascala na komputery stacjonarne — pisz, kompiluj i uruchamiaj programy w Pascalu.

[English](../../README.md) · [Português (BR)](pt-BR.md) · [Español (Latinoamérica)](es-419.md)

---

## Czym jest Pascoal?

Pascoal to desktopowe IDE Pascala stworzone przy użyciu Tauri i Rusta, zaprojektowane z myślą o przybliżeniu programowania w Pascalu współczesnym użytkownikom. Czysty interfejs, prawdziwa kompilacja za pomocą Free Pascal Compiler (FPC), interaktywna konsola programu, eksplorator plików i wyszukiwanie w wielu plikach — wszystko w jednym lekkim pakiecie.

Projekt powstał jako bunt przeciwko przestarzałym narzędziom, takim jak Pascalzim, z celem uczynienia Pascala ponownie przystępnym i przyjemnym w użyciu — bez ciężaru Electrona i bałaganu starych interfejsów.

## Pobieranie

Pobierz najnowszy instalator dla swojej platformy ze [strony Releases](https://github.com/brener-fregulia/Pascoal/releases/latest):

- **Windows** — `Pascoal_x.x.x_x64-setup.exe`
- **Linux** — `.deb` (Debian/Ubuntu), `.rpm` (Fedora/openSUSE) lub `.AppImage` (dowolna dystrybucja)

> **Ostrzeżenie SmartScreen w Windows:** instalator Pascoal nie jest jeszcze podpisany cyfrowo, więc Windows może przy pierwszym uruchomieniu wyświetlić komunikat "Windows chronił Twój komputer". To normalne w przypadku nowych, niepodpisanych aplikacji — kliknij **Więcej informacji** → **Uruchom mimo to**, aby kontynuować. Ostrzeżenie zniknie z czasem, w miarę jak coraz więcej osób pobierze i uruchomi Pascoal.

## Funkcje

- **Nowoczesny edytor** oparty na CodeMirror 6, ze strukturalnym podświetlaniem składni Pascala dzięki prawdziwej gramatyce Tree-sitter (nie regex) i reaktywnymi motywami
- **Prawdziwa kompilacja** za pomocą Free Pascal Compiler (FPC)
- **Interaktywna konsola** z oddzielnymi sekcjami dla kompilacji i wyjścia programu — `readln` działa
- **Edycja w wielu kartach** — otwieraj wiele plików jednocześnie
- **Eksplorator plików** — otwieraj foldery i przeglądaj pliki Pascala
- **Znajdź i zamień** — pływający widget w stylu VSCode z podświetlaniem wyników oraz wyszukiwaniem we wszystkich plikach otwartego folderu
- **Kreator instalacji FPC** — wykrywa brak Free Pascala i oferuje jego automatyczną instalację przez winget, apt, pacman, dnf lub zypper
- **Automatyczne aktualizacje** — sprawdza dostępność nowych wersji i instaluje je automatycznie, z opcją ręcznego sprawdzenia aktualizacji
- **Nowości** — krótka notatka w aplikacji po każdej aktualizacji, z linkiem do pełnego [changeloga](../../CHANGELOG.md)
- **Natywne menu systemowe** — menu Plik i Pomoc zintegrowane z paskiem tytułu oraz bezpośrednie odnośniki do zgłaszania błędów i propozycji funkcji na GitHubie
- **Trzy motywy** — Dark, Light i Charcoal z automatycznym wykrywaniem motywu systemowego
- **Natywne kontrolki okna** dostosowane do platformy (traffic lights w macOS, styl Windows/Linux)
- **Automatyczne zapisywanie przed uruchomieniem** — konfigurowalne
- **Interfejs wielojęzyczny** — English, Português (BR), Español (Latinoamérica) i Polski z zapamiętywaniem wybranego języka
- **Lekka aplikacja** — zużywa około 170 MB pamięci RAM w systemie Windows (WebView2), 270 MB w systemie Linux (WebKitGTK), a instalatory mają rozmiar około 5 MB

## Wymagania

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) >= 22
- [Free Pascal Compiler (FPC)](https://www.freepascal.org/download.html) — nie trzeba instalować go wcześniej; Pascoal wykrywa jego brak i proponuje instalację
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
src/                       # Frontend Svelte + Vite, uporządkowany według domen
  app/                       # Shell (Titlebar, ActivityBar, Statusbar), okna dialogowe (About, FpcMissing,
                              # UpdateAvailable, WhatsNew), ekran powitalny, stan app/settings
  editor/                    # Integracja z CodeMirror, stan kart/sesji, Editor/EditorArea/FindWidget
  language/pascal/           # Frontendowa część podświetlania przez Tree-sitter (klient + dekoracje)
  project/                   # Eksplorator plików i wyszukiwanie w wielu plikach
  toolchain/                 # Orkiestracja kompilacji/uruchamiania, konsola builda, UI instalacji FPC
  integrations/
    tauri/                    # Jedyny punkt kontaktu z mostem IPC Tauri
    git/                       # Panel i store Git
    updater/                   # Store automatycznej aktualizacji
  shared/                    # Komponenty międzydomenowe (IconButton, PanelHeader, Tab, TabBar) i motyw
  icons/                     # Komponenty ikon SVG
  i18n/                      # Pliki lokalizacji, store tłumaczeń, release-notes/ (opisy changeloga, ładowane leniwie)
  styles/                    # Globalny CSS
src-tauri/
  src/
    lib.rs                    # Tylko konfiguracja aplikacji i rejestracja komend
    commands/                 # Cienkie adaptery komend Tauri
    application/              # Przypadki użycia (analyze_document, run_program, manage_files,
                                # manage_workspace, install_toolchain)
    language/pascal/          # Podświetlanie przez Tree-sitter i jego zvendorowana query
    project/                  # Explorer, otwieranie/zapisywanie plików, wyszukiwanie w wielu plikach
    toolchain/
      compiler/                 # Kompilacja przez FPC
      installer.rs               # Wykrywanie menedżera pakietów i instalacja z przewodnikiem
      runner.rs                  # Wykonywanie procesów (pipes/PTY)
    infrastructure/            # filesystem, git, environment, platform - prymitywy systemowe
    state/                     # Współdzielony stan aplikacji (ProcessState)
    tests/                     # Testy jednostkowe Rust
  tests/
    pascal_runner.rs           # Testy integracyjne Pascala (kompiluje/uruchamia rzeczywiste fixtures, wymaga FPC)
  tauri.conf.json
  Cargo.toml
tests/
  frontend/                  # Testy Vitest
  pascal/                    # Fixtures testów integracyjnych Pascala (.pas + specs.json)
docs/
  readme/                    # Tłumaczenia README
scripts/
  set-version.cjs            # Skrypt aktualizacji wersji (czyści też cache builda Rust,
                              # ostrzega, jeśli brakuje wpisu w CHANGELOG.md dla nowej wersji)
  extract-changelog.cjs      # Wyciąga sekcję CHANGELOG.md na potrzeby procesu release
CHANGELOG.md                 # Format Keep a Changelog, staje się treścią release na GitHubie
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
- [x] Znajdź i zamień, wyszukiwanie w wielu plikach
- [x] GitHub Actions CI/CD
- [x] Kreator instalacji FPC (automatyczna instalacja przez winget/apt/pacman/dnf/zypper)
- [x] Sprawdzanie wersji / aktualizator
- [x] Gramatyka Pascala oparta na Tree-sitter (strukturalne podświetlanie składni)
- [x] Changelog / informacje o wersji w aplikacji
- [ ] Integracja z Git (zaimplementowana, ale niewłączona w pierwszym wydaniu)
- [ ] Terminal PTY (PowerShell, bash, fish)
- [ ] Oddzielne okno terminala do uruchamiania programów Pascala
- [ ] Zapamiętywanie ustawień (rozmiar czcionki edytora, położenie konsoli)
- [ ] Prowadnice wcięć i outline kodu przez Tree-sitter
- [ ] Tryb Playground
- [ ] Tryb Challenge z zestawami testów

## Współtworzenie

Wkład w projekt jest mile widziany. Zachęcamy do otwierania issues i pull requestów. Zgłoszenia błędów i propozycje nowych funkcji korzystają z ustrukturyzowanych formularzy [GitHub Issue Forms](../../.github/ISSUE_TEMPLATE/), dostępnych bezpośrednio z menu Pomoc w aplikacji.

## Licencja

[MIT](../../LICENSE) - Brener Fregulia, 2026
