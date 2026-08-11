# Pascoal

> Nowoczesne IDE dla Pascala na komputery stacjonarne - pisz, kompiluj i uruchamiaj programy w Pascalu.

[English](../../README.md) · [Português (BR)](pt-BR.md) · [Español (Latinoamérica)](es-419.md)

---

## Czym jest Pascoal?

Pascoal to lekkie desktopowe IDE dla Pascala, zbudowane z użyciem Tauri, Rust,
Svelte, TypeScript i CodeMirror.

Jego celem jest zapewnienie nowoczesnego interfejsu, rzeczywistej kompilacji za
pomocą Free Pascal, interaktywnego uruchamiania programów, nawigacji po projekcie
oraz wygodnego środowiska zarówno dla studentów, jak i programistów Pascala.

## Pobieranie

Najnowszą wersję można pobrać ze
[strony wydań](https://github.com/brener-fregulia/Pascoal/releases/latest).

- **Windows** - `Pascoal_x.x.x_x64-setup.exe`
- **Linux** - `.deb`, `.rpm` lub `.AppImage`

> **Windows SmartScreen:** Pascoal nie jest obecnie podpisany cyfrowo, dlatego
> Windows może przy pierwszym uruchomieniu wyświetlić ostrzeżenie SmartScreen.

## Funkcje

- Edytor CodeMirror 6 ze strukturalnym podświetlaniem Pascala opartym na Tree-sitter
- Integracja z Free Pascal Compiler (FPC)
- Interaktywna konsola programu z obsługą `readln`
- Edycja w wielu kartach
- Eksplorator plików z operacjami na plikach i folderach
- Wyszukiwanie/zamiana oraz wyszukiwanie w wielu plikach
- Prowadzona instalacja FPC
- Automatyczne aktualizacje aplikacji
- Informacje o wydaniu i historia wersji dostępne w aplikacji
- Menu Plik, Edycja i Pomoc w stylu natywnym
- Ustawienia wyglądu, języka, tożsamości Git i stanu toolchainu
- Motywy Dark, Light i Charcoal
- Interfejs w językach English, Português (BR), Español (Latinoamérica) i Polski
- Obsługa Windows i Linux

## Wymagania

Do pracy nad projektem:

- [Rust](https://rustup.rs/) stable
- [Node.js](https://nodejs.org/) 22 lub nowszy
- [Wymagania wstępne Tauri](https://tauri.app/start/prerequisites/) dla używanej platformy

Do zwykłego korzystania nie trzeba wcześniej instalować FPC; Pascoal potrafi
wykryć brak kompilatora i przeprowadzić użytkownika przez instalację.

## Pierwsze kroki

```bash
git clone https://github.com/brener-fregulia/Pascoal.git
cd Pascoal
npm install
cargo tauri dev
```

Build produkcyjny:

```bash
cargo tauri build
```

Praca tylko nad frontendem:

```bash
npm run dev:ide
```

## Testy

```bash
npm test
npm run test:frontend
npm run test:rust
npm run test:pascal
```

Pełną politykę testów opisano w dokumencie
[Testowanie](../development/testing.md).

## Rozwój

Pascoal korzysta z jawnych kontraktów architektonicznych i procesu
Spec-Driven Development.

- [Architektura](../architecture/README.md)
- [Decyzje architektoniczne](../decisions/README.md)
- [Spec-Driven Development](../development/sdd.md)
- [Proces rozwoju](../development/workflow.md)
- [Testowanie](../development/testing.md)
- [Proces wydawania](../development/release-process.md)
- [Polityka dokumentacji](../development/documentation-policy.md)
- [Changelog](../../CHANGELOG.md)
- [Projekt Pascoal Development](https://github.com/users/brener-fregulia/projects/3)

Zasady repozytorium dotyczące agentów są zdefiniowane w
[AGENTS.md](../../AGENTS.md).

## Stos technologiczny

| | |
|---|---|
| Runtime | Tauri 2 |
| Backend | Rust |
| Frontend | Svelte 5 + Vite + TypeScript |
| Kompilator | Free Pascal (FPC) |
| Edytor | CodeMirror 6 |
| Konsola | xterm.js |
| Kontrola wersji | Git |
| Testy | Vitest + cargo test |

## Współtworzenie

Wkład w projekt jest mile widziany. Zgłoszenia błędów i propozycje nowych funkcji
można dodawać w
[GitHub Issues](https://github.com/brener-fregulia/Pascoal/issues).

Prace rozwojowe powinny być zgodne z dokumentacją repozytorium i wskazanymi wyżej
kontraktami architektonicznymi.

## Licencja

[MIT](../../LICENSE) - Brener Fregulia, 2026
